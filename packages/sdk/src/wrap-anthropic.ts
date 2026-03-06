// ============================================================
// Anthropic Client Wrapper — Proxy-based messages.create interceptor
// ============================================================
// Uses nested Proxies to intercept client.messages.create() without
// mutating the original client object or depending on the `@anthropic-ai/sdk`
// package. Supports both Promise and streaming responses.
// All tracking errors are silently swallowed.
// ============================================================

import type { TrackLLMParams, Attribution } from "./types";
import { wrapAsyncIterable } from "./wrap-stream";

type TrackLLMFn = (params: TrackLLMParams) => void;

/** Minimal structural type for an Anthropic message response. */
interface AnthropicMessageLike {
  model?: string;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
}

/** Minimal structural type for an Anthropic streaming event. */
interface AnthropicStreamEventLike {
  type?: string;
  // message_start events have the full message object
  message?: {
    model?: string;
    usage?: {
      input_tokens?: number;
      output_tokens?: number;
    };
  };
  // message_delta events have usage at the top level
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
}

/** Type guard: does the value look like an Anthropic Message? */
function isAnthropicMessageLike(val: unknown): val is AnthropicMessageLike {
  if (typeof val !== "object" || val === null) return false;
  const obj = val as Record<string, unknown>;
  return "model" in obj && typeof obj["model"] === "string";
}

/** Type guard: is the value an async iterable? */
function isAsyncIterable(val: unknown): val is AsyncIterable<unknown> {
  if (val == null || typeof val !== "object") return false;
  return Symbol.asyncIterator in val;
}

/** Extract tracking params from an Anthropic message response. */
function extractTrackingParams(response: AnthropicMessageLike, attribution?: Attribution): TrackLLMParams {
  return {
    provider: "anthropic",
    model: response.model ?? "unknown",
    tokensPrompt: response.usage?.input_tokens ?? 0,
    tokensCompletion: response.usage?.output_tokens ?? 0,
    attribution,
  };
}

/**
 * Wrap an Anthropic client to auto-track messages.create() calls.
 *
 * Returns a Proxy of the client. The original client is not modified.
 * If the client does not have the expected shape, returns it unchanged.
 *
 * @param client      An Anthropic client instance (typed as unknown)
 * @param trackFn     The trackLLM callback from ProjectTracker
 * @param attribution Optional attribution to attach to all tracked calls from this client
 * @returns           The proxied client
 */
export function createAnthropicWrapper(
  client: unknown,
  trackFn: TrackLLMFn,
  attribution?: Attribution,
): unknown {
  if (typeof client !== "object" || client === null) {
    return client;
  }

  const clientObj = client as Record<string, unknown>;
  const originalMessages = clientObj["messages"];
  if (typeof originalMessages !== "object" || originalMessages === null) {
    return client;
  }

  const messagesObj = originalMessages as Record<string, unknown>;
  const originalCreate = messagesObj["create"];
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

    const result: unknown = Function.prototype.apply.call(
      originalCreate,
      this,
      args,
    );

    // Handle streaming responses (MessageStream is an async iterable)
    if (isStreaming && isAsyncIterable(result)) {
      // Accumulator for usage data from streaming events
      let model = "unknown";
      let inputTokens = 0;
      let outputTokens = 0;
      let hasUsage = false;

      return wrapAsyncIterable(
        result as AsyncIterable<unknown>,
        (event: unknown) => {
          // Accumulate usage data from streaming events
          if (typeof event === "object" && event !== null) {
            const eventObj = event as AnthropicStreamEventLike;
            // message_start has full message with model + input usage
            if (eventObj.type === "message_start" && eventObj.message) {
              if (eventObj.message.model) {
                model = eventObj.message.model;
              }
              if (eventObj.message.usage) {
                hasUsage = true;
                inputTokens = eventObj.message.usage.input_tokens ?? inputTokens;
              }
            }
            // message_delta has output_tokens usage at top level
            if (eventObj.type === "message_delta") {
              if (eventObj.usage) {
                hasUsage = true;
                outputTokens = eventObj.usage.output_tokens ?? outputTokens;
              }
            }
          }
        },
        () => {
          // Stream completed — fire tracking with accumulated data
          if (hasUsage) {
            trackFn({
              provider: "anthropic",
              model,
              tokensPrompt: inputTokens,
              tokensCompletion: outputTokens,
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
      promise.then(
        (response: unknown) => {
          try {
            if (isAnthropicMessageLike(response)) {
              trackFn(extractTrackingParams(response, attribution));
            }
          } catch {
            // Swallow tracking errors
          }
        },
        () => {
          // Anthropic call failed — nothing to track
        },
      );
      return result;
    }

    // Synchronous return (unlikely but handle gracefully)
    try {
      if (isAnthropicMessageLike(result)) {
        trackFn(extractTrackingParams(result, attribution));
      }
    } catch {
      // Swallow
    }

    return result;
  };

  // Build the nested Proxy chain
  const messagesProxy = new Proxy(messagesObj, {
    get(target: Record<string, unknown>, prop: string | symbol): unknown {
      if (prop === "create") {
        return wrappedCreate;
      }
      return target[prop as string];
    },
  });

  return new Proxy(clientObj, {
    get(target: Record<string, unknown>, prop: string | symbol): unknown {
      if (prop === "messages") {
        return messagesProxy;
      }
      return target[prop as string];
    },
  });
}
