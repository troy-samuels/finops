// ============================================================
// OpenAI Client Wrapper — Proxy-based chat.completions.create + embeddings interceptor
// ============================================================
// Uses nested Proxies to intercept client.chat.completions.create() and
// client.embeddings.create() without mutating the original client object
// or depending on the `openai` npm package. Supports both Promise and
// streaming responses. All tracking errors are silently swallowed.
// ============================================================

import type { TrackLLMParams, Attribution } from "./types";
import { wrapAsyncIterable } from "./wrap-stream";

type TrackLLMFn = (params: TrackLLMParams) => void;

/** Minimal structural type for an OpenAI chat completion response. */
interface ChatCompletionLike {
  model?: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
  };
}

/** Minimal structural type for an OpenAI streaming chunk. */
interface ChatCompletionChunkLike {
  model?: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
  };
}

/** Minimal structural type for an OpenAI embeddings response. */
interface EmbeddingsResponseLike {
  model?: string;
  usage?: {
    prompt_tokens?: number;
    total_tokens?: number;
  };
}

/** Type guard: does the value look like a ChatCompletion? */
function isChatCompletionLike(val: unknown): val is ChatCompletionLike {
  if (typeof val !== "object" || val === null) return false;
  return (
    "model" in val &&
    typeof (val as Record<string, unknown>)["model"] === "string"
  );
}

/** Type guard: does the value look like an Embeddings response? */
function isEmbeddingsResponseLike(val: unknown): val is EmbeddingsResponseLike {
  if (typeof val !== "object" || val === null) return false;
  const obj = val as Record<string, unknown>;
  return "model" in obj && "usage" in obj;
}

/** Type guard: is the value an async iterable? */
function isAsyncIterable(val: unknown): val is AsyncIterable<unknown> {
  if (val == null || typeof val !== "object") return false;
  return Symbol.asyncIterator in val;
}

/** Extract tracking params from a chat completion response. */
function extractTrackingParams(response: ChatCompletionLike, attribution?: Attribution): TrackLLMParams {
  return {
    provider: "openai",
    model: response.model ?? "unknown",
    tokensPrompt: response.usage?.prompt_tokens ?? 0,
    tokensCompletion: response.usage?.completion_tokens ?? 0,
    attribution,
  };
}

/** Extract tracking params from an embeddings response. */
function extractEmbeddingsParams(response: EmbeddingsResponseLike, attribution?: Attribution): TrackLLMParams {
  return {
    provider: "openai",
    model: response.model ?? "unknown",
    tokensPrompt: response.usage?.prompt_tokens ?? 0,
    tokensCompletion: 0, // Embeddings have no completion tokens
    attribution,
  };
}

/**
 * Wrap an OpenAI client to auto-track chat.completions.create() and
 * embeddings.create() calls.
 *
 * Returns a Proxy of the client. The original client is not modified.
 * If the client does not have the expected shape, returns it unchanged.
 *
 * @param client      An OpenAI client instance (typed as unknown)
 * @param trackFn     The trackLLM callback from ProjectTracker
 * @param attribution Optional attribution to attach to all tracked calls from this client
 * @returns           The proxied client
 */
