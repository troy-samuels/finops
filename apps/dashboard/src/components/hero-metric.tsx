"use client";

import { useCountUp } from "@/hooks/use-count-up";
import { formatCurrency } from "@/lib/format";

interface HeroMetricProps {
  label: string;
  amount: number;
  subtitle?: string;
  trendPercent?: number;
}

export function HeroMetric({
  label,
  amount,
  subtitle,
  trendPercent,
}: HeroMetricProps) {
  const animatedValue = useCountUp(amount);

  return (
    <div className="animate-count-up">
      <p className="text-sm font-medium uppercase tracking-widest text-[#666666]">
        {label}
      </p>
      <p className="mt-3 bg-gradient-to-b from-white to-white/70 bg-clip-text text-6xl font-semibold tabular-nums tracking-tighter text-transparent md:text-[88px] md:leading-[0.95]">
        {formatCurrency(animatedValue)}
      </p>
      {trendPercent !== undefined && trendPercent !== 0 ? (
        <div className="mt-4">
          <span
            className={
              trendPercent < 0
                ? "inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3.5 py-1.5 text-sm font-medium text-emerald-400"
                : "inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-3.5 py-1.5 text-sm font-medium text-red-400"
            }
          >
            <span className="text-xs">
              {trendPercent < 0 ? "↓" : "↑"}
            </span>
            {Math.abs(trendPercent)}% vs last month
          </span>
        </div>
      ) : trendPercent === 0 ? (
        <div className="mt-4">
          <span className="inline-flex items-center rounded-full bg-white/[0.06] px-3.5 py-1.5 text-sm font-medium text-[#888888]">
            Flat — same as last month
          </span>
        </div>
      ) : null}
      {subtitle ? (
        <p className="mt-2 text-sm text-[#555555]">{subtitle}</p>
      ) : null}
    </div>
  );
}
