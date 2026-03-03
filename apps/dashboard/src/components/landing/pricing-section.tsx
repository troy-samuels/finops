"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInView } from "@/hooks/use-in-view";
import { cn } from "@/lib/utils";

const PRICING_TIERS = [
  {
    name: "Free",
    price: "$0",
    features: [
      "10,000 events / month",
      "1 project",
      "Community support",
      "Basic dashboard",
    ],
    cta: "Get started",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$49",
    features: [
      "500,000 events / month",
      "Unlimited projects",
      "Email support",
      "Budget alerts",
      "CSV export",
    ],
    cta: "Start free trial",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "$199",
    features: [
      "Unlimited events",
      "Dedicated support",
      "SSO / SAML",
      "Custom integrations",
      "Audit log",
    ],
    cta: "Contact sales",
    highlighted: false,
  },
] as const;

export function PricingSection() {
  const { ref: headerRef, inView: headerVisible } =
    useInView<HTMLDivElement>();
  const { ref: cardsRef, inView: cardsVisible } = useInView<HTMLDivElement>();

  return (
    <section id="pricing" className="py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6">
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
            Simple, transparent pricing
          </h2>
          <p
            className={cn(
              "mx-auto mt-4 max-w-xl text-center text-base text-[#666666] transition-all duration-700",
              headerVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0",
            )}
            style={{ transitionDelay: "200ms" }}
          >
            Start free. Upgrade when you need more. No credit card required.
          </p>
        </div>

        <div
          ref={cardsRef}
          className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3"
        >
          {PRICING_TIERS.map((tier, i) => (
            <div
              key={tier.name}
              className={cn(
                "relative flex flex-col rounded-xl bg-white/[0.02] p-6 transition-all duration-500",
                tier.highlighted
                  ? "ring-1 ring-white/[0.15] shadow-[0_8px_30px_rgb(0,0,0,0.3)]"
                  : "ring-1 ring-white/[0.05]",
                cardsVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-6 opacity-0",
              )}
              style={{ transitionDelay: `${i * 0.15}s` }}
            >
              {tier.highlighted ? (
                <span
                  className={cn(
                    "absolute -top-3 left-6 rounded-full bg-white px-3 py-0.5 text-xs font-medium text-black transition-all duration-500",
                    cardsVisible
                      ? "translate-y-0 opacity-100"
                      : "-translate-y-2 opacity-0",
                  )}
                  style={{ transitionDelay: "0.3s" }}
                >
                  Most Popular
                </span>
              ) : null}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white">
                  {tier.name}
                </h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-4xl font-semibold tabular-nums tracking-tight text-white">
                    {tier.price}
                  </span>
                  <span className="text-sm text-[#666666]">/ month</span>
                </div>
              </div>
              <ul className="mb-8 flex flex-1 flex-col gap-3">
                {tier.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 text-sm text-[#AAAAAA]"
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#555555]" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                asChild
                variant={tier.highlighted ? "default" : "outline"}
                className="w-full rounded-lg"
              >
                <Link href="/onboarding">{tier.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
