"use client";

import { Lightbulb, TrendingDown, AlertTriangle, Zap } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { CostInsight } from "@/lib/types";

interface CostInsightsProps {
  insights: CostInsight[];
}

const ICON_MAP = {
  lightbulb: Lightbulb,
  "trending-down": TrendingDown,
  alert: AlertTriangle,
  zap: Zap,
} as const;

const SEVERITY_STYLES = {
  info: {
    bg: "bg-blue-500/[0.06]",
    ring: "ring-blue-500/[0.1]",
    icon: "text-blue-400",
  },
  warning: {
    bg: "bg-amber-500/[0.06]",
    ring: "ring-amber-500/[0.1]",
    icon: "text-amber-400",
  },
  opportunity: {
    bg: "bg-emerald-500/[0.06]",
    ring: "ring-emerald-500/[0.1]",
    icon: "text-emerald-400",
  },
} as const;

export function CostInsights({ insights }: CostInsightsProps) {
  return (
    <div>
      <h2 className="text-sm font-medium uppercase tracking-widest text-[#666666]">
        Smart Insights
      </h2>
      <div className="mt-5 space-y-3">
        {insights.map((insight, i) => {
          const Icon = ICON_MAP[insight.icon];
          const styles = SEVERITY_STYLES[insight.severity];

          return (
            <div
              key={insight.id}
              className={`animate-fade-in-up rounded-xl p-5 ring-1 ${styles.bg} ${styles.ring}`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="flex items-start gap-3.5">
                <div className="mt-0.5 shrink-0">
                  <Icon className={`h-4.5 w-4.5 ${styles.icon}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">
                    {insight.title}
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-[#999999]">
                    {insight.description}
                  </p>
                  {insight.savingsAmount !== null ? (
                    <div className="mt-3">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                        <TrendingDown className="h-3 w-3" />
                        Potential savings: {formatCurrency(insight.savingsAmount)}/mo
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
