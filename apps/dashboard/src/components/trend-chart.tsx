"use client";

import {
  AreaChart,
  Area,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatChartDate, formatCurrency } from "@/lib/format";
import type { DailySpend } from "@/lib/types";

interface TrendChartProps {
  data: DailySpend[];
}

interface ChartTooltipPayload {
  value?: number;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: ChartTooltipPayload[];
  label?: string | number;
}

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="flex items-center gap-3 rounded-full bg-[#1A1A1A] px-4 py-2 shadow-2xl ring-1 ring-white/10">
      <span className="text-xs text-[#666666]">
        {typeof label === "string" ? formatChartDate(label) : String(label)}
      </span>
      <span className="text-xs font-medium tabular-nums text-white">
        {formatCurrency(payload[0]?.value ?? 0)}
      </span>
    </div>
  );
}

export function TrendChart({ data }: TrendChartProps) {
  const chartData = data.map((d) => ({
    date: d.date,
    total: Math.round((d.llm + d.api + d.subscriptions) * 100) / 100,
  }));

  // Single data point fallback
  if (chartData.length <= 1) {
    const point = chartData[0];
    return (
      <div
        role="img"
        aria-label={
          point
            ? `Spend on ${formatChartDate(point.date)}: ${formatCurrency(point.total)}`
            : "No spend data available"
        }
        className="flex h-[250px] flex-col items-center justify-center rounded-xl bg-white/[0.02] ring-1 ring-white/[0.05] md:h-[400px]"
      >
        {point ? (
          <>
            <p className="text-2xl font-medium tabular-nums text-white">
              {formatCurrency(point.total)}
            </p>
            <p className="mt-1 text-sm text-[#666666]">
              {formatChartDate(point.date)}
            </p>
          </>
        ) : (
          <p className="text-sm text-[#666666]">No data yet</p>
        )}
      </div>
    );
  }

  const totalSpend = chartData.reduce((sum, d) => sum + d.total, 0);

  return (
    <div
      role="img"
      aria-label={`Spending trend chart showing ${chartData.length} days of data totaling ${formatCurrency(totalSpend)}`}
    >
      <span className="sr-only">
        Daily spend from {formatChartDate(chartData[0]?.date ?? "")} to{" "}
        {formatChartDate(chartData[chartData.length - 1]?.date ?? "")}
      </span>
      <ResponsiveContainer width="100%" height={400} className="h-[250px] md:h-[400px]">
        <AreaChart
          data={chartData}
          margin={{ top: 4, right: 0, bottom: 0, left: 0 }}
        >
          <defs>
            <linearGradient id="gradTrend" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="hsl(var(--chart-1))"
                stopOpacity={0.2}
              />
              <stop
                offset="100%"
                stopColor="hsl(var(--chart-1))"
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <Tooltip content={<ChartTooltip />} cursor={false} />
          <Area
            type="monotone"
            dataKey="total"
            stroke="hsl(var(--chart-1))"
            fill="url(#gradTrend)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
