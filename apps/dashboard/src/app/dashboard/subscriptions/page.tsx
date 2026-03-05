"use client";

import { useState } from "react";
import { Plus, CreditCard, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AddSubscriptionDialog } from "@/components/add-subscription-dialog";
import { EmptyState } from "@/components/empty-state";
import { formatCurrency } from "@/lib/format";
import {
  MOCK_SUBSCRIPTIONS,
  MOCK_PROJECTS,
  MOCK_ORG,
  MOCK_TOTAL_SPEND_THIS_MONTH,
  MOCK_TOTAL_SUBSCRIPTION_COST,
  MOCK_TRUE_COST,
  PROVIDER_COLOURS,
} from "@/lib/mock-data";
import type { Project, RecurringSubscription } from "@/lib/types";

function getProjectName(projectId: string | null, projects: Project[]): string {
  if (!projectId) return "Organisation-wide";
  return projects.find((p) => p.id === projectId)?.name ?? "Unknown";
}

function getProviderColour(provider: string): string {
  return PROVIDER_COLOURS[provider.toLowerCase()] ?? "#888888";
}

function SubscriptionCard({ sub, projects }: { sub: RecurringSubscription; projects: Project[] }) {
  const colour = getProviderColour(sub.provider);

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white/[0.02] p-6 ring-1 ring-white/[0.06] transition-all duration-200 hover:bg-white/[0.04] hover:ring-white/[0.1]">
      {/* Subtle colour accent line at top */}
      <div
        className="absolute inset-x-0 top-0 h-[2px]"
        style={{ backgroundColor: colour, opacity: 0.5 }}
      />

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold"
            style={{
              backgroundColor: `${colour}15`,
              color: colour,
            }}
          >
            {sub.provider.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-white">{sub.provider}</p>
            <p className="mt-0.5 text-xs text-[#666666]">
              {getProjectName(sub.project_id, projects)}
            </p>
          </div>
        </div>
        <p className="text-lg font-semibold tabular-nums text-white">
          {formatCurrency(sub.monthly_cost)}
          <span className="text-xs font-normal text-[#555555]">/mo</span>
        </p>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Badge variant="secondary" className="text-xs capitalize">
          {sub.scope}
        </Badge>
        {sub.covers_metered_usage ? (
          <Badge
            variant="secondary"
            className="border-emerald-500/20 bg-emerald-500/10 text-xs text-emerald-400"
          >
            Covers metered usage
          </Badge>
        ) : null}
      </div>
    </div>
  );
}

export default function SubscriptionsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);

  const paidSubscriptions = MOCK_SUBSCRIPTIONS.filter((s) => s.monthly_cost > 0);

  return (
    <div className="space-y-8">
      {/* True Cost summary */}
      <div className="rounded-2xl bg-white/[0.02] p-6 ring-1 ring-white/[0.06]">
        <div className="flex items-center gap-2 text-sm font-medium uppercase tracking-widest text-[#666666]">
          <Layers className="h-4 w-4" />
          True Monthly Cost
        </div>
        <p className="mt-3 text-4xl font-semibold tabular-nums tracking-tight text-white">
          {formatCurrency(MOCK_TRUE_COST)}
        </p>
        <div className="mt-4 flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[#10A37F]" />
            <span className="text-[#888888]">
              Metered: <span className="font-medium text-white">{formatCurrency(MOCK_TOTAL_SPEND_THIS_MONTH)}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[#4285F4]" />
            <span className="text-[#888888]">
              Fixed: <span className="font-medium text-white">{formatCurrency(MOCK_TOTAL_SUBSCRIPTION_COST)}</span>
            </span>
          </div>
        </div>
        {/* Proportional bar */}
        <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-white/[0.04]">
          <div
            className="h-full rounded-l-full bg-[#10A37F]"
            style={{
              width: `${(MOCK_TOTAL_SPEND_THIS_MONTH / MOCK_TRUE_COST) * 100}%`,
              opacity: 0.8,
            }}
          />
          <div
            className="h-full rounded-r-full bg-[#4285F4]"
            style={{
              width: `${(MOCK_TOTAL_SUBSCRIPTION_COST / MOCK_TRUE_COST) * 100}%`,
              opacity: 0.8,
            }}
          />
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white">
            Fixed Monthly Costs
          </h1>
          <p className="mt-1 text-sm text-[#666666]">
            {paidSubscriptions.length} active subscription{paidSubscriptions.length !== 1 ? "s" : ""} totalling{" "}
            <span className="text-white">{formatCurrency(MOCK_TOTAL_SUBSCRIPTION_COST)}</span>/month
          </p>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Add subscription
        </Button>
      </div>

      {/* Subscription cards grid */}
      {paidSubscriptions.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {paidSubscriptions.map((sub) => (
            <SubscriptionCard
              key={sub.id}
              sub={sub}
              projects={MOCK_PROJECTS}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={CreditCard}
          title="No subscriptions yet"
          description="Add your first subscription to start tracking fixed monthly costs alongside your metered AI spend."
          actionLabel="Add subscription"
          onAction={() => setDialogOpen(true)}
        />
      )}

      <AddSubscriptionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        projects={MOCK_PROJECTS}
        orgId={MOCK_ORG.id}
      />
    </div>
  );
}
