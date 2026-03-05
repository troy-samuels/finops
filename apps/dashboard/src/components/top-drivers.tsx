"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { PROVIDER_COLOURS } from "@/lib/mock-data";
import { EmptyState } from "@/components/empty-state";
import type { TopDriver } from "@/lib/types";

interface TopDriversProps {
  drivers: TopDriver[];
}

function TrendIcon({ trend }: { trend: "up" | "down" | "flat" }) {
  if (trend === "up") return <TrendingUp className="h-3.5 w-3.5 text-red-400" />;
  if (trend === "down") return <TrendingDown className="h-3.5 w-3.5 text-emerald-400" />;
  return <Minus className="h-3.5 w-3.5 text-[#666666]" />;
}

export function TopDrivers({ drivers }: TopDriversProps) {
  if (drivers.length === 0) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="No cost data yet"
        description="Once you start tracking AI usage, your top cost drivers will appear here."
      />
    );
  }

  const maxCost = Math.max(...drivers.map((d) => d.cost));

  return (
    <div>
      <h2 className="text-sm font-medium uppercase tracking-widest text-[#666666]">
        Top Cost Drivers
      </h2>
      <div className="mt-5 space-y-3">
        {drivers.map((driver, i) => (
          <div
            key={driver.name}
            className="group relative overflow-hidden rounded-xl bg-white/[0.02] p-5 ring-1 ring-white/[0.06] transition-all duration-200 hover:bg-white/[0.04] hover:ring-white/[0.1]"
            style={{
              animationDelay: `${i * 80}ms`,
            }}
          >
            {/* Background fill bar */}
            <div
              className="absolute inset-y-0 left-0 opacity-[0.04] transition-all duration-700"
              style={{
                width: `${(driver.cost / maxCost) * 100}%`,
                backgroundColor: PROVIDER_COLOURS[driver.provider] ?? "#888888",
              }}
            />

            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
                  style={{
                    backgroundColor: `${PROVIDER_COLOURS[driver.provider] ?? "#888888"}15`,
                    color: PROVIDER_COLOURS[driver.provider] ?? "#888888",
                  }}
                >
                  {driver.rank}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    {driver.name}
                  </p>
                  <p className="mt-0.5 text-xs text-[#666666]">
                    {driver.percentOfTotal}% of total spend
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <TrendIcon trend={driver.trend} />
                  <span
                    className={`text-xs font-medium tabular-nums ${
                      driver.trend === "up"
                        ? "text-red-400"
                        : driver.trend === "down"
                          ? "text-emerald-400"
                          : "text-[#666666]"
                    }`}
                  >
                    {driver.trend === "flat"
                      ? "—"
                      : `${Math.abs(driver.trendPercent)}%`}
                  </span>
                </div>
                <span className="min-w-[80px] text-right text-sm font-semibold tabular-nums text-white">
                  {formatCurrency(driver.cost)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
