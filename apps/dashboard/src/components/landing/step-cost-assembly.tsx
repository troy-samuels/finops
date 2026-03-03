"use client";

import { useInView } from "@/hooks/use-in-view";
import { useCountUp } from "@/hooks/use-count-up";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { label: "AI Requests", value: 2547, display: "$2,547" },
  { label: "Subscriptions", value: 220, display: "$220" },
  { label: "Infrastructure", value: 80, display: "$80" },
];

function formatAnimatedCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function StepCostAssembly() {
  const { ref, inView } = useInView<HTMLDivElement>();
  const totalAmount = useCountUp(2847.63, 1200, inView);

  return (
    <div
      ref={ref}
      className="rounded-xl bg-white/[0.02] p-6 ring-1 ring-white/[0.05]"
    >
      <p className="text-xs font-medium uppercase tracking-wide text-[#555555]">
        Monthly TCO
      </p>
      <p
        className={cn(
          "mt-1 text-3xl font-medium tabular-nums tracking-tighter text-white transition-all duration-700",
          inView ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
        )}
        style={{ transitionDelay: "0.8s" }}
      >
        {formatAnimatedCurrency(totalAmount)}
      </p>

      {/* Assembly formula */}
      <div
        className={cn(
          "mt-3 flex items-center gap-2 text-xs tabular-nums text-[#555555] transition-all duration-500",
          inView ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
        )}
        style={{ transitionDelay: "0.6s" }}
      >
        <span>$2,547</span>
        <span className="text-[#333333]">+</span>
        <span>$220</span>
        <span className="text-[#333333]">+</span>
        <span>$80</span>
        <span className="text-[#333333]">=</span>
        <span className="text-[#888888]">total</span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        {CATEGORIES.map((item, i) => (
          <div
            key={item.label}
            className={cn(
              "rounded-lg bg-white/[0.02] p-3 ring-1 ring-white/[0.04] transition-all duration-500",
              inView
                ? "translate-x-0 opacity-100"
                : "-translate-x-4 opacity-0",
            )}
            style={{ transitionDelay: `${i * 0.2}s` }}
          >
            <p className="text-xs text-[#555555]">{item.label}</p>
            <p className="mt-0.5 text-sm font-medium tabular-nums text-white">
              {item.display}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
