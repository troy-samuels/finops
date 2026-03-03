import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const CURRENT_PLAN = {
  tier: "Free" as const,
  eventsUsed: 1247,
  eventsLimit: 10000,
};

export default function BillingSettingsPage() {
  const usagePercent = Math.round(
    (CURRENT_PLAN.eventsUsed / CURRENT_PLAN.eventsLimit) * 100,
  );

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-semibold text-white">Current Plan</h2>
        <p className="mt-1 text-sm text-[#666666]">
          Your current subscription and usage.
        </p>

        <div className="mt-4 max-w-md rounded-xl bg-white/[0.02] p-6 ring-1 ring-white/[0.05]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">
                {CURRENT_PLAN.tier} Plan
              </p>
              <p className="mt-0.5 text-xs text-[#666666]">
                {CURRENT_PLAN.eventsLimit.toLocaleString()} events per month
              </p>
            </div>
            <Badge variant="secondary">{CURRENT_PLAN.tier}</Badge>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#888888]">
                {CURRENT_PLAN.eventsUsed.toLocaleString()} /{" "}
                {CURRENT_PLAN.eventsLimit.toLocaleString()} events
              </span>
              <span className="tabular-nums text-[#666666]">
                {usagePercent}%
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-white transition-all"
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          </div>

          <div className="mt-6">
            <Button asChild size="sm">
              <Link href="/dashboard/pricing">Upgrade plan</Link>
            </Button>
          </div>
        </div>
      </section>

      <Separator />

      <section>
        <h2 className="text-lg font-semibold text-white">Billing History</h2>
        <p className="mt-1 text-sm text-[#666666]">
          View your past invoices and payment history.
        </p>
        <p className="mt-4 text-sm text-[#555555]">
          No billing history yet. Upgrade to a paid plan to start tracking
          invoices.
        </p>
      </section>
    </div>
  );
}
