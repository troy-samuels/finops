// @ts-nocheck - Test mocks have loose typing
import { describe, expect, it, vi } from "vitest";
import { createGoogleAIWrapper } from "../wrap-google";

describe("Google AI Wrapper", () => {
  it("tracks tokens from generateContent Promise", async () => {
    const trackFn = vi.fn();
    const mockModel = {
      model: "gemini-2.5-pro",
      generateContent: vi.fn(async () => ({
        response: {
          usageMetadata: {
            promptTokenCount: 80,
            candidatesTokenCount: 40,
          },
        },
      })),
    };

    const wrapped = createGoogleAIWrapper(mockModel, trackFn);
    await (wrapped as any).generateContent("Hello");

    expect(trackFn).toHaveBeenCalledTimes(1);
    expect(trackFn).toHaveBeenCalledWith({
      provider: "google",
      model: "gemini-2.5-pro",
      tokensPrompt: 80,
      tokensCompletion: 40,
      attribution: undefined,
    });
  });

  it("does not crash with generateContentStream", async () => {
    // Note: Full streaming tracking is difficult to test in isolation due to
    // the async iterable wrapping. The streaming logic is tested via wrap-stream.test.ts
    // and this test verifies the wrapper doesn't crash when streaming is used.
    const trackFn = vi.fn();
    
    // Create an async generator function
    const createMockStream = async function* () {
      yield {
        response: {
          usageMetadata: {
            promptTokenCount: 30,
            candidatesTokenCount: 10,
          },
        },
      };
      yield {
        response: {
          usageMetadata: {
            promptTokenCount: 30,
            candidatesTokenCount: 20,
          },
        },
      };
    };

    const mockModel = {
      modelName: "gemini-2.0-flash",
      generateContentStream: vi.fn(async () => ({
        stream: createMockStream(),
      })),
    };

    const wrapped = createGoogleAIWrapper(mockModel, trackFn);
    const streamResult = await (wrapped as any).generateContentStream("Hi");
    
    // Verify it doesn't crash and returns a stream
    expect(streamResult.stream).toBeDefined();
    
    // Consume the stream
    const chunks: unknown[] = [];
    for await (const chunk of streamResult.stream) {
      chunks.push(chunk);
    }

    // Should get all chunks
    expect(chunks.length).toBe(2);
  });

  it("wraps getGenerativeModel proxy chaining", async () => {
    const trackFn = vi.fn();
    const mockClient = {
      getGenerativeModel: vi.fn(() => ({
        model: "gemini-2.5-pro",
        generateContent: vi.fn(async () => ({
          response: {
            usageMetadata: {
              promptTokenCount: 60,
              candidatesTokenCount: 30,
            },
          },
        })),
      })),
    };

    const wrapped = createGoogleAIWrapper(mockClient, trackFn);
    const model = (wrapped as any).getGenerativeModel({ model: "gemini-2.5-pro" });
    await model.generateContent("Test");

    expect(trackFn).toHaveBeenCalledTimes(1);
    expect(trackFn).toHaveBeenCalledWith({
      provider: "google",
      model: "gemini-2.5-pro",
      tokensPrompt: 60,
      tokensCompletion: 30,
      attribution: undefined,
    });
  });

  it("wraps direct model instance", async () => {
    const trackFn = vi.fn();
    const mockModel = {
      model: "gemini-1.5-flash",
      generateContent: vi.fn(async () => ({
        response: {
          usageMetadata: {
            promptTokenCount: 25,
            candidatesTokenCount: 15,
          },
        },
      })),
    };

    const wrapped = createGoogleAIWrapper(mockModel, trackFn);
    await (wrapped as any).generateContent("Direct test");

    expect(trackFn).toHaveBeenCalledTimes(1);
    expect(trackFn).toHaveBeenCalledWith({
      provider: "google",
      model: "gemini-1.5-flash",
      tokensPrompt: 25,
      tokensCompletion: 15,
      attribution: undefined,
    });
  });

  it("returns non-Google-shaped client unchanged", () => {
    const trackFn = vi.fn();
    const notAClient = { foo: "bar" };

    const wrapped = createGoogleAIWrapper(notAClient, trackFn);

    expect(wrapped).toBe(notAClient);
  });

  it("does not track on error responses", async () => {
    const trackFn = vi.fn();
    const mockModel = {
      model: "gemini-2.5-pro",
      generateContent: vi.fn(async () => {
        throw new Error("API error");
      }),
    };

    const wrapped = createGoogleAIWrapper(mockModel, trackFn);

    await expect(
      (wrapped as any).generateContent("Hello"),
    ).rejects.toThrow("API error");

    expect(trackFn).not.toHaveBeenCalled();
  });

  it("tracks multiple sequential calls independently", async () => {
    const trackFn = vi.fn();
    const mockModel = {
      model: "gemini-2.5-pro",
      generateContent: vi.fn()
        .mockResolvedValueOnce({
          response: {
            usageMetadata: {
              promptTokenCount: 10,
              candidatesTokenCount: 5,
            },
          },
        })
        .mockResolvedValueOnce({
          response: {
            usageMetadata: {
              promptTokenCount: 20,
              candidatesTokenCount: 15,
            },
          },
        }),
    };

    const wrapped = createGoogleAIWrapper(mockModel, trackFn);
    
    await (wrapped as any).generateContent("First");
    await (wrapped as any).generateContent("Second");

    expect(trackFn).toHaveBeenCalledTimes(2);
    expect(trackFn).toHaveBeenNthCalledWith(1, {
      provider: "google",
      model: "gemini-2.5-pro",
      tokensPrompt: 10,
      tokensCompletion: 5,
      attribution: undefined,
    });
    expect(trackFn).toHaveBeenNthCalledWith(2, {
      provider: "google",
      model: "gemini-2.5-pro",
      tokensPrompt: 20,
      tokensCompletion: 15,
      attribution: undefined,
    });
  });

  it("passes attribution to tracked calls", async () => {
    const trackFn = vi.fn();
    const attribution = { feature: "content-gen", environment: "production" };
    
    const mockModel = {
      model: "gemini-2.5-pro",
      generateContent: vi.fn(async () => ({
        response: {
          usageMetadata: {
            promptTokenCount: 40,
            candidatesTokenCount: 20,
          },
        },
      })),
    };

    const wrapped = createGoogleAIWrapper(mockModel, trackFn, attribution);
    await (wrapped as any).generateContent("Test");

    expect(trackFn).toHaveBeenCalledWith({
      provider: "google",
      model: "gemini-2.5-pro",
      tokensPrompt: 40,
      tokensCompletion: 20,
      attribution,
    });
  });
});
