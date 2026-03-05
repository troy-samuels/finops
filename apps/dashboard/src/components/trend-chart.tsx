"use client";

import {
  AreaChart,
  Area,
  XAxis,
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
    <div className="rounded-xl bg-[#1A1A1A] px-4 py-3 shadow-2xl ring-1 ring-white/10">
      <p className="text-xs font-medium text-[#666666]">
        {typeof label === "string" ? formatChartDate(label) : String(label)}
      </p>
      <p className="mt-1 text-sm font-semibold tabular-nums text-white">
        {formatCurrency(payload[0]?.value ?? 0)}
      </p>
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
        className="flex h-[250px] flex-col items-center justify-center rounded-2xl bg-white/[0.02] ring-1 ring-white/[0.06] md:h-[350px]"
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
      className="rounded-2xl bg-white/[0.02] p-4 ring-1 ring-white/[0.06] md:p-6"
    >
      <span className="sr-only">
        Daily spend from {formatChartDate(chartData[0]?.date ?? "")} to{" "}
        {formatChartDate(chartData[chartData.length - 1]?.date ?? "")}
      </span>
      <ResponsiveContainer width="100%" height={300} className="h-[220px] md:h-[300px]">
        <AreaChart
          data={chartData}
          margin={{ top: 8, right: 8, bottom: 0, left: 8 }}
        >
          <defs>
            <linearGradient id="gradTrend" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="#10A37F"
                stopOpacity={0.25}
              />
              <stop
                offset="60%"
                stopColor="#10A37F"
                stopOpacity={0.05}
              />
              <stop
                offset="100%"
                stopColor="#10A37F"
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "#555555" }}
            tickFormatter={formatChartDate}
            interval="preserveStartEnd"
            dy={8}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#333333", strokeDasharray: "4 4" }} />
          <Area
            type="monotone"
            dataKey="total"
            stroke="#10A37F"
            fill="url(#gradTrend)"
            strokeWidth={2}
            dot={false}
            activeDot={{
              r: 4,
              fill: "#10A37F",
              stroke: "#0A0A0A",
              strokeWidth: 2,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
