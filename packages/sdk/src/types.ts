// ============================================================
// @finops/sdk — Public TypeScript Interfaces
// ============================================================

// ---- SDK Configuration ----

/** Structured attribution fields for per-feature cost tracking. */
export interface Attribution {
  /** Feature name (e.g., "chat-assistant", "document-analysis"). */
  feature?: string;
  /** Workflow or use-case identifier (e.g., "onboarding", "support-ticket"). */
  workflow?: string;
  /** Cost centre or department (e.g., "engineering", "customer-success"). */
  costCentre?: string;
  /** User or customer identifier. */
  userId?: string;
  /** Environment (e.g., "production", "staging", "development"). */
  environment?: string;
  /** Custom key-value tags for flexible attribution. */
  tags?: Record<string, string>;
}

/** Budget alert information. */
export interface BudgetAlert {
  /** Alert type: hourly or daily window. */
  type: 'hourly' | 'daily';
  /** Configured limit in USD. */
  limitUsd: number;
  /** Current spend in USD for this window. */
  currentUsd: number;
  /** Percentage of limit used (0-100+). */
  percentUsed: number;
}

/** Budget configuration for spend tracking and alerts. */
export interface BudgetConfig {
  /** Hourly spend limit in USD. */
  hourlyLimitUsd?: number;
  /** Daily spend limit in USD. */
  dailyLimitUsd?: number;
  /** Callback fired when 80% of limit is reached. */
  onBudgetAlert?: (info: BudgetAlert) => void;
  /** Callback fired when 100% of limit is reached. */
  onBudgetExceeded?: (info: BudgetAlert) => void;
}

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
  /**
   * Tracking mode controls what data is transmitted to the server.
   * - 'full' (default): sends all data (tokens, cost, metadata, provider, model)
   * - 'cost-only': only sends provider, model, cost — strips metadata and token counts
   * - 'tokens-only': sends provider, model, token counts — no metadata
   */
  trackingMode?: 'full' | 'cost-only' | 'tokens-only';
  /** Default attribution merged with per-call attribution (per-call wins). */
  defaultAttribution?: Attribution;
  /** Budget limits and alert callbacks for spend tracking. */
  budgetConfig?: BudgetConfig;
}

// ---- Public method parameter types ----

export interface TrackLLMParams {
  provider: string;
  model: string;
  tokensPrompt: number;
  tokensCompletion: number;
  metadata?: Record<string, unknown>;
  attribution?: Attribution;
  timestamp?: string;
  requestId?: string;
  sentAt?: string;
}

export interface TrackAPIParams {
  provider: string;
  endpoint: string;
  tokensPrompt: number;
  tokensCompletion: number;
  metadata?: Record<string, unknown>;
  attribution?: Attribution;
  timestamp?: string;
  requestId?: string;
  sentAt?: string;
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
  attribution?: Attribution;
  cost_usd?: number;
  timestamp?: string;
  request_id?: string;
  sent_at?: string;
}

export interface DiscoveryPayload {
  type: "discovery";
  resource_type: string;
  provider: string;
  status: ResourceStatus;
  metadata?: Record<string, unknown>;
  request_id?: string;
  sent_at?: string;
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
