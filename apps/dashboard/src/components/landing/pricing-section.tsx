"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useInView } from "@/hooks/use-in-view";
import { cn } from "@/lib/utils";
import { PricingFAQ } from "./pricing-faq";

interface PricingTier {
  name: string;
  tagline: string;
  monthlyPrice: number | null; // null for Custom
  annualPrice: number | null; // null for Custom or Free
  usdMonthly: number | null;
  usdAnnual: number | null;
  features: string[];
  cta: string;
  highlighted: boolean;
  badge?: string;
}

const PRICING_TIERS: PricingTier[] = [
  {
    name: "Free",
    tagline: "See Your Costs",
    monthlyPrice: 0,
    annualPrice: 0,
    usdMonthly: 0,
    usdAnnual: 0,
    features: [
      "25,000 API calls tracked/month",
      "1 project",
      "7-day data retention",
      "Basic cost dashboard",
      "Cost breakdown by model",
      "Single user",
    ],
    cta: "Start tracking free",
    highlighted: false,
  },
  {
    name: "Team",
    tagline: "Control Your Costs",
    monthlyPrice: 99,
    annualPrice: 79,
    usdMonthly: 125,
    usdAnnual: 99,
    features: [
      "500,000 API calls tracked/month",
      "10 projects",
      "90-day data retention",
      "Up to 10 team members",
      "Budget alerts & anomaly detection",
      "Cost allocation by feature/team",
      "Weekly cost digest emails",
      "Slack & email notifications",
      "CSV & API export",
    ],
    cta: "Start 14-day free trial",
    highlighted: true,
    badge: "Most Popular",
  },
  {
    name: "Business",
    tagline: "Govern Your Costs",
    monthlyPrice: 299,
    annualPrice: 239,
    usdMonthly: 375,
    usdAnnual: 299,
    features: [
      "Everything in Team, plus:",
      "Unlimited API calls",
      "Unlimited projects",
      "12-month data retention",
      "Up to 50 team members",
      "Chargeback reports (allocate costs to departments)",
      "Spend forecasting (30/60/90 day projections)",
      "Budget governance (approval workflows)",
      "Jira integration",
      "Custom dashboards",
      "Priority support (email, 24h SLA)",
    ],
    cta: "Start 14-day free trial",
    highlighted: false,
  },
  {
    name: "Enterprise",
    tagline: "Total Financial Control",
    monthlyPrice: null,
    annualPrice: null,
    usdMonthly: null,
    usdAnnual: null,
    features: [
      "Everything in Business, plus:",
      "Unlimited team members",
      "SSO / SAML",
      "SOC 2 Type II report",
      "Data warehouse export (Snowflake, BigQuery)",
      "Dedicated account manager",
      "Custom SLA & contracts",
      "On-premises / private cloud option",
      "Quarterly strategy reviews",
    ],
    cta: "Contact sales",
    highlighted: false,
  },
];

