// ============================================================
// Shared TypeScript types for Edge Functions
// ============================================================

// --- Database row types ---

export interface ApiKeyRow {
  id: string;
  project_id: string;
  label: string;
  key_hash: string;
  last_used_at: string | null;
  revoked_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectRow {
  id: string;
  org_id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface ModelPricingRow {
  id: string;
  provider: string;
  model_name: string;
  prompt_price_per_1k: number;
  completion_price_per_1k: number;
  created_at: string;
  updated_at: string;
}

export interface RecurringSubscriptionRow {
  id: string;
  org_id: string;
  project_id: string | null;
  provider: string;
  monthly_cost: number;
  scope: "organization" | "project";
  covers_metered_usage: boolean;
  created_at: string;
  updated_at: string;
}

// --- Insert types ---

export interface TransactionalEventInsert {
  project_id: string;
  timestamp: string;
  event_type: "llm" | "api";
  provider: string;
  model_or_endpoint: string;
  cost_incurred: number;
  tokens_prompt: number;
  tokens_completion: number;
  billing_mode: "metered" | "subscription_covered";
  is_unmapped: boolean;
  metadata: Record<string, unknown>;
}

export interface DiscoveredResourceInsert {
  project_id: string;
  resource_type: string;
  provider: string;
  status: "active" | "inactive" | "pending" | "error";
  metadata: Record<string, unknown>;
}

export interface ModelPricingUpsert {
  provider: string;
  model_name: string;
  prompt_price_per_1k: number;
  completion_price_per_1k: number;
}

// --- Payload types (inbound from SDK) ---

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
  request_id: string;
  sent_at: string;
}

export interface DiscoveryPayload {
  type: "discovery";
  resource_type: string;
  provider: string;
  status: ResourceStatus;
  metadata?: Record<string, unknown>;
  request_id: string;
  sent_at: string;
}

export type TrackEventPayload = TelemetryPayload | DiscoveryPayload;

// --- Resolved API key ---

export interface ResolvedApiKey {
  apiKeyId: string;
  projectId: string;
  orgId: string;
}

// --- Response types ---

export interface TrackEventResult {
  index: number;
  status: "ok" | "error";
  id?: string;
  error?: string;
}

export interface TrackEventSuccess {
  success: true;
  processed: number;
  errors: number;
  results: TrackEventResult[];
}

export interface SyncPricingSuccess {
  success: true;
  models_fetched: number;
  models_skipped: number;
  models_upserted: number;
  backfill_updated: number;
}

export interface ErrorResponse {
  error: string;
  details?: unknown;
}

// --- OpenRouter API types ---

export interface OpenRouterPricing {
  prompt: string | null;
  completion: string | null;
}

export interface OpenRouterModel {
  id: string;
  pricing: OpenRouterPricing | null;
}

export interface OpenRouterResponse {
  data: OpenRouterModel[];
}

// --- Validation types ---

export interface ValidationSuccess<T> {
  valid: true;
  data: T;
}

export interface ValidationFailure {
  valid: false;
  error: string;
}

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;
