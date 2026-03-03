import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ChevronDown,
  Check,
  Zap,
  CreditCard,
  Server,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "FinOps Tracker — Know Your True AI Costs",
  description:
    "Track per-token API costs, recurring subscriptions, and infrastructure spend across OpenAI, Anthropic, and more. One SDK. One dashboard. Zero guesswork.",
};

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

const PROVIDERS = ["OpenAI", "Anthropic", "Google AI", "Vercel", "AWS"];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* ─── Marketing Nav ─── */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0A0A0A]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="text-sm font-semibold text-white">
            FinOps
          </Link>
          <nav className="hidden items-center gap-8 sm:flex">
            <a
              href="#features"
              className="text-sm text-[#666666] transition-colors hover:text-white"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-sm text-[#666666] transition-colors hover:text-white"
            >
              How It Works
            </a>
            <a
              href="#pricing"
              className="text-sm text-[#666666] transition-colors hover:text-white"
            >
              Pricing
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-[#666666] transition-colors hover:text-white"
            >
              Sign in
            </Link>
            <Button asChild size="sm">
              <Link href="/onboarding">Start free</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden pb-20 pt-24 sm:pb-28 sm:pt-32">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-[-200px] h-[600px] w-[600px] -translate-x-1/2"
        >
          <div className="absolute inset-0 animate-float-orb rounded-full bg-gradient-to-br from-[hsl(217,91%,60%)] via-[hsl(262,83%,58%)] to-[hsl(160,84%,39%)] opacity-[0.07] blur-[100px]" />
        </div>

        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <Badge
            variant="outline"
            className="mb-6 border-white/[0.08] text-[#888888]"
          >
            Now tracking 500+ AI projects
          </Badge>

          <h1 className="text-5xl font-semibold leading-[1.08] tracking-tight text-white sm:text-6xl lg:text-7xl">
            Know your true
            <br className="hidden sm:block" />
            {" AI costs"}
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[#888888] sm:text-lg">
            FinOps combines per-token API metering with subscription
            amortization to show you what AI actually costs. One SDK. One
            dashboard. Zero guesswork.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="h-12 rounded-lg px-8 text-base font-medium">
              <Link href="/onboarding">
                Start tracking free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="lg"
              className="h-12 px-8 text-base text-[#888888]"
            >
              <a href="#demo">
                See how it works
                <ChevronDown className="ml-1 h-4 w-4" />
              </a>
            </Button>
          </div>

          {/* Dashboard preview */}
          <div className="relative mt-20">
            <div
              aria-hidden="true"
              className="absolute -inset-4 rounded-2xl bg-gradient-to-b from-white/[0.03] to-transparent blur-xl"
            />
            <div className="relative rounded-xl bg-white/[0.02] p-6 shadow-[0_20px_60px_rgb(0,0,0,0.5)] ring-1 ring-white/[0.08] sm:p-8">
              <div className="text-left">
                <p className="text-xs font-medium uppercase tracking-wide text-[#555555]">
                  Total Spend this Month
                </p>
                <p className="mt-2 text-5xl font-medium tabular-nums tracking-tighter text-white sm:text-6xl">
                  $2,847.63
                </p>
                <span className="mt-3 inline-flex items-center rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-400">
                  {"\u2193"} 12% from last month
                </span>
              </div>

              <div className="mt-8 h-[120px] sm:h-[180px]">
                <svg
                  viewBox="0 0 600 120"
                  preserveAspectRatio="none"
                  className="h-full w-full"
                >
                  <defs>
                    <linearGradient
                      id="hero-grad"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="hsl(217 91% 60%)"
                        stopOpacity="0.2"
                      />
                      <stop
                        offset="100%"
                        stopColor="hsl(217 91% 60%)"
                        stopOpacity="0"
                      />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0,100 C50,90 100,85 150,70 C200,55 250,60 300,45 C350,30 400,40 450,25 C500,15 550,20 600,10 L600,120 L0,120Z"
                    fill="url(#hero-grad)"
                  />
                  <path
                    d="M0,100 C50,90 100,85 150,70 C200,55 250,60 300,45 C350,30 400,40 450,25 C500,15 550,20 600,10"
                    fill="none"
                    stroke="hsl(217 91% 60%)"
                    strokeWidth="2"
                  />
                </svg>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-4">
                {[
                  { rank: "1", name: "OpenAI", cost: "$200.00" },
                  { rank: "2", name: "GPT-4o", cost: "$142.37" },
                  { rank: "3", name: "Vercel", cost: "$20.00" },
                ].map((d) => (
                  <div
                    key={d.rank}
                    className="rounded-lg bg-white/[0.02] px-4 py-3 ring-1 ring-white/[0.04]"
                  >
                    <p className="text-xs text-[#555555]">
                      {d.rank}. {d.name}
                    </p>
                    <p className="mt-1 text-sm font-medium tabular-nums text-white">
                      {d.cost}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Trust Bar ─── */}
      <section className="border-y border-white/[0.04] py-12">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-center text-sm text-[#555555]">
            Trusted by 500+ developers tracking AI costs
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
            {PROVIDERS.map((name) => (
              <span
                key={name}
                className="text-lg font-semibold tracking-tight text-white/[0.15] transition-colors hover:text-white/[0.3]"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Problem Statement ─── */}
      <section id="features" className="py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-center text-sm font-medium uppercase tracking-widest text-[#555555]">
            The Problem
          </p>
          <h2 className="mt-4 text-center text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            You&apos;re spending more
            <br className="hidden sm:block" />
            {" than you think"}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-base text-[#666666]">
            AI costs are fragmented across tokens, subscriptions, and
            infrastructure. Most teams have no idea what they&apos;re actually
            paying.
          </p>

          <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {PROBLEM_CARDS.map((card) => (
              <div
                key={card.title}
                className="rounded-xl bg-white/[0.02] p-6 ring-1 ring-white/[0.05] transition-colors hover:ring-white/[0.1]"
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${card.color} / 0.1` }}
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

      {/* ─── Product Demo ─── */}
      <section id="demo" className="relative overflow-hidden py-24 sm:py-32">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-[-200px] top-1/2 h-[400px] w-[400px] -translate-y-1/2 rounded-full bg-[hsl(262,83%,58%)] opacity-[0.04] blur-[120px]"
        />
        <div className="relative mx-auto max-w-6xl px-6">
          <p className="text-center text-sm font-medium uppercase tracking-widest text-[#555555]">
            Product
          </p>
          <h2 className="mt-4 text-center text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Your AI costs, unified
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-base text-[#666666]">
            See metered usage, subscriptions, and infrastructure in one view.
            FinOps amortizes everything automatically.
          </p>

          <div className="relative mt-16">
            <div className="rounded-xl bg-white/[0.02] p-8 shadow-[0_20px_60px_rgb(0,0,0,0.4)] ring-1 ring-white/[0.06]">
              {/* Discovery banner */}
              <div className="mb-8 flex items-start gap-3 rounded-xl bg-white/[0.03] px-5 py-4 ring-1 ring-white/[0.06]">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#888888]" />
                <div>
                  <p className="text-sm text-[#AAAAAA]">
                    We noticed you started using Pinecone.
                  </p>
                  <div className="mt-2 flex gap-2">
                    <span className="inline-flex items-center rounded-md bg-transparent px-3 py-1.5 text-xs font-medium text-white ring-1 ring-white/[0.1]">
                      Track its cost
                    </span>
                    <span className="inline-flex items-center px-3 py-1.5 text-xs text-[#888888]">
                      Ignore
                    </span>
                  </div>
                </div>
              </div>

              {/* Hero metric */}
              <p className="text-xs font-medium uppercase tracking-wide text-[#555555]">
                Total Spend this Month
              </p>
              <p className="mt-2 text-4xl font-medium tabular-nums tracking-tighter text-white sm:text-5xl">
                $2,847.63
              </p>
              <span className="mt-3 inline-flex items-center rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-400">
                {"\u2193"} 12% from last month
              </span>

              {/* Stacked area chart */}
              <div className="mt-8 h-[160px] sm:h-[200px]">
                <svg
                  viewBox="0 0 800 200"
                  preserveAspectRatio="none"
                  className="h-full w-full"
                >
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(160 84% 39%)" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="hsl(160 84% 39%)" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(262 83% 58%)" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="hsl(262 83% 58%)" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="g3" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(217 91% 60%)" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="hsl(217 91% 60%)" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M0,170 C100,165 200,168 300,160 C400,152 500,155 600,150 C700,145 750,148 800,145 L800,200 L0,200Z" fill="url(#g1)" />
                  <path d="M0,170 C100,165 200,168 300,160 C400,152 500,155 600,150 C700,145 750,148 800,145" fill="none" stroke="hsl(160 84% 39%)" strokeWidth="1.5" />
                  <path d="M0,140 C100,130 200,125 300,110 C400,95 500,100 600,85 C700,75 750,80 800,70 L800,200 L0,200Z" fill="url(#g2)" />
                  <path d="M0,140 C100,130 200,125 300,110 C400,95 500,100 600,85 C700,75 750,80 800,70" fill="none" stroke="hsl(262 83% 58%)" strokeWidth="1.5" />
                  <path d="M0,120 C100,105 200,95 300,80 C400,60 500,65 600,45 C700,30 750,35 800,20 L800,200 L0,200Z" fill="url(#g3)" />
                  <path d="M0,120 C100,105 200,95 300,80 C400,60 500,65 600,45 C700,30 750,35 800,20" fill="none" stroke="hsl(217 91% 60%)" strokeWidth="1.5" />
                </svg>
              </div>

              {/* Top drivers */}
              <div className="mt-6 space-y-3">
                {[
                  { rank: 1, name: "OpenAI", cost: "$200.00" },
                  { rank: 2, name: "GPT-4o", cost: "$142.37" },
                  { rank: 3, name: "Vercel", cost: "$20.00" },
                ].map((d) => (
                  <div
                    key={d.rank}
                    className="flex items-center justify-between border-b border-white/[0.04] pb-3 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-5 text-sm tabular-nums text-[#555555]">
                        {d.rank}.
                      </span>
                      <span className="text-sm text-white">{d.name}</span>
                    </div>
                    <span className="text-sm font-medium tabular-nums text-white">
                      {d.cost}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Floating annotations */}
            <div className="absolute -right-2 top-8 hidden max-w-[200px] rounded-lg bg-[#1A1A1A] p-3 shadow-2xl ring-1 ring-white/[0.1] lg:-right-8 lg:top-12 lg:block">
              <p className="text-xs font-medium text-white">Auto-discovery</p>
              <p className="mt-1 text-xs text-[#666666]">
                SDK detects new providers automatically from your env vars
              </p>
            </div>
            <div className="absolute -left-2 bottom-16 hidden max-w-[200px] rounded-lg bg-[#1A1A1A] p-3 shadow-2xl ring-1 ring-white/[0.1] lg:-left-8 lg:bottom-24 lg:block">
              <p className="text-xs font-medium text-white">
                True cost = tokens + subs
              </p>
              <p className="mt-1 text-xs text-[#666666]">
                Amortized subscription costs distributed across daily spend
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section id="how-it-works" className="py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-center text-sm font-medium uppercase tracking-widest text-[#555555]">
            How It Works
          </p>
          <h2 className="mt-4 text-center text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Three lines of code.
            <br className="hidden sm:block" />
            {" Complete visibility."}
          </h2>

          <div className="mt-16 space-y-24">
            {/* Step 1 */}
            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
              <div>
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-sm font-medium text-[#888888]">
                    1
                  </span>
                  <h3 className="text-xl font-semibold text-white">
                    Drop in our SDK
                  </h3>
                </div>
                <p className="mt-4 max-w-md text-sm leading-relaxed text-[#888888]">
                  Install the package, initialize with your API key, and wrap
                  your OpenAI client. Three lines — that&apos;s it. The SDK is
                  fire-and-forget and will never crash your app.
                </p>
              </div>
              <div className="rounded-xl bg-[#111111] p-6 ring-1 ring-white/[0.06]">
                <div className="mb-4 flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-white/[0.06]" />
                  <div className="h-3 w-3 rounded-full bg-white/[0.06]" />
                  <div className="h-3 w-3 rounded-full bg-white/[0.06]" />
                  <span className="ml-3 text-xs text-[#555555]">app.ts</span>
                </div>
                <pre className="overflow-x-auto text-[13px] leading-6">
                  <code>
                    <span className="text-[#888888]">import</span>{" "}
                    <span className="text-white">
                      {"{ ProjectTracker }"}
                    </span>{" "}
                    <span className="text-[#888888]">from</span>{" "}
                    <span className="text-emerald-400">
                      {'"@finops/sdk"'}
                    </span>
                    {"\n\n"}
                    <span className="text-[#888888]">const</span>{" "}
                    <span className="text-white">tracker</span>{" "}
                    <span className="text-[#888888]">=</span>{" "}
                    <span className="text-[#888888]">new</span>{" "}
                    <span className="text-[hsl(217,91%,60%)]">
                      ProjectTracker
                    </span>
                    <span className="text-white">{"({"}</span>
                    {"\n  "}
                    <span className="text-white">apiKey</span>
                    <span className="text-[#888888]">:</span>{" "}
                    <span className="text-emerald-400">
                      process.env.FINOPS_API_KEY
                    </span>
                    {"\n"}
                    <span className="text-white">{"})"};</span>
                    {"\n\n"}
                    <span className="text-[#555555]">
                      {"// Auto-tracks every OpenAI call"}
                    </span>
                    {"\n"}
                    <span className="text-[#888888]">const</span>{" "}
                    <span className="text-white">openai</span>{" "}
                    <span className="text-[#888888]">=</span>{" "}
                    <span className="text-white">tracker.</span>
                    <span className="text-[hsl(262,83%,58%)]">wrapOpenAI</span>
                    <span className="text-white">(</span>
                    <span className="text-[#888888]">new</span>{" "}
                    <span className="text-[hsl(217,91%,60%)]">OpenAI</span>
                    <span className="text-white">{"())"}</span>
                  </code>
                </pre>
              </div>
            </div>

            {/* Step 2 */}
            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
              <div className="lg:order-2">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-sm font-medium text-[#888888]">
                    2
                  </span>
                  <h3 className="text-xl font-semibold text-white">
                    We track every dollar
                  </h3>
                </div>
                <p className="mt-4 max-w-md text-sm leading-relaxed text-[#888888]">
                  Every API call, every token, every subscription. The SDK
                  auto-discovers providers from your environment and reports
                  usage in real time.
                </p>
              </div>
              <div className="rounded-xl bg-white/[0.02] p-6 ring-1 ring-white/[0.05] lg:order-1">
                <div className="space-y-3">
                  {[
                    {
                      provider: "OpenAI",
                      status: "active",
                      detail: "1,247 events",
                    },
                    {
                      provider: "Anthropic",
                      status: "active",
                      detail: "832 events",
                    },
                    {
                      provider: "AWS Lambda",
                      status: "pending",
                      detail: "Discovered",
                    },
                  ].map((item) => (
                    <div
                      key={item.provider}
                      className="flex items-center justify-between rounded-lg bg-white/[0.02] px-4 py-3 ring-1 ring-white/[0.04]"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{
                            backgroundColor:
                              item.status === "active"
                                ? "hsl(160 84% 39%)"
                                : "hsl(0 0% 33%)",
                          }}
                        />
                        <span className="text-sm text-white">
                          {item.provider}
                        </span>
                      </div>
                      <span className="text-xs text-[#555555]">
                        {item.detail}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
              <div>
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-sm font-medium text-[#888888]">
                    3
                  </span>
                  <h3 className="text-xl font-semibold text-white">
                    See your true costs
                  </h3>
                </div>
                <p className="mt-4 max-w-md text-sm leading-relaxed text-[#888888]">
                  Your dashboard shows the full picture: per-token metered costs
                  plus amortized subscription fees. Set budgets, get alerts, and
                  catch anomalies before they become problems.
                </p>
              </div>
              <div className="rounded-xl bg-white/[0.02] p-6 ring-1 ring-white/[0.05]">
                <p className="text-xs font-medium uppercase tracking-wide text-[#555555]">
                  Monthly TCO
                </p>
                <p className="mt-1 text-3xl font-medium tabular-nums tracking-tighter text-white">
                  $2,847.63
                </p>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {[
                    { label: "AI Requests", value: "$2,547" },
                    { label: "Subscriptions", value: "$220" },
                    { label: "Infrastructure", value: "$80" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-lg bg-white/[0.02] p-3 ring-1 ring-white/[0.04]"
                    >
                      <p className="text-xs text-[#555555]">{item.label}</p>
                      <p className="mt-0.5 text-sm font-medium tabular-nums text-white">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section id="pricing" className="py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-center text-sm font-medium uppercase tracking-widest text-[#555555]">
            Pricing
          </p>
          <h2 className="mt-4 text-center text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-base text-[#666666]">
            Start free. Upgrade when you need more. No credit card required.
          </p>

          <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
            {PRICING_TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`relative flex flex-col rounded-xl bg-white/[0.02] p-6 ${
                  tier.highlighted
                    ? "ring-1 ring-white/[0.15] shadow-[0_8px_30px_rgb(0,0,0,0.3)]"
                    : "ring-1 ring-white/[0.05]"
                }`}
              >
                {tier.highlighted ? (
                  <span className="absolute -top-3 left-6 rounded-full bg-white px-3 py-0.5 text-xs font-medium text-black">
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

      {/* ─── Final CTA ─── */}
      <section className="relative overflow-hidden py-24 sm:py-32">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-[-100px] left-1/2 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-gradient-to-t from-[hsl(217,91%,60%)] to-[hsl(262,83%,58%)] opacity-[0.05] blur-[120px]"
        />
        <div className="relative mx-auto max-w-2xl px-6 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Stop guessing.
            <br />
            Start tracking.
          </h2>
          <p className="mt-4 text-base text-[#888888]">
            Join 500+ developers who know exactly what their AI costs.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="h-12 rounded-lg px-8 text-base font-medium">
              <Link href="/onboarding">
                Start tracking free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <p className="mt-6 text-xs text-[#555555]">
            Free forever for small projects. No credit card required.
          </p>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-white/[0.04] py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">FinOps</span>
              <span className="text-xs text-[#555555]">
                Track your AI costs
              </span>
            </div>
            <nav className="flex items-center gap-6">
              <a
                href="#features"
                className="text-sm text-[#666666] transition-colors hover:text-white"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="text-sm text-[#666666] transition-colors hover:text-white"
              >
                How It Works
              </a>
              <a
                href="#pricing"
                className="text-sm text-[#666666] transition-colors hover:text-white"
              >
                Pricing
              </a>
              <Link
                href="/dashboard"
                className="text-sm text-[#666666] transition-colors hover:text-white"
              >
                Dashboard
              </Link>
            </nav>
          </div>
          <div className="mt-8 border-t border-white/[0.04] pt-8 text-center">
            <p className="text-xs text-[#555555]">
              &copy; 2026 FinOps Tracker. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
