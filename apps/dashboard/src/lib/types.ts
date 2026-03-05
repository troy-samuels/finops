import type { Database } from "@finops/db-types";

export type Organization = Database["public"]["Tables"]["organizations"]["Row"];
export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type ApiKey = Database["public"]["Tables"]["api_keys"]["Row"];
export type RecurringSubscription =
  Database["public"]["Tables"]["recurring_subscriptions"]["Row"];
export type TransactionalEvent =
  Database["public"]["Tables"]["transactional_events"]["Row"];
export type DiscoveredResource =
  Database["public"]["Tables"]["discovered_resources"]["Row"];
export type ModelPricing = Database["public"]["Tables"]["model_pricing"]["Row"];

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
  percentOfTotal: number;
  trend: "up" | "down" | "flat";
  trendPercent: number;
  provider: string;
}

export interface ProviderBreakdown {
  provider: string;
  displayName: string;
  spend: number;
  percentOfTotal: number;
  colour: string;
}

export interface CostInsight {
  id: string;
  icon: "lightbulb" | "trending-down" | "alert" | "zap";
  title: string;
  description: string;
  savingsAmount: number | null;
  severity: "info" | "warning" | "opportunity";
}

export interface BudgetAlert {
  currentSpend: number;
  projectedSpend: number;
  budget: number;
  percentUsed: number;
  daysRemaining: number;
  isOverBudget: boolean;
  isProjectedOverBudget: boolean;
}

export interface SubscriptionFormData {
  provider: string;
  monthly_cost: string;
  scope: "organization" | "project";
  project_id: string | null;
  covers_metered_usage: boolean;
}
