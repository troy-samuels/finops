interface HeroMetricProps {
  label: string;
  value: string;
  subtitle?: string;
}

export function HeroMetric({ label, value, subtitle }: HeroMetricProps) {
  return (
    <div>
      <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-5xl font-semibold tabular-nums tracking-tight">
        {value}
      </p>
      {subtitle ? (
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      ) : null}
    </div>
  );
}
