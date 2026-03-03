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
      <p className="text-sm font-medium uppercase tracking-wide text-[#888888]">
        {label}
      </p>
      <p className="mt-2 text-5xl font-medium tabular-nums tracking-tighter text-white md:text-8xl">
        {formatCurrency(animatedValue)}
      </p>
      {trendPercent !== undefined && trendPercent !== 0 ? (
        <div className="mt-3">
          <span
            className={
              trendPercent < 0
                ? "inline-flex items-center rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-400"
                : "inline-flex items-center rounded-full bg-red-400/10 px-3 py-1 text-xs font-medium text-red-400"
            }
          >
            {trendPercent < 0 ? "\u2193" : "\u2191"}{" "}
            {Math.abs(trendPercent)}% from last month
          </span>
        </div>
      ) : trendPercent === 0 ? (
        <div className="mt-3">
          <span className="inline-flex items-center rounded-full bg-white/[0.06] px-3 py-1 text-xs font-medium text-[#888888]">
            Flat — same as last month
          </span>
        </div>
      ) : null}
      {subtitle ? (
        <p className="mt-1 text-sm text-[#555555]">{subtitle}</p>
      ) : null}
    </div>
  );
}
