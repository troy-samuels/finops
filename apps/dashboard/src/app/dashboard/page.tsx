"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { BarChart3 } from "lucide-react";
import { DiscoveryBanner } from "@/components/discovery-banner";
import { HeroMetric } from "@/components/hero-metric";
import { TopDrivers } from "@/components/top-drivers";
import { TimePeriodSelector, type TimePeriod } from "@/components/time-period-selector";
import { ChartErrorBoundary } from "@/components/chart-error-boundary";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MOCK_DAILY_SPEND,
  MOCK_TOTAL_SPEND_THIS_MONTH,
  MOCK_ACTION_ITEMS,
  MOCK_TOP_DRIVERS,
  MOCK_SPEND_TREND_PERCENT,
} from "@/lib/mock-data";

const TrendChart = dynamic(
  () => import("@/components/trend-chart").then((m) => ({ default: m.TrendChart })),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[250px] w-full rounded-xl md:h-[400px]" />,
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
    <div>
      {MOCK_ACTION_ITEMS.length > 0 ? (
        <div className="mb-12">
          <DiscoveryBanner items={MOCK_ACTION_ITEMS} />
        </div>
      ) : null}

      <HeroMetric
        label="Total Spend this Month"
        amount={MOCK_TOTAL_SPEND_THIS_MONTH}
        trendPercent={MOCK_SPEND_TREND_PERCENT}
      />

      <div className="mt-12">
        <div className="flex items-center justify-between">
          <TimePeriodSelector value={period} onChange={setPeriod} />
          <p className="text-xs text-[#555555]">
            Last updated just now
          </p>
        </div>
        <div className="mt-4">
          <ChartErrorBoundary>
            <TrendChart data={filteredData} />
          </ChartErrorBoundary>
        </div>
      </div>

      <div className="mt-12">
        <TopDrivers drivers={MOCK_TOP_DRIVERS} />
      </div>
    </div>
  );
}
