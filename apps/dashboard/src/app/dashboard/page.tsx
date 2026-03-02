import { HeroMetric } from "@/components/hero-metric";
import { SpendChart } from "@/components/spend-chart";
import { StatCard } from "@/components/stat-card";
import { formatCurrency, formatNumber } from "@/lib/format";
import {
  MOCK_DAILY_SPEND,
  MOCK_TOTAL_SPEND_THIS_MONTH,
  MOCK_TOTAL_EVENTS,
  MOCK_ACTIVE_MODELS,
  MOCK_UNMAPPED_COUNT,
} from "@/lib/mock-data";

export default function OverviewPage() {
  return (
    <div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">March 2026</p>
      </div>

      <div className="mt-8">
        <HeroMetric
          label="Total Spend This Month"
          value={formatCurrency(MOCK_TOTAL_SPEND_THIS_MONTH)}
        />
      </div>

      <div className="mt-10">
        <h2 className="mb-4 text-sm font-medium text-muted-foreground">
          Daily spend
        </h2>
        <SpendChart data={MOCK_DAILY_SPEND} />
      </div>

      <div className="mt-10 grid grid-cols-3 gap-8">
        <StatCard
          label="Events tracked"
          value={formatNumber(MOCK_TOTAL_EVENTS)}
        />
        <StatCard
          label="Active models"
          value={String(MOCK_ACTIVE_MODELS)}
        />
        <StatCard
          label="Unmapped events"
          value={String(MOCK_UNMAPPED_COUNT)}
        />
      </div>
    </div>
  );
}
