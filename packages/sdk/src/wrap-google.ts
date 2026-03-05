// ============================================================
// Google AI Client Wrapper — Proxy-based generateContent interceptor
// ============================================================
// Wraps Google GenerativeAI model instances so that every call to
// model.generateContent() is tracked. Works by proxying the
// getGenerativeModel() method on the client to return proxied model
// instances. All tracking errors are silently swallowed.
// ============================================================

import type { TrackLLMParams } from "./types";

type TrackLLMFn = (params: TrackLLMParams) => void;

/** Minimal structural type for a Google GenerateContent result (awaited). */
interface GoogleGenerateContentResultLike {
  response?: {
    usageMetadata?: {
      promptTokenCount?: number;
      candidatesTokenCount?: number;
    };
  };
}

/** Type guard: does the value look like a Google GenerateContent result? */
function isGoogleResultLike(
  val: unknown,
): val is GoogleGenerateContentResultLike {
  if (typeof val !== "object" || val === null) return false;
  const obj = val as Record<string, unknown>;
  if (!("response" in obj)) return false;
  const resp = obj["response"];
  if (typeof resp !== "object" || resp === null) return false;
  return "usageMetadata" in resp;
}

/** Extract tracking params from a Google generateContent result. */
function extractTrackingParams(
  result: GoogleGenerateContentResultLike,
  modelName: string,
): TrackLLMParams {
  const usage = result.response?.usageMetadata;
  return {
    provider: "google",
    model: modelName,
    tokensPrompt: usage?.promptTokenCount ?? 0,
    tokensCompletion: usage?.candidatesTokenCount ?? 0,
  };
}

/**
 * Create a proxy around a model instance that intercepts generateContent().
 */
function proxyModelInstance(
  model: Record<string, unknown>,
  trackFn: TrackLLMFn,
): Record<string, unknown> {
  // Try to extract the model name from the instance
  const modelName =
    typeof model["model"] === "string"
      ? model["model"]
      : typeof model["modelName"] === "string"
        ? model["modelName"]
        : "unknown";

  const originalGenerateContent = model["generateContent"];
  if (typeof originalGenerateContent !== "function") {
    return model;
  }

  const wrappedGenerateContent = function (
    this: unknown,
    ...args: unknown[]
  ): unknown {
    const result: unknown = Function.prototype.apply.call(
      originalGenerateContent,
      this,
      args,
    );

    // If the result is a thenable (Promise), attach fire-and-forget tracking
    if (
      result != null &&
      typeof (result as Record<string, unknown>)["then"] === "function"
    ) {
      const promise = result as Promise<unknown>;
      promise.then(
        (response: unknown) => {
          try {
            if (isGoogleResultLike(response)) {
              trackFn(extractTrackingParams(response, modelName));
            }
          } catch {
            // Swallow tracking errors
          }
        },
        () => {
          // Google call failed — nothing to track
        },
      );
      return result;
    }

    // Synchronous return (unlikely but handle gracefully)
    try {
      if (isGoogleResultLike(result)) {
        trackFn(extractTrackingParams(result, modelName));
      }
    } catch {
      // Swallow
    }

    return result;
  };

  return new Proxy(model, {
    get(target: Record<string, unknown>, prop: string | symbol): unknown {
      if (prop === "generateContent") {
        return wrappedGenerateContent;
      }
      return target[prop as string];
    },
  });
}

/**
 * Wrap a Google GenerativeAI client to auto-track generateContent() calls.
 *
 * Proxies getGenerativeModel() so that every model instance returned is
 * itself proxied. Also handles the case where the user has already obtained
 * a model instance (by checking for generateContent directly).
 *
 * @param client  A Google GenerativeAI client or model instance
 * @param trackFn The trackLLM callback from ProjectTracker
 * @returns       The proxied client
 */
export function createGoogleAIWrapper(
  client: unknown,
  trackFn: TrackLLMFn,
): unknown {
  if (typeof client !== "object" || client === null) {
    return client;
  }

  const clientObj = client as Record<string, unknown>;

  // Case 1: client is already a model instance (has generateContent)
  if (typeof clientObj["generateContent"] === "function") {
    return proxyModelInstance(clientObj, trackFn);
  }

  // Case 2: client is the GoogleGenerativeAI class instance (has getGenerativeModel)
  const originalGetModel = clientObj["getGenerativeModel"];
  if (typeof originalGetModel !== "function") {
    return client;
  }

  const wrappedGetModel = function (
    this: unknown,
    ...args: unknown[]
  ): unknown {
    const model: unknown = Function.prototype.apply.call(
      originalGetModel,
      this,
      args,
    );

    if (typeof model !== "object" || model === null) {
      return model;
    }

    try {
      return proxyModelInstance(model as Record<string, unknown>, trackFn);
    } catch {
      return model;
    }
  };

  return new Proxy(clientObj, {
    get(target: Record<string, unknown>, prop: string | symbol): unknown {
      if (prop === "getGenerativeModel") {
        return wrappedGetModel;
      }
      return target[prop as string];
    },
  });
}
