// ============================================================
// @finops/sdk — Public TypeScript Interfaces
// ============================================================

// ---- SDK Configuration ----

export interface ProjectTrackerConfig {
  /** Raw API key sent as x-api-key header. */
  apiKey: string;
  /** Supabase project base URL (e.g., "https://your-project.supabase.co"). */
  baseUrl: string;
  /** Interval (ms) between automatic queue flushes. Default: 2000. */
  flushIntervalMs?: number;
  /** Queue length that triggers an immediate flush. Default: 50. */
  maxBatchSize?: number;
  /** Hard cap on queue length. Oldest items dropped when full. Default: 1000. */
  maxQueueSize?: number;
  /** Run environment variable discovery on init. Default: true. */
  autoDiscovery?: boolean;
}

// ---- Public method parameter types ----

export interface TrackLLMParams {
  provider: string;
  model: string;
  tokensPrompt: number;
  tokensCompletion: number;
  metadata?: Record<string, unknown>;
  timestamp?: string;
}

export interface TrackAPIParams {
  provider: string;
  endpoint: string;
  tokensPrompt: number;
  tokensCompletion: number;
  metadata?: Record<string, unknown>;
  timestamp?: string;
}

// ---- Wire payload types (sent to the Edge Function) ----

export type EventType = "llm" | "api";
export type ResourceStatus = "active" | "inactive" | "pending" | "error";

export interface TelemetryPayload {
  type: "telemetry";
  event_type: EventType;
  provider: string;
  model_or_endpoint: string;
  tokens_prompt: number;
  tokens_completion: number;
  metadata?: Record<string, unknown>;
  timestamp?: string;
}

export interface DiscoveryPayload {
  type: "discovery";
  resource_type: string;
  provider: string;
  status: ResourceStatus;
  metadata?: Record<string, unknown>;
}

export type TrackEventPayload = TelemetryPayload | DiscoveryPayload;

// ---- API Response types ----

export interface TrackEventResultItem {
  index: number;
  status: "ok" | "error";
  id?: string;
  error?: string;
}

export interface TrackEventResponse {
  success: boolean;
  processed: number;
  errors: number;
  results: TrackEventResultItem[];
}
