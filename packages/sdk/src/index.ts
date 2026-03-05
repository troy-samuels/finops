/**
 * @finops/sdk — Lightweight telemetry & event SDK for the FinOps Tracker.
 *
 * ## Guardrails (enforced across all public API):
 *
 * 1. NEVER CRASH THE HOST APP
 *    - Every public method must be wrapped in try/catch.
 *    - Errors are logged internally (console.warn) and swallowed.
 *
 * 2. MAX QUEUE SIZE (drop oldest if full)
 *    - The internal event queue has a hard cap.
 *    - When the cap is reached, the oldest event is dequeued before enqueuing the new one.
 *
 * 3. SWALLOW ALL NETWORK ERRORS
 *    - All fetch/HTTP calls must have catch handlers.
 *    - Network failures are silently ignored — the SDK is fire-and-forget.
 *
 * 4. NO UNHANDLED PROMISE REJECTIONS
 *    - Every async code path must have a .catch() or be inside try/catch.
 */

export const SDK_VERSION = "0.1.0" as const;

// ---- Main SDK class ----
export { ProjectTracker } from "./client";

// ---- Pricing registry ----
export { MODEL_PRICING, getCostForTokens, getModelPricing } from "./pricing";

// ---- Public types (type-only re-exports) ----
export type {
  ProjectTrackerConfig,
  TrackLLMParams,
  TrackAPIParams,
  TrackEventPayload,
  TelemetryPayload,
  DiscoveryPayload,
  TrackEventResponse,
  TrackEventResultItem,
  EventType,
  ResourceStatus,
} from "./types";

export type { ModelPricing } from "./pricing";