export function createOpenAIWrapper(
  client: unknown,
  trackFn: TrackLLMFn,
  attribution?: Attribution,
): unknown {
  if (typeof client !== "object" || client === null) {
    return client;
  }

  const clientObj = client as Record<string, unknown>;
  
  // Wrap chat.completions.create
  const originalChat = clientObj["chat"];
  const hasChatCompletions = typeof originalChat === "object" && 
    originalChat !== null &&
    typeof (originalChat as Record<string, unknown>)["completions"] === "object";

  // Wrap embeddings.create
  const originalEmbeddings = clientObj["embeddings"];
  const hasEmbeddings = typeof originalEmbeddings === "object" && 
    originalEmbeddings !== null;

  if (!hasChatCompletions && !hasEmbeddings) {
    return client;
  }

  let chatProxy: Record<string, unknown> | null = null;
  let embeddingsProxy: Record<string, unknown> | null = null;

  // Set up chat.completions.create wrapper
  if (hasChatCompletions) {
    const chatObj = originalChat as Record<string, unknown>;
    const originalCompletions = chatObj["completions"];
    if (typeof originalCompletions !== "object" || originalCompletions === null) {
      return client;
    }

    const completionsObj = originalCompletions as Record<string, unknown>;
    const originalCreate = completionsObj["create"];
    if (typeof originalCreate !== "function") {
      return client;
    }

  // Wrapped create that calls the original, then tracks usage
  const wrappedCreate = function (
    this: unknown,
    ...args: unknown[]
  ): unknown {
    // Check if streaming is requested
    const isStreaming = args.length > 0 &&
      typeof args[0] === "object" &&
      args[0] !== null &&
      (args[0] as Record<string, unknown>)["stream"] === true;

    // Call the original — if it throws synchronously, re-throw
    // (SDK must not swallow OpenAI errors)
    const result: unknown = Function.prototype.apply.call(
      originalCreate,
      this,
      args,
    );

    // Handle streaming responses
    if (isStreaming && isAsyncIterable(result)) {
      // Accumulator for usage data from streaming chunks
      let model = "unknown";
      let promptTokens = 0;
      let completionTokens = 0;
      let hasUsage = false;

      return wrapAsyncIterable(
        result as AsyncIterable<unknown>,
        (chunk: unknown) => {
          // Accumulate usage data from chunks
          if (typeof chunk === "object" && chunk !== null) {
            const chunkObj = chunk as ChatCompletionChunkLike;
            if (chunkObj.model) {
              model = chunkObj.model;
            }
            if (chunkObj.usage) {
              hasUsage = true;
              promptTokens = chunkObj.usage.prompt_tokens ?? promptTokens;
              completionTokens = chunkObj.usage.completion_tokens ?? completionTokens;
            }
          }
        },
        () => {
          // Stream completed — fire tracking with accumulated data
          if (hasUsage) {
            trackFn({
              provider: "openai",
              model,
              tokensPrompt: promptTokens,
              tokensCompletion: completionTokens,
              attribution,
            });
          }
        },
      );
    }

    // Handle Promise responses (non-streaming)
    if (
      result != null &&
      typeof (result as Record<string, unknown>)["then"] === "function"
    ) {
      const promise = result as Promise<unknown>;
      // Side-effect fork — we return the ORIGINAL promise, not the chained one.
      // This ensures zero latency injection into the caller's chain.
      promise.then(
        (response: unknown) => {
          try {
            if (isChatCompletionLike(response)) {
              trackFn(extractTrackingParams(response, attribution));
            }
          } catch {
            // Swallow tracking errors
          }
        },
        () => {
          // OpenAI call failed — nothing to track
        },
      );
      return result;
    }

    // Synchronous return (unlikely but handle gracefully)
    try {
      if (isChatCompletionLike(result)) {
        trackFn(extractTrackingParams(result, attribution));
      }
    } catch {
      // Swallow
    }

    return result;
  };

    // Build the nested Proxy chain for chat.completions
    const completionsProxy = new Proxy(completionsObj, {
      get(target: Record<string, unknown>, prop: string | symbol): unknown {
        if (prop === "create") {
          return wrappedCreate;
        }
        return target[prop as string];
      },
    });

    chatProxy = new Proxy(chatObj, {
      get(target: Record<string, unknown>, prop: string | symbol): unknown {
        if (prop === "completions") {
          return completionsProxy;
        }
        return target[prop as string];
      },
    });
  }

  // Set up embeddings.create wrapper
  if (hasEmbeddings) {
    const embeddingsObj = originalEmbeddings as Record<string, unknown>;
    const originalEmbeddingsCreate = embeddingsObj["create"];
    
    if (typeof originalEmbeddingsCreate === "function") {
      const wrappedEmbeddingsCreate = function (
        this: unknown,
        ...args: unknown[]
      ): unknown {
        const result: unknown = Function.prototype.apply.call(
          originalEmbeddingsCreate,
          this,
          args,
        );

        // Embeddings are always Promise-based (no streaming)
        if (
          result != null &&
          typeof (result as Record<string, unknown>)["then"] === "function"
        ) {
          const promise = result as Promise<unknown>;
          promise.then(
            (response: unknown) => {
              try {
                if (isEmbeddingsResponseLike(response)) {
                  trackFn(extractEmbeddingsParams(response, attribution));
                }
              } catch {
                // Swallow tracking errors
              }
            },
            () => {
              // OpenAI embeddings call failed — nothing to track
            },
          );
          return result;
        }

        return result;
      };

      embeddingsProxy = new Proxy(embeddingsObj, {
        get(target: Record<string, unknown>, prop: string | symbol): unknown {
          if (prop === "create") {
            return wrappedEmbeddingsCreate;
          }
          return target[prop as string];
        },
      });
    }
  }

  // Build the final client proxy
  return new Proxy(clientObj, {
    get(target: Record<string, unknown>, prop: string | symbol): unknown {
      if (prop === "chat" && chatProxy !== null) {
        return chatProxy;
      }
      if (prop === "embeddings" && embeddingsProxy !== null) {
        return embeddingsProxy;
      }
      return target[prop as string];
    },
  });
}