export function PricingSection() {
  const [billingCycle, setBillingCycle] = useState<"annual" | "monthly">("annual");
  const { ref: headerRef, inView: headerVisible } = useInView<HTMLDivElement>();
  const { ref: toggleRef, inView: toggleVisible } = useInView<HTMLDivElement>();
  const { ref: cardsRef, inView: cardsVisible } = useInView<HTMLDivElement>();

  return (
    <section id="pricing" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <div ref={headerRef}>
          <p
            className={cn(
              "text-center text-sm font-medium uppercase tracking-widest text-[#555555] transition-all duration-700",
              headerVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0",
            )}
          >
            Pricing
          </p>
          <h2
            className={cn(
              "mt-4 text-center text-3xl font-semibold tracking-tight text-white transition-all duration-700 sm:text-4xl",
              headerVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0",
            )}
            style={{ transitionDelay: "100ms" }}
          >
            Purpose-built for AI cost management
          </h2>
          <p
            className={cn(
              "mx-auto mt-4 max-w-2xl text-center text-base text-[#666666] transition-all duration-700",
              headerVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0",
            )}
            style={{ transitionDelay: "200ms" }}
          >
            Track, allocate, and govern your AI spending with finance-grade precision. Start free, scale as you grow.
          </p>
        </div>

        {/* Annual/Monthly Toggle */}
        <div
          ref={toggleRef}
          className={cn(
            "mt-12 flex items-center justify-center gap-4 transition-all duration-700",
            toggleVisible
              ? "translate-y-0 opacity-100"
              : "translate-y-4 opacity-0",
          )}
          style={{ transitionDelay: "300ms" }}
        >
          <span
            className={cn(
              "text-sm font-medium transition-colors",
              billingCycle === "monthly" ? "text-white" : "text-[#666666]",
            )}
          >
            Monthly
          </span>
          <button
            onClick={() =>
              setBillingCycle(billingCycle === "annual" ? "monthly" : "annual")
            }
            className={cn(
              "relative inline-flex h-7 w-14 items-center rounded-full transition-colors",
              billingCycle === "annual"
                ? "bg-gradient-to-r from-amber-500/20 to-yellow-500/20"
                : "bg-white/[0.05]",
            )}
            role="switch"
            aria-checked={billingCycle === "annual"}
          >
            <span
              className={cn(
                "inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform",
                billingCycle === "annual" ? "translate-x-8" : "translate-x-1",
              )}
            />
          </button>
          <span
            className={cn(
              "text-sm font-medium transition-colors",
              billingCycle === "annual" ? "text-white" : "text-[#666666]",
            )}
          >
            Annual
          </span>
          {billingCycle === "annual" && (
            <Badge className="ml-2 border-amber-500/30 bg-amber-500/10 text-amber-400">
              Save 20%
            </Badge>
          )}
        </div>

        {/* Pricing Cards */}
        <div
          ref={cardsRef}
          className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {PRICING_TIERS.map((tier, i) => {
            const price =
              billingCycle === "annual" ? tier.annualPrice : tier.monthlyPrice;
            const usdPrice =
              billingCycle === "annual" ? tier.usdAnnual : tier.usdMonthly;
            const isTeamTier = tier.name === "Team";
            const monthlySavings = isTeamTier && billingCycle === "annual" ? 240 : 0;

            return (
              <div
                key={tier.name}
                className={cn(
                  "relative flex flex-col rounded-xl bg-white/[0.02] p-6 transition-all duration-500",
                  tier.highlighted
                    ? "ring-2 ring-amber-500/30 shadow-[0_0_40px_rgba(251,191,36,0.15)]"
                    : "ring-1 ring-white/[0.05]",
                  cardsVisible
                    ? "translate-y-0 opacity-100"
                    : "translate-y-6 opacity-0",
                )}
                style={{ transitionDelay: `${i * 0.1}s` }}
              >
                {/* Badge */}
                {tier.badge && (
                  <Badge
                    className={cn(
                      "absolute -top-3 left-6 border-amber-500/30 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 transition-all duration-500",
                      cardsVisible
                        ? "translate-y-0 opacity-100"
                        : "-translate-y-2 opacity-0",
                    )}
                    style={{ transitionDelay: "0.4s" }}
                  >
                    {tier.badge}
                  </Badge>
                )}

                {/* Header */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white">
                    {tier.name}
                  </h3>
                  <p className="mt-1 text-sm text-[#888888]">{tier.tagline}</p>
                  <div className="mt-4 flex items-baseline gap-1">
                    {price === null ? (
                      <span className="text-4xl font-semibold tracking-tight text-white">
                        Custom
                      </span>
                    ) : (
                      <>
                        <span className="text-4xl font-semibold tabular-nums tracking-tight text-white">
                          £{price}
                        </span>
                        <span className="text-sm text-[#666666]">
                          {usdPrice !== null && ` (~$${usdPrice})`}
                          {price > 0 && " / month"}
                        </span>
                      </>
                    )}
                  </div>
                  {billingCycle === "annual" && price !== null && price > 0 && (
                    <p className="mt-1 text-xs text-[#666666]">
                      Billed annually
                    </p>
                  )}
                  {monthlySavings > 0 && (
                    <p className="mt-2 text-sm font-medium text-amber-400">
                      Save £{monthlySavings}/year
                    </p>
                  )}
                </div>

                {/* Features */}
                <ul className="mb-8 flex flex-1 flex-col gap-3">
                  {tier.features.map((feature, idx) => {
                    const isHeading = feature.includes("Everything in");
                    return (
                      <li
                        key={idx}
                        className={cn(
                          "flex items-start gap-2 text-sm",
                          isHeading
                            ? "font-medium text-white"
                            : "text-[#AAAAAA]",
                        )}
                      >
                        {!isHeading && (
                          <Check
                            className={cn(
                              "mt-0.5 h-4 w-4 shrink-0",
                              tier.highlighted
                                ? "text-amber-500/60"
                                : "text-[#555555]",
                            )}
                          />
                        )}
                        <span className={isHeading ? "" : ""}>{feature}</span>
                      </li>
                    );
                  })}
                </ul>

                {/* CTA */}
                <Button
                  asChild
                  variant={tier.highlighted ? "default" : "outline"}
                  className={cn(
                    "w-full rounded-lg",
                    tier.highlighted &&
                      "bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-semibold hover:from-amber-600 hover:to-yellow-600",
                  )}
                >
                  <Link href="/onboarding">{tier.cta}</Link>
                </Button>
              </div>
            );
          })}
        </div>

        {/* Comparison Anchor */}
        <div
          className={cn(
            "mx-auto mt-12 max-w-3xl text-center text-sm text-[#666666] transition-all duration-700",
            cardsVisible
              ? "translate-y-0 opacity-100"
              : "translate-y-4 opacity-0",
          )}
          style={{ transitionDelay: "0.5s" }}
        >
          <p>
            For context: Datadog charges ~£200/mo just for AI observability as an add-on. Helicone Team is £640/mo ($799). 
            We&apos;re purpose-built for AI cost management at a fraction of the price.
          </p>
        </div>

        {/* FAQ Section */}
        <PricingFAQ />
      </div>
    </section>
  );
}
