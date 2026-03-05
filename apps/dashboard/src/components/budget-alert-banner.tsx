"use client";

import { AlertTriangle, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { BudgetAlert } from "@/lib/types";

interface BudgetAlertBannerProps {
  alert: BudgetAlert;
}

export function BudgetAlertBanner({ alert }: BudgetAlertBannerProps) {
  if (!alert.isProjectedOverBudget && !alert.isOverBudget) return null;

  const isOver = alert.isOverBudget;
  const bgClass = isOver
    ? "bg-red-500/[0.08] ring-red-500/20"
    : "bg-amber-500/[0.08] ring-amber-500/20";
  const iconClass = isOver ? "text-red-400" : "text-amber-400";
  const textClass = isOver ? "text-red-300" : "text-amber-300";

  return (
    <div
      role="alert"
      className={`animate-slide-down-fade rounded-xl px-5 py-4 ring-1 ${bgClass}`}
    >
      <div className="flex items-start gap-3">
        {isOver ? (
          <AlertTriangle className={`mt-0.5 h-5 w-5 shrink-0 ${iconClass}`} />
        ) : (
          <TrendingUp className={`mt-0.5 h-5 w-5 shrink-0 ${iconClass}`} />
        )}
        <div className="flex-1">
          <p className={`text-sm font-medium ${textClass}`}>
            {isOver
              ? "You've exceeded your monthly budget"
              : "On track to exceed your budget"}
          </p>
          <p className="mt-1 text-sm text-[#999999]">
            {isOver ? (
              <>
                You&apos;ve spent{" "}
                <span className="font-medium text-white">
                  {formatCurrency(alert.currentSpend)}
                </span>{" "}
                of your{" "}
                <span className="font-medium text-white">
                  {formatCurrency(alert.budget)}
                </span>{" "}
                budget this month.
              </>
            ) : (
              <>
                At your current rate, you&apos;ll spend{" "}
                <span className="font-medium text-white">
                  {formatCurrency(alert.projectedSpend)}
                </span>{" "}
                by month&apos;s end — {formatCurrency(alert.projectedSpend - alert.budget)}{" "}
                over your {formatCurrency(alert.budget)} budget.{" "}
                <span className="text-[#777777]">
                  {alert.daysRemaining} days remaining.
                </span>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
