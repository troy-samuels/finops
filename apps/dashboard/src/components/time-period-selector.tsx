"use client";

import { cn } from "@/lib/utils";

export type TimePeriod = "7d" | "30d" | "mtd";

const PERIODS: { id: TimePeriod; label: string }[] = [
  { id: "7d", label: "7d" },
  { id: "30d", label: "30d" },
  { id: "mtd", label: "MTD" },
];

interface TimePeriodSelectorProps {
  value: TimePeriod;
  onChange: (period: TimePeriod) => void;
}

export function TimePeriodSelector({
  value,
  onChange,
}: TimePeriodSelectorProps) {
  return (
    <div className="inline-flex gap-1 rounded-lg bg-white/[0.03] p-1 ring-1 ring-white/[0.06]">
      {PERIODS.map((period) => (
        <button
          key={period.id}
          type="button"
          onClick={() => onChange(period.id)}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-medium transition-all",
            value === period.id
              ? "bg-white/[0.08] text-white shadow-sm"
              : "text-[#666666] hover:text-[#888888]",
          )}
        >
          {period.label}
        </button>
      ))}
    </div>
  );
}
