// ============================================================
// Database Row Types — mirrors Supabase schema exactly
// ============================================================

export interface Organization {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  org_id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface ApiKey {
  id: string;
  project_id: string;
  label: string;
  key_hash: string;
  last_used_at: string | null;
  revoked_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecurringSubscription {
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

export interface TransactionalEvent {
  id: string;
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
  created_at: string;
}

export interface DiscoveredResource {
  id: string;
  project_id: string;
  resource_type: string;
  provider: string;
  status: "active" | "inactive" | "pending" | "error";
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ModelPricing {
  id: string;
  provider: string;
  model_name: string;
  prompt_price_per_1k: number;
  completion_price_per_1k: number;
  created_at: string;
  updated_at: string;
}

export type PlanTier = "free" | "pro" | "enterprise";
export type SubscriptionStatus = "active" | "past_due" | "canceled" | "trialing";

export interface Subscription {
  id: string;
  org_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan_tier: PlanTier;
  status: SubscriptionStatus;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectBudget {
  project_id: string;
  monthly_limit_usd: number;
  alert_threshold_percent: number;
  slack_webhook_url: string | null;
  email_to: string | null;
  last_alerted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PricingTier {
  name: string;
  tier: PlanTier;
  price: number;
  priceLabel: string;
  features: string[];
  cta: string;
  highlighted: boolean;
  priceId: string | null;
}

// ============================================================
// Derived / Computed Types for the Dashboard
// ============================================================

export interface DailySpend {
  date: string;
  llm: number;
  api: number;
  subscriptions: number;
}

export interface ActionItem {
  id: string;
  type: "pending_resource" | "unmapped_model";
  title: string;
  description: string;
  provider: string;
  project_name: string;
  project_id: string;
  created_at: string;
  source_id: string;
  action_label: string;
  action_type: "add_subscription" | "awaiting_sync" | "review";
}

export interface TopDriver {
  rank: number;
  name: string;
  cost: number;
}

// ============================================================
// Form Input Types
// ============================================================

export interface SubscriptionFormData {
  provider: string;
  monthly_cost: string;
  scope: "organization" | "project";
  project_id: string | null;
  covers_metered_usage: boolean;
}
