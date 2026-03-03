interface HeroMetricProps {
  label: string;
  value: string;
  subtitle?: string;
  trendPercent?: number;
}

export function HeroMetric({
  label,
  value,
  subtitle,
  trendPercent,
}: HeroMetricProps) {
  return (
    <div>
      <p className="text-sm font-medium uppercase tracking-wide text-[#888888]">
        {label}
      </p>
      <p className="mt-2 text-8xl font-medium tabular-nums tracking-tighter text-white">
        {value}
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
        <p className="mt-3 text-sm text-[#555555]">
          All costs are within budget
        </p>
      ) : null}
      {subtitle ? (
        <p className="mt-1 text-sm text-[#555555]">{subtitle}</p>
      ) : null}
    </div>
  );
}
