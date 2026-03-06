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
import { getCostForTokens } from "./pricing";
import type {
  ProjectTrackerConfig,
  TrackLLMParams,
  TrackAPIParams,
  TrackEventPayload,
  TelemetryPayload,
  TrackEventResponse,
  Attribution,
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

/** Retry state for a single flush attempt. */
interface RetryState {
  attempt: number;
  lastRetryMs: number;
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
  
  // Attribution
  private defaultAttribution: Attribution = {};
  
  // Budget tracking
  private readonly budgetConfig: ProjectTrackerConfig['budgetConfig'];
  private hourlySpendUsd = 0;
  private dailySpendUsd = 0;
  private hourlyWindowStartMs = Date.now();
  private dailyWindowStartMs = Date.now();
  private hourlyAlertFired = false;
  private hourlyExceededFired = false;
  private dailyAlertFired = false;
  private dailyExceededFired = false;
  
  // Retry tracking (per batch hash)
  private readonly retryStates = new Map<string, RetryState>();

  constructor(config: ProjectTrackerConfig) {
    const apiKey = sanitizeString(config.apiKey);
    const baseUrl = sanitizeString(config.baseUrl);

    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.trackingMode = config.trackingMode ?? DEFAULTS.trackingMode;
    this.defaultAttribution = config.defaultAttribution ?? {};
    this.budgetConfig = config.budgetConfig;

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
      // Merge default and per-call attribution (per-call wins)
      const mergedAttribution = this.mergeAttribution(params.attribution);
      
      // Calculate cost client-side if pricing is available
      const costUsd = getCostForTokens(
        params.provider,
        params.model,
        params.tokensPrompt,
        params.tokensCompletion,
      );
      
      const payload: TelemetryPayload = {
        type: "telemetry",
        event_type: "llm",
        provider: params.provider,
        model_or_endpoint: params.model,
        tokens_prompt: params.tokensPrompt,
        tokens_completion: params.tokensCompletion,
        metadata: params.metadata,
        attribution: mergedAttribution,
        cost_usd: costUsd,
        timestamp: params.timestamp,
        request_id: params.requestId ?? createRequestId(),
        sent_at: params.sentAt ?? new Date().toISOString(),
      };
      
      // Track spend for budget alerts
      if (costUsd !== undefined) {
        this.trackSpend(costUsd);
      }
      
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
      // Merge default and per-call attribution (per-call wins)
      const mergedAttribution = this.mergeAttribution(params.attribution);
      
      // Note: API calls don't have standard pricing, cost_usd left undefined
      const payload: TelemetryPayload = {
        type: "telemetry",
        event_type: "api",
        provider: params.provider,
        model_or_endpoint: params.endpoint,
        tokens_prompt: params.tokensPrompt,
        tokens_completion: params.tokensCompletion,
        metadata: params.metadata,
        attribution: mergedAttribution,
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
   *
   * @param client      The OpenAI client to wrap
   * @param attribution Optional attribution to attach to all tracked calls from this client
   */
  wrapOpenAI<T>(client: T, attribution?: Attribution): T {
    try {
      return createOpenAIWrapper(
        client,
        (params) => this.trackLLM(params),
        attribution,
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
   *
   * @param client      The Anthropic client to wrap
   * @param attribution Optional attribution to attach to all tracked calls from this client
   */
  wrapAnthropic<T>(client: T, attribution?: Attribution): T {
    try {
      return createAnthropicWrapper(
        client,
        (params) => this.trackLLM(params),
        attribution,
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
   *
   * @param client      The Google GenerativeAI client to wrap
   * @param attribution Optional attribution to attach to all tracked calls from this client
   */
  wrapGoogleAI<T>(client: T, attribution?: Attribution): T {
    try {
      return createGoogleAIWrapper(
        client,
        (params) => this.trackLLM(params),
        attribution,
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
      const batchHash = await this.createBatchRequestId(serializedBatch);
      
      // Get or create retry state for this batch
      let retryState = this.retryStates.get(batchHash);
      if (!retryState) {
        retryState = { attempt: 0, lastRetryMs: 0 };
        this.retryStates.set(batchHash, retryState);
      }
      
      const requestTimestamp = new Date().toISOString();
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
          "x-request-id": batchHash,
          "x-request-timestamp": requestTimestamp,
        },
        body: serializedBatch,
      });

      if (response.status === 429) {
        // Rate limited: respect Retry-After header if present
        const retryAfterHeader = response.headers.get("Retry-After");
        const retryAfterMs = retryAfterHeader
          ? parseInt(retryAfterHeader, 10) * 1000
          : this.calculateBackoffMs(retryState.attempt);
        
        if (retryState.attempt < 5) {
          console.warn(
            `[@finops/sdk] rate limited (429). Retrying after ${String(retryAfterMs)}ms (attempt ${String(retryState.attempt + 1)}/5).`,
          );
          retryState.attempt++;
          retryState.lastRetryMs = Date.now();
          this.queue.prependAll(batch);
          return undefined;
        } else {
          console.warn(
            `[@finops/sdk] rate limited (429). Max retries reached, dropping ${String(batch.length)} items.`,
          );
          this.retryStates.delete(batchHash);
          return undefined;
        }
      }

      if (response.status >= 500) {
        // Server error: exponential backoff with jitter
        if (retryState.attempt < 5) {
          const backoffMs = this.calculateBackoffMs(retryState.attempt);
          console.warn(
            `[@finops/sdk] server error (${String(response.status)}). Retrying after ${String(backoffMs)}ms (attempt ${String(retryState.attempt + 1)}/5).`,
          );
          retryState.attempt++;
          retryState.lastRetryMs = Date.now();
          this.queue.prependAll(batch);
          return undefined;
        } else {
          console.warn(
            `[@finops/sdk] server error (${String(response.status)}). Max retries reached, dropping ${String(batch.length)} items.`,
          );
          this.retryStates.delete(batchHash);
          return undefined;
        }
      }

      if (!response.ok) {
        console.warn(
          `[@finops/sdk] flush failed: HTTP ${String(response.status)}`,
        );
        this.retryStates.delete(batchHash);
        return undefined;
      }

      // Success — clear retry state
      this.retryStates.delete(batchHash);
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
   * Update the default attribution fields. These are merged with per-call
   * attribution (per-call wins).
   *
   * @param attrs Partial attribution to merge with current defaults
   */
  setAttribution(attrs: Partial<Attribution>): void {
    try {
      this.defaultAttribution = {
        ...this.defaultAttribution,
        ...attrs,
      };
    } catch {
      // Guardrail: never crash the host
    }
  }

  /**
   * Calculate estimated cost for a given number of tokens.
   *
   * @param provider         Provider name (e.g., "openai")
   * @param model            Model identifier (e.g., "gpt-4o")
   * @param promptTokens     Number of input/prompt tokens
   * @param completionTokens Number of output/completion tokens
   * @returns                Cost in USD, or undefined if the model is not in the pricing registry
   */
  getEstimatedCost(
    provider: string,
    model: string,
    promptTokens: number,
    completionTokens: number,
  ): number | undefined {
    try {
      return getCostForTokens(provider, model, promptTokens, completionTokens);
    } catch {
      return undefined;
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

  /**
   * Merge default attribution with per-call attribution.
   * Per-call values override defaults.
   * Returns undefined if both are empty.
   */
  private mergeAttribution(callAttribution?: Attribution): Attribution | undefined {
    const merged: Attribution = {
      ...this.defaultAttribution,
      ...callAttribution,
    };
    
    // If tags exist in both, merge them (per-call wins for same keys)
    if (this.defaultAttribution.tags || callAttribution?.tags) {
      merged.tags = {
        ...this.defaultAttribution.tags,
        ...callAttribution?.tags,
      };
    }
    
    // Return undefined if completely empty
    const hasAnyField = Object.keys(merged).some(key => {
      const value = merged[key as keyof Attribution];
      return value !== undefined && value !== null && 
        (typeof value !== 'object' || Object.keys(value).length > 0);
    });
    
    return hasAnyField ? merged : undefined;
  }

  /**
   * Track spend and fire budget alerts if thresholds are crossed.
   */
  private trackSpend(costUsd: number): void {
    if (!this.budgetConfig) {
      return;
    }

    try {
      const nowMs = Date.now();
      
      // Check if hourly window has reset (1 hour = 3600000ms)
      if (nowMs - this.hourlyWindowStartMs >= 3_600_000) {
        this.hourlySpendUsd = 0;
        this.hourlyWindowStartMs = nowMs;
        this.hourlyAlertFired = false;
        this.hourlyExceededFired = false;
      }
      
      // Check if daily window has reset (24 hours = 86400000ms)
      if (nowMs - this.dailyWindowStartMs >= 86_400_000) {
        this.dailySpendUsd = 0;
        this.dailyWindowStartMs = nowMs;
        this.dailyAlertFired = false;
        this.dailyExceededFired = false;
      }
      
      // Add cost to windows
      this.hourlySpendUsd += costUsd;
      this.dailySpendUsd += costUsd;
      
      // Check hourly budget
      if (this.budgetConfig.hourlyLimitUsd !== undefined) {
        const hourlyPercent = (this.hourlySpendUsd / this.budgetConfig.hourlyLimitUsd) * 100;
        
        if (hourlyPercent >= 100 && !this.hourlyExceededFired && this.budgetConfig.onBudgetExceeded) {
          this.hourlyExceededFired = true;
          this.budgetConfig.onBudgetExceeded({
            type: 'hourly',
            limitUsd: this.budgetConfig.hourlyLimitUsd,
            currentUsd: this.hourlySpendUsd,
            percentUsed: hourlyPercent,
          });
        } else if (hourlyPercent >= 80 && !this.hourlyAlertFired && this.budgetConfig.onBudgetAlert) {
          this.hourlyAlertFired = true;
          this.budgetConfig.onBudgetAlert({
            type: 'hourly',
            limitUsd: this.budgetConfig.hourlyLimitUsd,
            currentUsd: this.hourlySpendUsd,
            percentUsed: hourlyPercent,
          });
        }
      }
      
      // Check daily budget
      if (this.budgetConfig.dailyLimitUsd !== undefined) {
        const dailyPercent = (this.dailySpendUsd / this.budgetConfig.dailyLimitUsd) * 100;
        
        if (dailyPercent >= 100 && !this.dailyExceededFired && this.budgetConfig.onBudgetExceeded) {
          this.dailyExceededFired = true;
          this.budgetConfig.onBudgetExceeded({
            type: 'daily',
            limitUsd: this.budgetConfig.dailyLimitUsd,
            currentUsd: this.dailySpendUsd,
            percentUsed: dailyPercent,
          });
        } else if (dailyPercent >= 80 && !this.dailyAlertFired && this.budgetConfig.onBudgetAlert) {
          this.dailyAlertFired = true;
          this.budgetConfig.onBudgetAlert({
            type: 'daily',
            limitUsd: this.budgetConfig.dailyLimitUsd,
            currentUsd: this.dailySpendUsd,
            percentUsed: dailyPercent,
          });
        }
      }
    } catch {
      // Guardrail: never crash the host
    }
  }

  /**
   * Calculate exponential backoff with jitter.
   * Base: 1s, max: 30s.
   */
  private calculateBackoffMs(attempt: number): number {
    const baseMs = 1000;
    const maxMs = 30_000;
    const exponentialMs = baseMs * Math.pow(2, attempt);
    const cappedMs = Math.min(exponentialMs, maxMs);
    // Add jitter: random between 50% and 100% of capped value
    const jitter = 0.5 + Math.random() * 0.5;
    return Math.floor(cappedMs * jitter);
  }
}
