// @ts-nocheck - Test mocks have loose typing
import { describe, expect, it, vi } from "vitest";
import { createOpenAIWrapper } from "../wrap-openai";

describe("OpenAI Wrapper", () => {
  it("tracks tokens from non-streaming chat completion", async () => {
    const trackFn = vi.fn();
    const mockClient = {
      chat: {
        completions: {
          create: vi.fn(async () => ({
            model: "gpt-4o",
            usage: {
              prompt_tokens: 100,
              completion_tokens: 50,
            },
          })),
        },
      },
    };

    const wrapped = createOpenAIWrapper(mockClient, trackFn);
    const result = await (wrapped as any).chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: "Hello" }],
    });

    expect(result.model).toBe("gpt-4o");
    expect(trackFn).toHaveBeenCalledTimes(1);
    expect(trackFn).toHaveBeenCalledWith({
      provider: "openai",
      model: "gpt-4o",
      tokensPrompt: 100,
      tokensCompletion: 50,
      attribution: undefined,
    });
  });

  it("tracks tokens from streaming chat completion", async () => {
    const trackFn = vi.fn();
    
    async function* mockStream() {
      yield { model: "gpt-4o-mini" };
      yield { model: "gpt-4o-mini" };
      yield {
        model: "gpt-4o-mini",
        usage: {
          prompt_tokens: 20,
          completion_tokens: 10,
        },
      };
    }

    const mockClient = {
      chat: {
        completions: {
          create: vi.fn(() => mockStream()),
        },
      },
    };

    const wrapped = createOpenAIWrapper(mockClient, trackFn);
    const stream = (wrapped as any).chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "Hi" }],
      stream: true,
    }) as AsyncIterable<unknown>;

    // Consume the stream
    for await (const _chunk of stream) {
      // no-op
    }

    expect(trackFn).toHaveBeenCalledTimes(1);
    expect(trackFn).toHaveBeenCalledWith({
      provider: "openai",
      model: "gpt-4o-mini",
      tokensPrompt: 20,
      tokensCompletion: 10,
      attribution: undefined,
    });
  });

  it("handles missing usage fields gracefully", async () => {
    const trackFn = vi.fn();
    const mockClient = {
      chat: {
        completions: {
          create: vi.fn(async () => ({
            model: "gpt-4o",
            // No usage field
          })),
        },
      },
    };

    const wrapped = createOpenAIWrapper(mockClient, trackFn);
    await (wrapped as any).chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: "Hello" }],
    });

    expect(trackFn).toHaveBeenCalledTimes(1);
    expect(trackFn).toHaveBeenCalledWith({
      provider: "openai",
      model: "gpt-4o",
      tokensPrompt: 0,
      tokensCompletion: 0,
      attribution: undefined,
    });
  });

  it("returns non-OpenAI-shaped client unchanged", () => {
    const trackFn = vi.fn();
    const notAClient = { foo: "bar" };

    const wrapped = createOpenAIWrapper(notAClient, trackFn);

    expect(wrapped).toBe(notAClient);
  });

  it("does not track on error responses", async () => {
    const trackFn = vi.fn();
    const mockClient = {
      chat: {
        completions: {
          create: vi.fn(async () => {
            throw new Error("API error");
          }),
        },
      },
    };

    const wrapped = createOpenAIWrapper(mockClient, trackFn);

    await expect(
      (wrapped as any).chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: "Hello" }],
      }),
    ).rejects.toThrow("API error");

    expect(trackFn).not.toHaveBeenCalled();
  });

  it("tracks multiple sequential calls independently", async () => {
    const trackFn = vi.fn();
    const mockClient = {
      chat: {
        completions: {
          create: vi.fn()
            .mockResolvedValueOnce({
              model: "gpt-4o",
              usage: { prompt_tokens: 10, completion_tokens: 5 },
            })
            .mockResolvedValueOnce({
              model: "gpt-4o-mini",
              usage: { prompt_tokens: 20, completion_tokens: 15 },
            }),
        },
      },
    };

    const wrapped = createOpenAIWrapper(mockClient, trackFn);
    
    await (wrapped as any).chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: "First" }],
    });

    await (wrapped as any).chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "Second" }],
    });

    expect(trackFn).toHaveBeenCalledTimes(2);
    expect(trackFn).toHaveBeenNthCalledWith(1, {
      provider: "openai",
      model: "gpt-4o",
      tokensPrompt: 10,
      tokensCompletion: 5,
      attribution: undefined,
    });
    expect(trackFn).toHaveBeenNthCalledWith(2, {
      provider: "openai",
      model: "gpt-4o-mini",
      tokensPrompt: 20,
      tokensCompletion: 15,
      attribution: undefined,
    });
  });

  it("tracks embeddings calls", async () => {
    const trackFn = vi.fn();
    const mockClient = {
      embeddings: {
        create: vi.fn(async () => ({
          model: "text-embedding-ada-002",
          usage: {
            prompt_tokens: 50,
            total_tokens: 50,
          },
        })),
      },
    };

    const wrapped = createOpenAIWrapper(mockClient, trackFn);
    await (wrapped as any).embeddings.create({
      model: "text-embedding-ada-002",
      input: "Hello world",
    });

    expect(trackFn).toHaveBeenCalledTimes(1);
    expect(trackFn).toHaveBeenCalledWith({
      provider: "openai",
      model: "text-embedding-ada-002",
      tokensPrompt: 50,
      tokensCompletion: 0,
      attribution: undefined,
    });
  });

  it("passes attribution to tracked calls", async () => {
    const trackFn = vi.fn();
    const attribution = { feature: "chat", userId: "user-123" };
    
    const mockClient = {
      chat: {
        completions: {
          create: vi.fn(async () => ({
            model: "gpt-4o",
            usage: { prompt_tokens: 10, completion_tokens: 5 },
          })),
        },
      },
    };

    const wrapped = createOpenAIWrapper(mockClient, trackFn, attribution);
    await (wrapped as any).chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: "Hi" }],
    });

    expect(trackFn).toHaveBeenCalledWith({
      provider: "openai",
      model: "gpt-4o",
      tokensPrompt: 10,
      tokensCompletion: 5,
      attribution,
    });
  });
});
