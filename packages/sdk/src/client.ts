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
} as const;

export class ProjectTracker {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly maxBatchSize: number;
  private readonly queue: BatchQueue<TrackEventPayload>;
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private flushing = false;
  private shutdownCalled = false;

  constructor(config: ProjectTrackerConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl.replace(/\/+$/, "");
    this.maxBatchSize = config.maxBatchSize ?? DEFAULTS.maxBatchSize;
    this.queue = new BatchQueue<TrackEventPayload>(
      config.maxQueueSize ?? DEFAULTS.maxQueueSize,
    );

    // Start periodic flush timer
    const intervalMs = config.flushIntervalMs ?? DEFAULTS.flushIntervalMs;
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
    if (config.autoDiscovery ?? DEFAULTS.autoDiscovery) {
      try {
        const discovered = scanEnvironment();
        for (const payload of discovered) {
          this.queue.enqueue(payload);
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
   * Manually flush the queue. Sends all queued items to the backend.
   * Returns the API response or undefined on error/empty queue.
   * Concurrent flushes are skipped (guarded by `flushing` flag).
   */
  async flush(): Promise<TrackEventResponse | undefined> {
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
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
        },
        body: JSON.stringify(batch),
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
    if (this.shutdownCalled) {
      return;
    }

    this.queue.enqueue(payload);

    if (this.queue.length >= this.maxBatchSize) {
      this.flush().catch(() => {
        // Swallow — flush handles errors internally
      });
    }
  }
}
