"use client";

import { Zap, CreditCard, Server } from "lucide-react";
import { useInView } from "@/hooks/use-in-view";
import { cn } from "@/lib/utils";

const PROBLEM_CARDS = [
  {
    icon: Zap,
    color: "hsl(217 91% 60%)",
    title: "Per-token API costs",
    description:
      "GPT-4o costs 10x more than GPT-4o-mini. Anthropic pricing differs by model family. Costs vary per call and add up fast.",
    example: { label: "Example: 1M tokens on GPT-4o", value: "$12.50" },
  },
  {
    icon: CreditCard,
    color: "hsl(262 83% 58%)",
    title: "Recurring subscriptions",
    description:
      "ChatGPT Plus, Anthropic API plans, Vercel Pro — you're paying monthly fees you've forgotten about.",
    example: { label: "OpenAI Platform", value: "$200/mo" },
  },
  {
    icon: Server,
    color: "hsl(160 84% 39%)",
    title: "Infrastructure overhead",
    description:
      "Vector databases, serverless functions, hosting — the costs that pile up silently behind your AI stack.",
    example: { label: "Pinecone + Vercel", value: "$45/mo" },
  },
] as const;

export function ProblemCards() {
  const { ref, inView } = useInView<HTMLElement>();

  return (
    <section ref={ref} id="features" className="py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <p
          className={cn(
            "text-center text-sm font-medium uppercase tracking-widest text-[#555555] transition-all duration-700",
            inView ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
          )}
        >
          The Problem
        </p>
        <h2
          className={cn(
            "mt-4 text-center text-3xl font-semibold tracking-tight text-white transition-all duration-700 sm:text-4xl",
            inView ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
          )}
          style={{ transitionDelay: "100ms" }}
        >
          You&apos;re spending more
          <br className="hidden sm:block" />
          {" than you think"}
        </h2>
        <p
          className={cn(
            "mx-auto mt-4 max-w-2xl text-center text-base text-[#666666] transition-all duration-700",
            inView ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
          )}
          style={{ transitionDelay: "200ms" }}
        >
          AI costs are fragmented across tokens, subscriptions, and
          infrastructure. Most teams have no idea what they&apos;re actually
          paying.
        </p>

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {PROBLEM_CARDS.map((card, i) => (
            <div
              key={card.title}
              className={cn(
                "rounded-xl bg-white/[0.02] p-6 ring-1 ring-white/[0.05] transition-all duration-500 hover:ring-white/[0.1]",
                inView
                  ? "translate-y-0 opacity-100"
                  : "translate-y-6 opacity-0",
              )}
              style={{ transitionDelay: `${0.3 + i * 0.15}s` }}
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{
                  backgroundColor: card.color.replace(")", " / 0.1)"),
                }}
              >
                <card.icon
                  className="h-5 w-5"
                  style={{ color: card.color }}
                />
              </div>
              <h3 className="mt-4 text-base font-semibold text-white">
                {card.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#888888]">
                {card.description}
              </p>
              <div className="mt-4 rounded-lg bg-white/[0.02] px-3 py-2 ring-1 ring-white/[0.04]">
                <p className="text-xs text-[#555555]">
                  {card.example.label}
                </p>
                <p className="mt-0.5 text-sm font-medium tabular-nums text-white">
                  {card.example.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
