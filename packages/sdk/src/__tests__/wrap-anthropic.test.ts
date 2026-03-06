// @ts-nocheck - Test mocks have loose typing
import { describe, expect, it, vi } from "vitest";
import { createAnthropicWrapper } from "../wrap-anthropic";

describe("Anthropic Wrapper", () => {
  it("tracks tokens from non-streaming messages.create", async () => {
    const trackFn = vi.fn();
    const mockClient = {
      messages: {
        create: vi.fn(async () => ({
          model: "claude-opus-4-5",
          usage: {
            input_tokens: 150,
            output_tokens: 75,
          },
        })),
      },
    };

    const wrapped = createAnthropicWrapper(mockClient, trackFn);
    const result = await (wrapped as any).messages.create({
      model: "claude-opus-4-5",
      max_tokens: 100,
      messages: [{ role: "user", content: "Hello" }],
    });

    expect(result.model).toBe("claude-opus-4-5");
    expect(trackFn).toHaveBeenCalledTimes(1);
    expect(trackFn).toHaveBeenCalledWith({
      provider: "anthropic",
      model: "claude-opus-4-5",
      tokensPrompt: 150,
      tokensCompletion: 75,
      attribution: undefined,
    });
  });

  it("tracks tokens from streaming messages.create", async () => {
    const trackFn = vi.fn();
    
    async function* mockStream() {
      yield {
        type: "message_start",
        message: {
          model: "claude-sonnet-4-5",
          usage: {
            input_tokens: 50,
            output_tokens: 0,
          },
        },
      };
      yield { type: "content_block_delta" };
      yield {
        type: "message_delta",
        usage: {
          output_tokens: 25,
        },
      };
    }

    const mockClient = {
      messages: {
        create: vi.fn(() => mockStream()),
      },
    };

    const wrapped = createAnthropicWrapper(mockClient, trackFn);
    const stream = (wrapped as any).messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 100,
      messages: [{ role: "user", content: "Hi" }],
      stream: true,
    }) as AsyncIterable<unknown>;

    // Consume the stream
    for await (const _event of stream) {
      // no-op
    }

    expect(trackFn).toHaveBeenCalledTimes(1);
    expect(trackFn).toHaveBeenCalledWith({
      provider: "anthropic",
      model: "claude-sonnet-4-5",
      tokensPrompt: 50,
      tokensCompletion: 25,
      attribution: undefined,
    });
  });

  it("handles missing usage fields gracefully", async () => {
    const trackFn = vi.fn();
    const mockClient = {
      messages: {
        create: vi.fn(async () => ({
          model: "claude-opus-4-5",
          // No usage field
        })),
      },
    };

    const wrapped = createAnthropicWrapper(mockClient, trackFn);
    await (wrapped as any).messages.create({
      model: "claude-opus-4-5",
      max_tokens: 100,
      messages: [{ role: "user", content: "Hello" }],
    });

    expect(trackFn).toHaveBeenCalledTimes(1);
    expect(trackFn).toHaveBeenCalledWith({
      provider: "anthropic",
      model: "claude-opus-4-5",
      tokensPrompt: 0,
      tokensCompletion: 0,
      attribution: undefined,
    });
  });

  it("returns non-Anthropic-shaped client unchanged", () => {
    const trackFn = vi.fn();
    const notAClient = { foo: "bar" };

    const wrapped = createAnthropicWrapper(notAClient, trackFn);

    expect(wrapped).toBe(notAClient);
  });

  it("does not track on error responses", async () => {
    const trackFn = vi.fn();
    const mockClient = {
      messages: {
        create: vi.fn(async () => {
          throw new Error("API error");
        }),
      },
    };

    const wrapped = createAnthropicWrapper(mockClient, trackFn);

    await expect(
      (wrapped as any).messages.create({
        model: "claude-opus-4-5",
        max_tokens: 100,
        messages: [{ role: "user", content: "Hello" }],
      }),
    ).rejects.toThrow("API error");

    expect(trackFn).not.toHaveBeenCalled();
  });

  it("tracks multiple sequential calls independently", async () => {
    const trackFn = vi.fn();
    const mockClient = {
      messages: {
        create: vi.fn()
          .mockResolvedValueOnce({
            model: "claude-opus-4-5",
            usage: { input_tokens: 100, output_tokens: 50 },
          })
          .mockResolvedValueOnce({
            model: "claude-sonnet-4-5",
            usage: { input_tokens: 75, output_tokens: 40 },
          }),
      },
    };

    const wrapped = createAnthropicWrapper(mockClient, trackFn);
    
    await (wrapped as any).messages.create({
      model: "claude-opus-4-5",
      max_tokens: 100,
      messages: [{ role: "user", content: "First" }],
    });

    await (wrapped as any).messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 100,
      messages: [{ role: "user", content: "Second" }],
    });

    expect(trackFn).toHaveBeenCalledTimes(2);
    expect(trackFn).toHaveBeenNthCalledWith(1, {
      provider: "anthropic",
      model: "claude-opus-4-5",
      tokensPrompt: 100,
      tokensCompletion: 50,
      attribution: undefined,
    });
    expect(trackFn).toHaveBeenNthCalledWith(2, {
      provider: "anthropic",
      model: "claude-sonnet-4-5",
      tokensPrompt: 75,
      tokensCompletion: 40,
      attribution: undefined,
    });
  });

  it("passes attribution to tracked calls", async () => {
    const trackFn = vi.fn();
    const attribution = { feature: "assistant", workflow: "onboarding" };
    
    const mockClient = {
      messages: {
        create: vi.fn(async () => ({
          model: "claude-opus-4-5",
          usage: { input_tokens: 50, output_tokens: 25 },
        })),
      },
    };

    const wrapped = createAnthropicWrapper(mockClient, trackFn, attribution);
    await (wrapped as any).messages.create({
      model: "claude-opus-4-5",
      max_tokens: 100,
      messages: [{ role: "user", content: "Hi" }],
    });

    expect(trackFn).toHaveBeenCalledWith({
      provider: "anthropic",
      model: "claude-opus-4-5",
      tokensPrompt: 50,
      tokensCompletion: 25,
      attribution,
    });
  });
});
