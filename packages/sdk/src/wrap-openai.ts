// ============================================================
// OpenAI Client Wrapper — Proxy-based chat.completions.create interceptor
// ============================================================
// Uses nested Proxies to intercept client.chat.completions.create()
// without mutating the original client object or depending on the
// `openai` npm package. All tracking errors are silently swallowed.
// ============================================================

import type { TrackLLMParams } from "./types";

type TrackLLMFn = (params: TrackLLMParams) => void;

/** Minimal structural type for an OpenAI chat completion response. */
interface ChatCompletionLike {
  model?: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
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

/** Extract tracking params from a chat completion response. */
function extractTrackingParams(response: ChatCompletionLike): TrackLLMParams {
  return {
    provider: "openai",
    model: response.model ?? "unknown",
    tokensPrompt: response.usage?.prompt_tokens ?? 0,
    tokensCompletion: response.usage?.completion_tokens ?? 0,
  };
}

/**
 * Wrap an OpenAI client to auto-track chat.completions.create() calls.
 *
 * Returns a Proxy of the client. The original client is not modified.
 * If the client does not have the expected shape, returns it unchanged.
 *
 * @param client  An OpenAI client instance (typed as unknown)
 * @param trackFn The trackLLM callback from ProjectTracker
 * @returns       The proxied client
 */
export function createOpenAIWrapper(
  client: unknown,
  trackFn: TrackLLMFn,
): unknown {
  if (typeof client !== "object" || client === null) {
    return client;
  }

  const clientObj = client as Record<string, unknown>;
  const originalChat = clientObj["chat"];
  if (typeof originalChat !== "object" || originalChat === null) {
    return client;
  }

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
    // Call the original — if it throws synchronously, re-throw
    // (SDK must not swallow OpenAI errors)
    const result: unknown = Function.prototype.apply.call(
      originalCreate,
      this,
      args,
    );

    // If the result is a thenable (Promise), attach fire-and-forget tracking
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
              trackFn(extractTrackingParams(response));
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
        trackFn(extractTrackingParams(result));
      }
    } catch {
      // Swallow
    }

    return result;
  };

  // Build the nested Proxy chain
  const completionsProxy = new Proxy(completionsObj, {
    get(target: Record<string, unknown>, prop: string | symbol): unknown {
      if (prop === "create") {
        return wrappedCreate;
      }
      return target[prop as string];
    },
  });

  const chatProxy = new Proxy(chatObj, {
    get(target: Record<string, unknown>, prop: string | symbol): unknown {
      if (prop === "completions") {
        return completionsProxy;
      }
      return target[prop as string];
    },
  });

  return new Proxy(clientObj, {
    get(target: Record<string, unknown>, prop: string | symbol): unknown {
      if (prop === "chat") {
        return chatProxy;
      }
      return target[prop as string];
    },
  });
}
