import { DiscoveryBanner } from "@/components/discovery-banner";
import { HeroMetric } from "@/components/hero-metric";
import { TrendChart } from "@/components/trend-chart";
import { TopDrivers } from "@/components/top-drivers";
import { formatCurrency } from "@/lib/format";
import {
  MOCK_DAILY_SPEND,
  MOCK_TOTAL_SPEND_THIS_MONTH,
  MOCK_ACTION_ITEMS,
  MOCK_TOP_DRIVERS,
  MOCK_SPEND_TREND_PERCENT,
} from "@/lib/mock-data";

export default function OverviewPage() {
  return (
    <div>
      {MOCK_ACTION_ITEMS.length > 0 ? (
        <div className="mb-12">
          <DiscoveryBanner items={MOCK_ACTION_ITEMS} />
        </div>
      ) : null}

      <HeroMetric
        label="Total Spend this Month"
        value={formatCurrency(MOCK_TOTAL_SPEND_THIS_MONTH)}
        trendPercent={MOCK_SPEND_TREND_PERCENT}
      />

      <div className="mt-12">
        <TrendChart data={MOCK_DAILY_SPEND} />
      </div>

      <div className="mt-12">
        <TopDrivers drivers={MOCK_TOP_DRIVERS} />
      </div>
    </div>
  );
}
