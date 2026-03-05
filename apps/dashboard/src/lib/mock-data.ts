import type {
  Organization,
  Project,
  RecurringSubscription,
  TransactionalEvent,
  DiscoveredResource,
  DailySpend,
  ActionItem,
  TopDriver,
  ProviderBreakdown,
  CostInsight,
  BudgetAlert,
} from "./types";

// ============================================================
// Provider Colours
// ============================================================

export const PROVIDER_COLOURS: Record<string, string> = {
  openai: "#10A37F",
  anthropic: "#D4A574",
  google: "#4285F4",
  vercel: "#FFFFFF",
  aws: "#FF9900",
  pinecone: "#00B4D8",
};

export const PROVIDER_DISPLAY_NAMES: Record<string, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  google: "Google AI",
  vercel: "Vercel",
  aws: "AWS",
  pinecone: "Pinecone",
};

// ============================================================
// Helpers
// ============================================================

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(10, 0, 0, 0);
  return d.toISOString();
}

function dateOnly(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function randomBetween(min: number, max: number): number {
  return Math.round((min + Math.random() * (max - min)) * 1e6) / 1e6;
}

// ============================================================
// Organization & Projects
// ============================================================

export const MOCK_ORG: Organization = {
  id: "a1b2c3d4-0000-4000-8000-000000000001",
  name: "Troy's Studio",
  slug: "troys-studio",
  created_at: "2026-01-15T08:00:00.000Z",
  updated_at: "2026-01-15T08:00:00.000Z",
};

export const MOCK_PROJECTS: Project[] = [
  {
    id: "b1b2c3d4-0000-4000-8000-000000000001",
    org_id: MOCK_ORG.id,
    name: "ChatBot Pro",
    slug: "chatbot-pro",
    created_at: "2026-01-16T10:00:00.000Z",
    updated_at: "2026-01-16T10:00:00.000Z",
  },
  {
    id: "b1b2c3d4-0000-4000-8000-000000000002",
    org_id: MOCK_ORG.id,
    name: "API Gateway",
    slug: "api-gateway",
    created_at: "2026-02-01T09:00:00.000Z",
    updated_at: "2026-02-01T09:00:00.000Z",
  },
];

// ============================================================
// Subscriptions
// ============================================================

export const MOCK_SUBSCRIPTIONS: RecurringSubscription[] = [
  {
    id: "c1b2c3d4-0000-4000-8000-000000000001",
    org_id: MOCK_ORG.id,
    project_id: null,
    provider: "Vercel",
    monthly_cost: 20,
    scope: "organization",
    covers_metered_usage: false,
    created_at: "2026-01-15T08:00:00.000Z",
    updated_at: "2026-01-15T08:00:00.000Z",
  },
  {
    id: "c1b2c3d4-0000-4000-8000-000000000002",
    org_id: MOCK_ORG.id,
    project_id: "b1b2c3d4-0000-4000-8000-000000000001",
    provider: "OpenAI",
    monthly_cost: 200,
    scope: "project",
    covers_metered_usage: false,
    created_at: "2026-01-20T12:00:00.000Z",
    updated_at: "2026-01-20T12:00:00.000Z",
  },
  {
    id: "c1b2c3d4-0000-4000-8000-000000000003",
    org_id: MOCK_ORG.id,
    project_id: "b1b2c3d4-0000-4000-8000-000000000002",
    provider: "Anthropic",
    monthly_cost: 0,
    scope: "project",
    covers_metered_usage: false,
    created_at: "2026-02-01T09:00:00.000Z",
    updated_at: "2026-02-01T09:00:00.000Z",
  },
  {
    id: "c1b2c3d4-0000-4000-8000-000000000004",
    org_id: MOCK_ORG.id,
    project_id: null,
    provider: "Pinecone",
    monthly_cost: 70,
    scope: "organization",
    covers_metered_usage: false,
    created_at: "2026-02-10T14:00:00.000Z",
    updated_at: "2026-02-10T14:00:00.000Z",
  },
];

// ============================================================
// Transactional Events (~200 events over 30 days)
// ============================================================

const MODEL_PRICING = {
  "gpt-4o": { prompt: 2.5, completion: 10.0 },
  "claude-3-5-sonnet-20241022": { prompt: 3.0, completion: 15.0 },
  "gpt-4o-mini": { prompt: 0.15, completion: 0.6 },
  "claude-3-haiku-20240307": { prompt: 0.25, completion: 1.25 },
  "gemini-1.5-pro": { prompt: 1.25, completion: 5.0 },
} as const;

type ModelKey = keyof typeof MODEL_PRICING;

function costFor(model: ModelKey, promptTokens: number, completionTokens: number): number {
  const p = MODEL_PRICING[model];
  return (promptTokens / 1_000_000) * p.prompt + (completionTokens / 1_000_000) * p.completion;
}

function providerFor(model: string): string {
  if (model.startsWith("gpt")) return "openai";
  if (model.startsWith("gemini")) return "google";
  return "anthropic";
}

const events: TransactionalEvent[] = [];
let eventCounter = 0;

for (let day = 29; day >= 0; day--) {
  const ts = daysAgo(day);
  const isWeekend = new Date(ts).getDay() === 0 || new Date(ts).getDay() === 6;
  const chatbotCount = isWeekend ? randomBetween(2, 4) : randomBetween(4, 8);
  const gatewayCount = isWeekend ? randomBetween(0, 2) : randomBetween(1, 3);

  // ChatBot Pro events
  for (let i = 0; i < chatbotCount; i++) {
    const rand = Math.random();
    let model: ModelKey;
    if (rand < 0.5) model = "gpt-4o";
    else if (rand < 0.75) model = "claude-3-5-sonnet-20241022";
    else if (rand < 0.9) model = "gpt-4o-mini";
    else model = "gemini-1.5-pro";

    const prompt = Math.round(randomBetween(400, 1200));
    const completion = Math.round(randomBetween(150, 600));

    eventCounter++;
    events.push({
      id: `e1000000-0000-4000-8000-${String(eventCounter).padStart(12, "0")}`,
      project_id: "b1b2c3d4-0000-4000-8000-000000000001",
      timestamp: ts,
      event_type: "llm",
      provider: providerFor(model),
      model_or_endpoint: model,
      cost_incurred: costFor(model, prompt, completion),
      tokens_prompt: prompt,
      tokens_completion: completion,
      billing_mode: "metered",
      is_unmapped: false,
      metadata: {},
      created_at: ts,
    });
  }

  // API Gateway events
  for (let i = 0; i < gatewayCount; i++) {
    const prompt = Math.round(randomBetween(100, 300));
    const completion = Math.round(randomBetween(30, 80));

    eventCounter++;
    events.push({
      id: `e1000000-0000-4000-8000-${String(eventCounter).padStart(12, "0")}`,
      project_id: "b1b2c3d4-0000-4000-8000-000000000002",
      timestamp: ts,
      event_type: "api",
      provider: "anthropic",
      model_or_endpoint: "claude-3-haiku-20240307",
      cost_incurred: costFor("claude-3-haiku-20240307", prompt, completion),
      tokens_prompt: prompt,
      tokens_completion: completion,
      billing_mode: "metered",
      is_unmapped: false,
      metadata: {},
      created_at: ts,
    });
  }
}

// Add 5 unmapped events for an unknown model (recent days)
for (let i = 0; i < 5; i++) {
  eventCounter++;
  events.push({
    id: `e1000000-0000-4000-8000-${String(eventCounter).padStart(12, "0")}`,
    project_id: "b1b2c3d4-0000-4000-8000-000000000002",
    timestamp: daysAgo(i),
    event_type: "llm",
    provider: "anthropic",
    model_or_endpoint: "claude-3-7-sonnet-20250219",
    cost_incurred: 0,
    tokens_prompt: Math.round(randomBetween(500, 1000)),
    tokens_completion: Math.round(randomBetween(200, 500)),
    billing_mode: "metered",
    is_unmapped: true,
    metadata: {},
    created_at: daysAgo(i),
  });
}

export const MOCK_EVENTS: TransactionalEvent[] = events;

// ============================================================
// Discovered Resources
// ============================================================

export const MOCK_DISCOVERED_RESOURCES: DiscoveredResource[] = [
  {
    id: "d1b2c3d4-0000-4000-8000-000000000001",
    project_id: "b1b2c3d4-0000-4000-8000-000000000001",
    resource_type: "hosting",
    provider: "vercel",
    status: "active",
    metadata: { detected_by: "sdk_auto_discovery" },
    created_at: "2026-01-16T10:05:00.000Z",
    updated_at: "2026-01-16T10:05:00.000Z",
  },
  {
    id: "d1b2c3d4-0000-4000-8000-000000000002",
    project_id: "b1b2c3d4-0000-4000-8000-000000000002",
    resource_type: "lambda-function",
    provider: "aws",
    status: "pending",
    metadata: { detected_by: "sdk_auto_discovery" },
    created_at: daysAgo(3),
    updated_at: daysAgo(3),
  },
  {
    id: "d1b2c3d4-0000-4000-8000-000000000003",
    project_id: "b1b2c3d4-0000-4000-8000-000000000001",
    resource_type: "vector-database",
    provider: "pinecone",
    status: "active",
    metadata: { detected_by: "sdk_auto_discovery" },
    created_at: "2026-02-10T14:00:00.000Z",
    updated_at: "2026-02-10T14:00:00.000Z",
  },
];

// ============================================================
// Daily Spend (pre-computed for chart)
// ============================================================

const dailySubscriptionCost = 290 / 30;

export const MOCK_DAILY_SPEND: DailySpend[] = Array.from({ length: 30 }, (_, i) => {
  const dayIndex = 29 - i;
  const date = dateOnly(dayIndex);
  const dayEvents = events.filter(
    (e) => e.timestamp.slice(0, 10) === date && !e.is_unmapped,
  );

  let llm = 0;
  let api = 0;
  for (const e of dayEvents) {
    if (e.event_type === "llm") llm += e.cost_incurred;
    else api += e.cost_incurred;
  }

  return {
    date,
    llm: Math.round(llm * 100) / 100,
    api: Math.round(api * 100) / 100,
    subscriptions: Math.round(dailySubscriptionCost * 100) / 100,
  };
});

// ============================================================
// Summary Metrics
// ============================================================

export const MOCK_TOTAL_SPEND_THIS_MONTH: number =
  MOCK_DAILY_SPEND.reduce((sum, d) => sum + d.llm + d.api + d.subscriptions, 0);

export const MOCK_TOTAL_EVENTS: number = events.length;

export const MOCK_ACTIVE_MODELS: number = new Set(
  events.filter((e) => !e.is_unmapped).map((e) => e.model_or_endpoint),
).size;

export const MOCK_UNMAPPED_COUNT: number = events.filter((e) => e.is_unmapped).length;

// ============================================================
// Action Items (derived from pending resources + unmapped models)
// ============================================================

export const MOCK_ACTION_ITEMS: ActionItem[] = [
  {
    id: "act-001",
    type: "pending_resource",
    title: "AWS Lambda detected",
    description: "Infrastructure discovered in API Gateway",
    provider: "aws",
    project_name: "API Gateway",
    project_id: "b1b2c3d4-0000-4000-8000-000000000002",
    created_at: daysAgo(3),
    source_id: "d1b2c3d4-0000-4000-8000-000000000002",
    action_label: "Add Subscription",
    action_type: "add_subscription",
  },
  {
    id: "act-002",
    type: "unmapped_model",
    title: "Unknown model: claude-3-7-sonnet-20250219",
    description: "5 events with no pricing data in API Gateway",
    provider: "anthropic",
    project_name: "API Gateway",
    project_id: "b1b2c3d4-0000-4000-8000-000000000002",
    created_at: daysAgo(0),
    source_id: "unmapped-claude-3-7-sonnet",
    action_label: "Awaiting Pricing Sync",
    action_type: "awaiting_sync",
  },
  {
    id: "act-003",
    type: "pending_resource",
    title: "Pinecone vector database detected",
    description: "Usage discovered in ChatBot Pro",
    provider: "pinecone",
    project_name: "ChatBot Pro",
    project_id: "b1b2c3d4-0000-4000-8000-000000000001",
    created_at: "2026-02-10T14:00:00.000Z",
    source_id: "d1b2c3d4-0000-4000-8000-000000000003",
    action_label: "Review",
    action_type: "review",
  },
];

// ============================================================
// Top Drivers (computed from events + subscriptions)
// ============================================================

function formatModelName(model: string): string {
  if (model.startsWith("claude")) {
    return model
      .replace(/-\d{8}$/, "")
      .split("-")
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(" ")
      .replace(/(\d) (\d)/, "$1.$2");
  }
  if (model.startsWith("gpt")) {
    return "GPT-" + model.slice(4);
  }
  if (model.startsWith("gemini")) {
    return model
      .split("-")
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(" ");
  }
  return model;
}

const costBySource = new Map<string, { cost: number; provider: string }>();
for (const e of events) {
  if (!e.is_unmapped) {
    const current = costBySource.get(e.model_or_endpoint);
    costBySource.set(e.model_or_endpoint, {
      cost: (current?.cost ?? 0) + e.cost_incurred,
      provider: e.provider,
    });
  }
}

const totalMeteredSpend = Array.from(costBySource.values()).reduce(
  (sum, v) => sum + v.cost,
  0,
);

export const MOCK_TOP_DRIVERS: TopDriver[] = Array.from(costBySource.entries())
  .sort((a, b) => b[1].cost - a[1].cost || a[0].localeCompare(b[0]))
  .slice(0, 5)
  .map(([name, data], i) => ({
    rank: i + 1,
    name: name.includes("-") ? formatModelName(name) : name,
    cost: Math.round(data.cost * 100) / 100,
    percentOfTotal: Math.round((data.cost / totalMeteredSpend) * 100),
    trend: i === 0 ? ("up" as const) : i === 1 ? ("up" as const) : ("down" as const),
    trendPercent: i === 0 ? 8 : i === 1 ? 15 : -5,
    provider: data.provider,
  }));

// ============================================================
// Provider Breakdown
// ============================================================

const spendByProvider = new Map<string, number>();
for (const e of events) {
  if (!e.is_unmapped) {
    const current = spendByProvider.get(e.provider) ?? 0;
    spendByProvider.set(e.provider, current + e.cost_incurred);
  }
}

const totalProviderSpend = Array.from(spendByProvider.values()).reduce(
  (sum, v) => sum + v,
  0,
);

export const MOCK_PROVIDER_BREAKDOWN: ProviderBreakdown[] = Array.from(
  spendByProvider.entries(),
)
  .sort((a, b) => b[1] - a[1])
  .map(([provider, spend]) => ({
    provider,
    displayName: PROVIDER_DISPLAY_NAMES[provider] ?? provider,
    spend: Math.round(spend * 100) / 100,
    percentOfTotal: Math.round((spend / totalProviderSpend) * 100),
    colour: PROVIDER_COLOURS[provider] ?? "#888888",
  }));

// ============================================================
// Cost Insights
// ============================================================

const gpt4oSpend = costBySource.get("gpt-4o")?.cost ?? 0;
const gpt4oPercent = totalMeteredSpend > 0 ? Math.round((gpt4oSpend / totalMeteredSpend) * 100) : 0;

export const MOCK_INSIGHTS: CostInsight[] = [
  {
    id: "insight-1",
    icon: "lightbulb",
    title: `GPT-4o accounts for ${gpt4oPercent}% of your metered spend`,
    description:
      "Consider switching low-complexity tasks to GPT-4o-mini. Based on your usage patterns, this could save you roughly £430 per month.",
    savingsAmount: 430,
    severity: "opportunity",
  },
  {
    id: "insight-2",
    icon: "trending-down",
    title: "Weekend usage is 60% lower than weekdays",
    description:
      "Your AI usage drops significantly on weekends. If these are automated tasks, consider batching them during off-peak hours for potential rate savings.",
    savingsAmount: null,
    severity: "info",
  },
  {
    id: "insight-3",
    icon: "alert",
    title: "5 API calls have unmapped pricing",
    description:
      "We couldn't calculate costs for claude-3-7-sonnet calls. Once pricing data is synced, these will appear in your totals.",
    savingsAmount: null,
    severity: "warning",
  },
];

// ============================================================
// Budget Alert
// ============================================================

const daysInMonth = new Date(
  new Date().getFullYear(),
  new Date().getMonth() + 1,
  0,
).getDate();
const currentDay = new Date().getDate();
const daysRemaining = daysInMonth - currentDay;
const dailyAverage = MOCK_TOTAL_SPEND_THIS_MONTH / currentDay;
const projectedSpend = dailyAverage * daysInMonth;
const monthlyBudget = 3500;

export const MOCK_BUDGET_ALERT: BudgetAlert = {
  currentSpend: MOCK_TOTAL_SPEND_THIS_MONTH,
  projectedSpend: Math.round(projectedSpend * 100) / 100,
  budget: monthlyBudget,
  percentUsed: Math.round((MOCK_TOTAL_SPEND_THIS_MONTH / monthlyBudget) * 100),
  daysRemaining,
  isOverBudget: MOCK_TOTAL_SPEND_THIS_MONTH > monthlyBudget,
  isProjectedOverBudget: projectedSpend > monthlyBudget,
};

// ============================================================
// Spend Trend (month-over-month mock)
// ============================================================

export const MOCK_SPEND_TREND_PERCENT: number = 12;

// ============================================================
// Subscription totals
// ============================================================

export const MOCK_TOTAL_SUBSCRIPTION_COST: number = MOCK_SUBSCRIPTIONS.reduce(
  (sum, s) => sum + s.monthly_cost,
  0,
);

export const MOCK_TRUE_COST: number =
  MOCK_TOTAL_SPEND_THIS_MONTH + MOCK_TOTAL_SUBSCRIPTION_COST;
