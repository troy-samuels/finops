"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { BarChart3 } from "lucide-react";
import { BudgetAlertBanner } from "@/components/budget-alert-banner";
import { HeroMetric } from "@/components/hero-metric";
import { ProviderBreakdownChart } from "@/components/provider-breakdown";
import { TopDrivers } from "@/components/top-drivers";
import { CostInsights } from "@/components/cost-insights";
import { TimePeriodSelector, type TimePeriod } from "@/components/time-period-selector";
import { ChartErrorBoundary } from "@/components/chart-error-boundary";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MOCK_DAILY_SPEND,
  MOCK_TOTAL_SPEND_THIS_MONTH,
  MOCK_TOP_DRIVERS,
  MOCK_SPEND_TREND_PERCENT,
  MOCK_PROVIDER_BREAKDOWN,
  MOCK_INSIGHTS,
  MOCK_BUDGET_ALERT,
} from "@/lib/mock-data";

const TrendChart = dynamic(
  () => import("@/components/trend-chart").then((m) => ({ default: m.TrendChart })),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[280px] w-full rounded-2xl md:h-[360px]" />,
  },
);

export default function OverviewPage() {
  const [period, setPeriod] = useState<TimePeriod>("30d");

  const filteredData =
    period === "7d"
      ? MOCK_DAILY_SPEND.slice(-7)
      : period === "mtd"
        ? MOCK_DAILY_SPEND.slice(-new Date().getDate())
        : MOCK_DAILY_SPEND;

  const isEmpty = MOCK_TOTAL_SPEND_THIS_MONTH === 0;

  if (isEmpty) {
    return (
      <EmptyState
        icon={BarChart3}
        title="No spending data yet"
        description="Start tracking your AI costs by connecting a project and sending events."
        actionLabel="Go to settings"
        onAction={() => {
          window.location.href = "/dashboard/settings/projects";
        }}
      />
    );
  }

  return (
    <div className="space-y-10">
      {/* Budget alert banner */}
      {MOCK_BUDGET_ALERT.isProjectedOverBudget || MOCK_BUDGET_ALERT.isOverBudget ? (
        <BudgetAlertBanner alert={MOCK_BUDGET_ALERT} />
      ) : null}

      {/* Hero metric */}
      <HeroMetric
        label="Total AI Spend This Month"
        amount={MOCK_TOTAL_SPEND_THIS_MONTH}
        trendPercent={MOCK_SPEND_TREND_PERCENT}
      />

      {/* Provider breakdown */}
      <ProviderBreakdownChart data={MOCK_PROVIDER_BREAKDOWN} />

      {/* Cost trend chart */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-widest text-[#666666]">
            Daily Spend
          </h2>
          <TimePeriodSelector value={period} onChange={setPeriod} />
        </div>
        <ChartErrorBoundary>
          <TrendChart data={filteredData} />
        </ChartErrorBoundary>
      </div>

      {/* Top cost drivers */}
      <TopDrivers drivers={MOCK_TOP_DRIVERS} />

      {/* Smart insights */}
      <CostInsights insights={MOCK_INSIGHTS} />
    </div>
  );
}
