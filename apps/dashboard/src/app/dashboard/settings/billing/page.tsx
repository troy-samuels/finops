"use client";

import Link from "next/link";
import { Sparkles, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatNumber } from "@/lib/format";

const CURRENT_PLAN = {
  tier: "Free" as const,
  eventsUsed: 1247,
  eventsLimit: 10000,
};

const PRO_FEATURES = [
  "Unlimited events",
  "90-day data retention",
  "Budget alerts & forecasting",
  "Team members (up to 10)",
  "Slack & email integrations",
  "Priority support",
];

export default function BillingSettingsPage() {
  const usagePercent = Math.round(
    (CURRENT_PLAN.eventsUsed / CURRENT_PLAN.eventsLimit) * 100,
  );

  const progressColour =
    usagePercent > 80
      ? "bg-red-400"
      : usagePercent > 60
        ? "bg-amber-400"
        : "bg-emerald-400";

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-semibold text-white">Current Plan</h2>
        <p className="mt-1 text-sm text-[#666666]">
          Your current subscription and usage.
        </p>

        <div className="mt-5 max-w-lg rounded-2xl bg-white/[0.02] p-6 ring-1 ring-white/[0.06]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold text-white">
                {CURRENT_PLAN.tier} Plan
              </p>
              <p className="mt-1 text-sm text-[#666666]">
                {formatNumber(CURRENT_PLAN.eventsLimit)} events per month
              </p>
            </div>
            <Badge
              variant="secondary"
              className="text-sm"
            >
              {CURRENT_PLAN.tier}
            </Badge>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#888888]">
                {formatNumber(CURRENT_PLAN.eventsUsed)} of{" "}
                {formatNumber(CURRENT_PLAN.eventsLimit)} events used
              </span>
              <span className="tabular-nums font-medium text-white">
                {usagePercent}%
              </span>
            </div>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className={`h-full rounded-full transition-all duration-700 ${progressColour}`}
                style={{
                  width: `${usagePercent}%`,
                  "--progress-width": `${usagePercent}%`,
                } as React.CSSProperties}
              />
            </div>
            <p className="mt-2 text-xs text-[#555555]">
              {formatNumber(CURRENT_PLAN.eventsLimit - CURRENT_PLAN.eventsUsed)} events remaining this month
            </p>
          </div>
        </div>
      </section>

      {/* Upgrade CTA */}
      <section className="max-w-lg">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-6 ring-1 ring-white/[0.08]">
          {/* Subtle gradient accent */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-500/10 blur-[60px]"
          />

          <div className="relative">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-400" />
              <h3 className="text-lg font-semibold text-white">
                Upgrade to Pro
              </h3>
            </div>
            <p className="mt-2 text-sm text-[#888888]">
              Unlock unlimited events, team collaboration, and advanced insights.
            </p>

            <ul className="mt-5 space-y-2.5">
              {PRO_FEATURES.map((feature) => (
                <li key={feature} className="flex items-center gap-2.5 text-sm text-[#AAAAAA]">
                  <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                  {feature}
                </li>
              ))}
            </ul>

            <div className="mt-6 flex items-center gap-4">
              <Button asChild size="sm" className="bg-emerald-500 text-white hover:bg-emerald-600">
                <Link href="/dashboard/pricing">
                  Upgrade — £29/mo
                </Link>
              </Button>
              <span className="text-xs text-[#555555]">14-day free trial included</span>
            </div>
          </div>
        </div>
      </section>

      <Separator />

      <section>
        <h2 className="text-lg font-semibold text-white">Billing History</h2>
        <p className="mt-1 text-sm text-[#666666]">
          View your past invoices and payment history.
        </p>
        <div className="mt-5 rounded-2xl bg-white/[0.02] px-5 py-8 text-center ring-1 ring-white/[0.06]">
          <p className="text-sm text-[#555555]">
            No billing history yet. Upgrade to a paid plan to start tracking invoices.
          </p>
        </div>
      </section>
    </div>
  );
}
