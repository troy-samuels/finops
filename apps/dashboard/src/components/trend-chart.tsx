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

  return (
    <ResponsiveContainer width="100%" height={400}>
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
  );
}
