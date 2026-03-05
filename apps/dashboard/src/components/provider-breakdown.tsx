"use client";

import { formatCurrency } from "@/lib/format";
import type { ProviderBreakdown } from "@/lib/types";

interface ProviderBreakdownChartProps {
  data: ProviderBreakdown[];
}

export function ProviderBreakdownChart({ data }: ProviderBreakdownChartProps) {
  const total = data.reduce((sum, d) => sum + d.spend, 0);

  return (
    <div className="animate-fade-in-up rounded-2xl bg-white/[0.02] p-6 ring-1 ring-white/[0.06]">
      <h3 className="text-sm font-medium uppercase tracking-widest text-[#666666]">
        Spend by Provider
      </h3>

      {/* Stacked horizontal bar */}
      <div className="mt-5 flex h-3 overflow-hidden rounded-full bg-white/[0.04]">
        {data.map((item) => (
          <div
            key={item.provider}
            className="h-full transition-all duration-700 ease-out first:rounded-l-full last:rounded-r-full"
            style={{
              width: `${(item.spend / total) * 100}%`,
              backgroundColor: item.colour,
              opacity: 0.85,
            }}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="mt-5 space-y-3">
        {data.map((item) => (
          <div
            key={item.provider}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: item.colour }}
              />
              <span className="text-sm text-[#AAAAAA]">
                {item.displayName}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium tabular-nums text-white">
                {formatCurrency(item.spend)}
              </span>
              <span className="w-10 text-right text-xs tabular-nums text-[#666666]">
                {item.percentOfTotal}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
