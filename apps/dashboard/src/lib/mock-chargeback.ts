import { MOCK_ORG, MOCK_PROJECTS } from "./mock-data";

// ============================================================
// Types
// ============================================================

export interface CostCentre {
  id: string;
  org_id: string;
  name: string;
  code: string;
  parent_id: string | null;
  budget_monthly: number | null;
  owner_email: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CostAllocationRule {
  id: string;
  org_id: string;
  cost_centre_id: string;
  rule_type: "project" | "provider" | "model" | "tag" | "percentage";
  match_key: string | null;
  match_value: string | null;
  allocation_percent: number;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface ChargebackReport {
  id: string;
  org_id: string;
  period_start: string; // YYYY-MM-DD
  period_end: string; // YYYY-MM-DD
  generated_at: string;
  generated_by: string | null;
  status: "pending" | "generating" | "complete" | "failed";
  total_cost: number;
  allocated_cost: number;
  unallocated_cost: number;
  report_data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ChargebackLineItem {
  id: string;
  report_id: string;
  cost_centre_id: string;
  total_cost: number;
  event_count: number;
  tokens_prompt: number;
  tokens_completion: number;
  top_models: Array<{ model: string; cost: number; percent: number }>;
  top_projects: Array<{ project: string; cost: number; percent: number }>;
  created_at: string;
}

// ============================================================
// Helpers
// ============================================================

function isoStr(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
}

// ============================================================
// Cost Centres
// ============================================================

export const MOCK_COST_CENTRES: CostCentre[] = [
  {
    id: "cc-eng-001",
    org_id: MOCK_ORG.id,
    name: "Engineering",
    code: "ENG-001",
    parent_id: null,
    budget_monthly: 5000.0,
    owner_email: "cto@troysstudio.com",
    metadata: { team_size: 12 },
    created_at: isoStr(90),
    updated_at: isoStr(90),
  },
  {
    id: "cc-mkt-001",
    org_id: MOCK_ORG.id,
    name: "Marketing AI",
    code: "MKT-001",
    parent_id: null,
    budget_monthly: 2000.0,
    owner_email: "cmo@troysstudio.com",
    metadata: { campaign_focus: "content" },
    created_at: isoStr(90),
    updated_at: isoStr(90),
  },
  {
    id: "cc-sup-001",
    org_id: MOCK_ORG.id,
    name: "Customer Support",
    code: "SUP-001",
    parent_id: null,
    budget_monthly: 1500.0,
    owner_email: "support@troysstudio.com",
    metadata: { channels: ["chat", "email"] },
    created_at: isoStr(90),
    updated_at: isoStr(90),
  },
];

// ============================================================
// Cost Allocation Rules
// ============================================================

export const MOCK_COST_ALLOCATION_RULES: CostAllocationRule[] = [
  // Engineering gets ChatBot Pro
  {
    id: "rule-001",
    org_id: MOCK_ORG.id,
    cost_centre_id: "cc-eng-001",
    rule_type: "project",
    match_key: null,
    match_value: MOCK_PROJECTS[0]?.id ?? "", // ChatBot Pro
    allocation_percent: 100.0,
    priority: 10,
    created_at: isoStr(90),
    updated_at: isoStr(90),
  },
  // Marketing AI gets ContentGen
  {
    id: "rule-002",
    org_id: MOCK_ORG.id,
    cost_centre_id: "cc-mkt-001",
    rule_type: "project",
    match_key: null,
    match_value: MOCK_PROJECTS[1]?.id ?? "", // ContentGen
    allocation_percent: 100.0,
    priority: 10,
    created_at: isoStr(90),
    updated_at: isoStr(90),
  },
  // Customer Support gets SupportBot
  {
    id: "rule-003",
    org_id: MOCK_ORG.id,
    cost_centre_id: "cc-sup-001",
    rule_type: "project",
    match_key: null,
    match_value: MOCK_PROJECTS[2]?.id ?? "", // SupportBot
    allocation_percent: 100.0,
    priority: 10,
    created_at: isoStr(90),
    updated_at: isoStr(90),
  },
  // Marketing AI also gets all Anthropic usage (cross-project)
  {
    id: "rule-004",
    org_id: MOCK_ORG.id,
    cost_centre_id: "cc-mkt-001",
    rule_type: "provider",
    match_key: null,
    match_value: "anthropic",
    allocation_percent: 100.0,
    priority: 5,
    created_at: isoStr(80),
    updated_at: isoStr(80),
  },
  // Engineering gets 30% of unallocated costs (catch-all)
  {
    id: "rule-005",
    org_id: MOCK_ORG.id,
    cost_centre_id: "cc-eng-001",
    rule_type: "percentage",
    match_key: null,
    match_value: null,
    allocation_percent: 30.0,
    priority: 1,
    created_at: isoStr(80),
    updated_at: isoStr(80),
  },
];

// ============================================================
// Chargeback Reports
// ============================================================

const now = new Date();
const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

export const MOCK_CHARGEBACK_REPORTS: ChargebackReport[] = [
  // Current month (in progress)
  {
    id: "report-current",
    org_id: MOCK_ORG.id,
    period_start: currentMonthStart.toISOString().slice(0, 10),
    period_end: currentMonthEnd.toISOString().slice(0, 10),
    generated_at: isoStr(0),
    generated_by: null,
    status: "complete",
    total_cost: 3245.67,
    allocated_cost: 3102.43,
    unallocated_cost: 143.24,
    report_data: {},
    created_at: isoStr(0),
    updated_at: isoStr(0),
  },
  // Last month (complete)
  {
    id: "report-last-month",
    org_id: MOCK_ORG.id,
    period_start: lastMonthStart.toISOString().slice(0, 10),
    period_end: lastMonthEnd.toISOString().slice(0, 10),
    generated_at: isoStr(30),
    generated_by: null,
    status: "complete",
    total_cost: 4521.89,
    allocated_cost: 4398.12,
    unallocated_cost: 123.77,
    report_data: {},
    created_at: isoStr(30),
    updated_at: isoStr(30),
  },
];

// ============================================================
// Chargeback Line Items
// ============================================================

export const MOCK_CHARGEBACK_LINE_ITEMS: ChargebackLineItem[] = [
  // Current month — Engineering
  {
    id: "line-current-eng",
    report_id: "report-current",
    cost_centre_id: "cc-eng-001",
    total_cost: 1845.32,
    event_count: 2341,
    tokens_prompt: 1234567,
    tokens_completion: 987654,
    top_models: [
      { model: "gpt-4o", cost: 1234.21, percent: 66.9 },
      { model: "gpt-4o-mini", cost: 456.11, percent: 24.7 },
      { model: "claude-3.5-sonnet", cost: 155.0, percent: 8.4 },
    ],
    top_projects: [{ project: "ChatBot Pro", cost: 1845.32, percent: 100.0 }],
    created_at: isoStr(0),
  },
  // Current month — Marketing AI
  {
    id: "line-current-mkt",
    report_id: "report-current",
    cost_centre_id: "cc-mkt-001",
    total_cost: 876.54,
    event_count: 1523,
    tokens_prompt: 876543,
    tokens_completion: 654321,
    top_models: [
      { model: "claude-3.5-sonnet", cost: 567.32, percent: 64.7 },
      { model: "gpt-4o-mini", cost: 309.22, percent: 35.3 },
    ],
    top_projects: [
      { project: "ContentGen", cost: 689.54, percent: 78.7 },
      { project: "ChatBot Pro", cost: 187.0, percent: 21.3 },
    ],
    created_at: isoStr(0),
  },
  // Current month — Customer Support
  {
    id: "line-current-sup",
    report_id: "report-current",
    cost_centre_id: "cc-sup-001",
    total_cost: 380.57,
    event_count: 891,
    tokens_prompt: 234567,
    tokens_completion: 345678,
    top_models: [
      { model: "gpt-4o-mini", cost: 312.45, percent: 82.1 },
      { model: "gpt-4o", cost: 68.12, percent: 17.9 },
    ],
    top_projects: [{ project: "SupportBot", cost: 380.57, percent: 100.0 }],
    created_at: isoStr(0),
  },

  // Last month — Engineering
  {
    id: "line-last-eng",
    report_id: "report-last-month",
    cost_centre_id: "cc-eng-001",
    total_cost: 2567.43,
    event_count: 3142,
    tokens_prompt: 1654321,
    tokens_completion: 1234567,
    top_models: [
      { model: "gpt-4o", cost: 1789.21, percent: 69.7 },
      { model: "gpt-4o-mini", cost: 612.22, percent: 23.8 },
      { model: "claude-3.5-sonnet", cost: 166.0, percent: 6.5 },
    ],
    top_projects: [{ project: "ChatBot Pro", cost: 2567.43, percent: 100.0 }],
    created_at: isoStr(30),
  },
  // Last month — Marketing AI
  {
    id: "line-last-mkt",
    report_id: "report-last-month",
    cost_centre_id: "cc-mkt-001",
    total_cost: 1234.56,
    event_count: 2012,
    tokens_prompt: 1123456,
    tokens_completion: 887654,
    top_models: [
      { model: "claude-3.5-sonnet", cost: 789.34, percent: 63.9 },
      { model: "gpt-4o-mini", cost: 445.22, percent: 36.1 },
    ],
    top_projects: [
      { project: "ContentGen", cost: 987.65, percent: 80.0 },
      { project: "ChatBot Pro", cost: 246.91, percent: 20.0 },
    ],
    created_at: isoStr(30),
  },
  // Last month — Customer Support
  {
    id: "line-last-sup",
    report_id: "report-last-month",
    cost_centre_id: "cc-sup-001",
    total_cost: 596.13,
    event_count: 1287,
    tokens_prompt: 345678,
    tokens_completion: 456789,
    top_models: [
      { model: "gpt-4o-mini", cost: 487.21, percent: 81.7 },
      { model: "gpt-4o", cost: 108.92, percent: 18.3 },
    ],
    top_projects: [{ project: "SupportBot", cost: 596.13, percent: 100.0 }],
    created_at: isoStr(30),
  },
];

// ============================================================
// Helpers for UI
// ============================================================

export function getCostCentreName(costCentreId: string): string {
  return MOCK_COST_CENTRES.find((cc) => cc.id === costCentreId)?.name ?? "Unknown";
}

export function getCostCentreCode(costCentreId: string): string {
  return MOCK_COST_CENTRES.find((cc) => cc.id === costCentreId)?.code ?? "???";
}

export function getLineItemsForReport(reportId: string): ChargebackLineItem[] {
  return MOCK_CHARGEBACK_LINE_ITEMS.filter((li) => li.report_id === reportId);
}

export function getRulesForCostCentre(costCentreId: string): CostAllocationRule[] {
  return MOCK_COST_ALLOCATION_RULES.filter((r) => r.cost_centre_id === costCentreId);
}
