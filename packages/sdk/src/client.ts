// ============================================================
// ProjectTracker — Main SDK class
// ============================================================
// All public methods are wrapped in try/catch. Errors are logged
// via console.warn and swallowed. Network failures are silent.
// The host application must never crash because of this SDK.
// ============================================================

import { BatchQueue } from "./queue";
import { scanEnvironment } from "./discovery";
import { createOpenAIWrapper } from "./wrap-openai";
import { createAnthropicWrapper } from "./wrap-anthropic";
import { createGoogleAIWrapper } from "./wrap-google";
import type {
  ProjectTrackerConfig,
  TrackLLMParams,
  TrackAPIParams,
  TrackEventPayload,
  TelemetryPayload,
  TrackEventResponse,
} from "./types";

const DEFAULTS = {
  flushIntervalMs: 2000,
  maxBatchSize: 50,
  maxQueueSize: 1000,
  autoDiscovery: true,
  trackingMode: 'full' as const,
} as const;

const REQUEST_ID_LENGTH = 32;

function createRequestId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
    // ignore and fallback below
  }

  return `req_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
}

function isPositiveInteger(n: number): boolean {
  return Number.isInteger(n) && n > 0;
}

function sanitizeString(input: string | undefined): string {
  return (input ?? "").trim();
}

export class ProjectTracker {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly maxBatchSize: number;
  private readonly trackingMode: 'full' | 'cost-only' | 'tokens-only';
  private readonly queue: BatchQueue<TrackEventPayload>;
  private readonly enabled: boolean;
  private readonly discoveredProviders: Set<string> = new Set();
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private flushing = false;
  private shutdownCalled = false;

  constructor(config: ProjectTrackerConfig) {
    const apiKey = sanitizeString(config.apiKey);
    const baseUrl = sanitizeString(config.baseUrl);

    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.trackingMode = config.trackingMode ?? DEFAULTS.trackingMode;

    const maxBatchSize = config.maxBatchSize ?? DEFAULTS.maxBatchSize;
    this.maxBatchSize = isPositiveInteger(maxBatchSize)
      ? maxBatchSize
      : DEFAULTS.maxBatchSize;

    const maxQueueSize = config.maxQueueSize ?? DEFAULTS.maxQueueSize;
    this.queue = new BatchQueue<TrackEventPayload>(
      isPositiveInteger(maxQueueSize) ? maxQueueSize : DEFAULTS.maxQueueSize,
    );

    let baseUrlValid = false;
    try {
      const parsed = new URL(this.baseUrl);
      baseUrlValid = parsed.protocol === "https:" || parsed.protocol === "http:";
    } catch {
      baseUrlValid = false;
    }

    this.enabled = this.apiKey.length > 0 && baseUrlValid;
    if (!this.enabled) {
      console.warn(
        "[@finops/sdk] invalid config: apiKey and baseUrl are required. Tracker is running in no-op mode.",
      );
    }

    // Start periodic flush timer
    const intervalMsRaw = config.flushIntervalMs ?? DEFAULTS.flushIntervalMs;
    const intervalMs = isPositiveInteger(intervalMsRaw)
      ? intervalMsRaw
      : DEFAULTS.flushIntervalMs;

    this.flushTimer = setInterval(() => {
      this.flush().catch(() => {
        // Swallow — flush handles errors internally
      });
    }, intervalMs);

    // Prevent the timer from keeping Node.js alive
    if (this.flushTimer !== null && typeof this.flushTimer === "object") {
      const timer = this.flushTimer as unknown as { unref?: () => void };
      if (typeof timer.unref === "function") {
        timer.unref();
      }
    }

    // Auto-discovery: scan env vars for known provider prefixes
    // Results are stored LOCALLY and NEVER transmitted to the server
    if (config.autoDiscovery ?? DEFAULTS.autoDiscovery) {
      try {
        const discovered = scanEnvironment();
        for (const provider of discovered) {
          this.discoveredProviders.add(provider);
        }
      } catch {
        // Guardrail: never crash the host
      }
    }
  }

  // ---- Public API ----

  /**
   * Track an LLM call. Synchronous — enqueues and returns immediately.
   * May trigger an async flush if the queue reaches maxBatchSize.
   */
  trackLLM(params: TrackLLMParams): void {
    try {
      const payload: TelemetryPayload = {
        type: "telemetry",
        event_type: "llm",
        provider: params.provider,
        model_or_endpoint: params.model,
        tokens_prompt: params.tokensPrompt,
        tokens_completion: params.tokensCompletion,
        metadata: params.metadata,
        timestamp: params.timestamp,
        request_id: params.requestId ?? createRequestId(),
        sent_at: params.sentAt ?? new Date().toISOString(),
      };
      this.enqueueAndMaybeFlush(payload);
    } catch {
      // Guardrail: never crash the host
    }
  }

  /**
   * Track an API call. Synchronous — enqueues and returns immediately.
   */
  trackAPI(params: TrackAPIParams): void {
    try {
      const payload: TelemetryPayload = {
        type: "telemetry",
        event_type: "api",
        provider: params.provider,
        model_or_endpoint: params.endpoint,
        tokens_prompt: params.tokensPrompt,
        tokens_completion: params.tokensCompletion,
        metadata: params.metadata,
        timestamp: params.timestamp,
        request_id: params.requestId ?? createRequestId(),
        sent_at: params.sentAt ?? new Date().toISOString(),
      };
      this.enqueueAndMaybeFlush(payload);
    } catch {
      // Guardrail: never crash the host
    }
  }

  /**
   * Wrap an OpenAI client to auto-track chat.completions.create() calls.
   * Returns a proxied version of the client. The original client is
   * not modified. Generic `T` preserves the caller's type.
   */
  wrapOpenAI<T>(client: T): T {
    try {
      return createOpenAIWrapper(
        client,
        (params) => this.trackLLM(params),
      ) as T;
    } catch {
      // If wrapping fails, return the original client unmodified
      return client;
    }
  }

  /**
   * Wrap an Anthropic client to auto-track messages.create() calls.
   * Returns a proxied version of the client. The original client is
   * not modified. Generic `T` preserves the caller's type.
   */
  wrapAnthropic<T>(client: T): T {
    try {
      return createAnthropicWrapper(
        client,
        (params) => this.trackLLM(params),
      ) as T;
    } catch {
      // If wrapping fails, return the original client unmodified
      return client;
    }
  }

  /**
   * Wrap a Google GenerativeAI client (or model instance) to auto-track
   * generateContent() calls. Returns a proxied version. The original
   * client is not modified. Generic `T` preserves the caller's type.
   */
  wrapGoogleAI<T>(client: T): T {
    try {
      return createGoogleAIWrapper(
        client,
        (params) => this.trackLLM(params),
      ) as T;
    } catch {
      // If wrapping fails, return the original client unmodified
      return client;
    }
  }

  /**
   * Manually flush the queue. Sends all queued items to the backend.
   * Returns the API response or undefined on error/empty queue.
   * Concurrent flushes are skipped (guarded by `flushing` flag).
   */
  async flush(): Promise<TrackEventResponse | undefined> {
    if (!this.enabled || this.shutdownCalled) {
      return undefined;
    }

    if (this.flushing) {
      return undefined;
    }

    const batch = this.queue.drainAll();
    if (batch.length === 0) {
      return undefined;
    }

    this.flushing = true;
    try {
      const url = `${this.baseUrl}/functions/v1/track-event`;
      const serializedBatch = JSON.stringify(batch);
      const batchRequestId = await this.createBatchRequestId(serializedBatch);
      const requestTimestamp = new Date().toISOString();
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
          "x-request-id": batchRequestId,
          "x-request-timestamp": requestTimestamp,
        },
        body: serializedBatch,
      });

      if (response.status === 429) {
        console.warn(
          `[@finops/sdk] rate limited (429). Re-enqueuing ${String(batch.length)} items.`,
        );
        this.queue.prependAll(batch);
        return undefined;
      }

      if (response.status >= 500) {
        console.warn(
          `[@finops/sdk] server error (${String(response.status)}). Re-enqueuing ${String(batch.length)} items.`,
        );
        this.queue.prependAll(batch);
        return undefined;
      }

      if (!response.ok) {
        console.warn(
          `[@finops/sdk] flush failed: HTTP ${String(response.status)}`,
        );
        return undefined;
      }

      return (await response.json()) as TrackEventResponse;
    } catch (err: unknown) {
      console.warn(
        "[@finops/sdk] flush error (re-enqueuing):",
        err instanceof Error ? err.message : "unknown",
      );
      this.queue.prependAll(batch);
      return undefined;
    } finally {
      this.flushing = false;
    }
  }

  /**
   * Get the list of providers discovered during initialization.
   * Discovery results are stored locally and never transmitted to the server.
   * @returns Array of provider names (e.g., ["openai", "anthropic"])
   */
  getDiscoveredProviders(): string[] {
    return Array.from(this.discoveredProviders);
  }

  /**
   * Gracefully shut down the tracker. Stops the periodic timer and
   * performs a final flush. After shutdown, track calls are no-ops.
   */
  async shutdown(): Promise<void> {
    if (this.shutdownCalled) {
      return;
    }
    this.shutdownCalled = true;

    if (this.flushTimer !== null) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    try {
      await this.flush();
    } catch {
      // Guardrail: never crash
    }
  }

  // ---- Private helpers ----

  private enqueueAndMaybeFlush(payload: TrackEventPayload): void {
    if (this.shutdownCalled || !this.enabled) {
      return;
    }

    // Apply trackingMode filtering
    const filteredPayload = this.applyTrackingMode(payload);
    this.queue.enqueue(this.withIdentity(filteredPayload));

    if (this.queue.length >= this.maxBatchSize) {
      this.flush().catch(() => {
        // Swallow — flush handles errors internally
      });
    }
  }

  private applyTrackingMode(payload: TrackEventPayload): TrackEventPayload {
    // Only filter telemetry payloads (not discovery payloads, though we don't send those anymore)
    if (payload.type !== 'telemetry') {
      return payload;
    }

    const telemetry = payload as TelemetryPayload;

    if (this.trackingMode === 'cost-only') {
      // cost-only: strip metadata and set tokens to 0
      return {
        ...telemetry,
        tokens_prompt: 0,
        tokens_completion: 0,
        metadata: undefined,
      };
    }

    if (this.trackingMode === 'tokens-only') {
      // tokens-only: strip metadata only
      return {
        ...telemetry,
        metadata: undefined,
      };
    }

    // 'full' mode: send everything unchanged
    return payload;
  }

  private withIdentity(payload: TrackEventPayload): TrackEventPayload {
    const requestId = payload.request_id ?? createRequestId();
    const sentAt = payload.sent_at ?? new Date().toISOString();
    return {
      ...payload,
      request_id: requestId,
      sent_at: sentAt,
    };
  }

  private async createBatchRequestId(serializedBatch: string): Promise<string> {
    try {
      if (typeof crypto !== "undefined" && crypto.subtle) {
        const encoded = new TextEncoder().encode(serializedBatch);
        const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
        const hash = Array.from(new Uint8Array(hashBuffer))
          .map((byte) => byte.toString(16).padStart(2, "0"))
          .join("");
        return `batch_${hash.slice(0, REQUEST_ID_LENGTH)}`;
      }
    } catch {
      // ignore and fallback below
    }

    return `batch_${createRequestId()}`;
  }
}
