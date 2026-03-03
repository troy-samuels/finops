"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useInView } from "@/hooks/use-in-view";
import { useCountUp } from "@/hooks/use-count-up";
import { cn } from "@/lib/utils";

function formatAnimatedCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function HeroSection() {
  const { ref, inView } = useInView<HTMLElement>({ threshold: 0.1 });
  const animatedTotal = useCountUp(2847.63, 1500, inView);

  const strokeRef = useRef<SVGPathElement>(null);
  const [pathLength, setPathLength] = useState(800);

  useEffect(() => {
    if (strokeRef.current) {
      setPathLength(strokeRef.current.getTotalLength());
    }
  }, []);

  return (
    <section ref={ref} className="relative overflow-hidden pb-20 pt-24 sm:pb-28 sm:pt-32">
      <div className="relative mx-auto max-w-4xl px-6 text-center">
        <Badge
          variant="outline"
          className={cn(
            "mb-6 border-white/[0.08] text-[#888888] transition-all duration-700",
            inView ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
          )}
        >
          Now tracking 500+ AI projects
        </Badge>

        <h1
          className={cn(
            "text-5xl font-semibold leading-[1.08] tracking-tight text-white transition-all duration-700 sm:text-6xl lg:text-7xl",
            inView ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
          )}
          style={{ transitionDelay: "100ms" }}
        >
          Know your true
          <br className="hidden sm:block" />
          {" AI costs"}
        </h1>

        <p
          className={cn(
            "mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[#888888] transition-all duration-700 sm:text-lg",
            inView ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
          )}
          style={{ transitionDelay: "200ms" }}
        >
          FinOps combines per-token API metering with subscription amortization
          to show you what AI actually costs. One SDK. One dashboard. Zero
          guesswork.
        </p>

        <div
          className={cn(
            "mt-10 flex flex-col items-center justify-center gap-4 transition-all duration-700 sm:flex-row",
            inView ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
          )}
          style={{ transitionDelay: "300ms" }}
        >
          <Button
            asChild
            size="lg"
            className="h-12 rounded-lg px-8 text-base font-medium"
          >
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
        <div
          className={cn(
            "relative mt-20 transition-all duration-1000",
            inView ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0",
          )}
          style={{ transitionDelay: "500ms" }}
        >
          <div className="relative rounded-xl bg-white/[0.02] p-6 shadow-[0_20px_60px_rgb(0,0,0,0.5)] ring-1 ring-white/[0.08] sm:p-8">
            <div className="text-left">
              <p className="text-xs font-medium uppercase tracking-wide text-[#555555]">
                Total Spend this Month
              </p>
              <p className="mt-2 text-5xl font-medium tabular-nums tracking-tighter text-white sm:text-6xl">
                {formatAnimatedCurrency(animatedTotal)}
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
                  className={cn(
                    "transition-opacity duration-700",
                    inView ? "opacity-100" : "opacity-0",
                  )}
                  style={{ transitionDelay: "1.8s" }}
                />
                <path
                  ref={strokeRef}
                  d="M0,100 C50,90 100,85 150,70 C200,55 250,60 300,45 C350,30 400,40 450,25 C500,15 550,20 600,10"
                  fill="none"
                  stroke="hsl(217 91% 60%)"
                  strokeWidth="2"
                  style={{
                    strokeDasharray: pathLength,
                    strokeDashoffset: inView ? 0 : pathLength,
                    transition: "stroke-dashoffset 1.5s ease-out 1s",
                  }}
                />
              </svg>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-4">
              {[
                { rank: "1", name: "OpenAI", cost: "$200.00" },
                { rank: "2", name: "GPT-4o", cost: "$142.37" },
                { rank: "3", name: "Vercel", cost: "$20.00" },
              ].map((d, i) => (
                <div
                  key={d.rank}
                  className={cn(
                    "rounded-lg bg-white/[0.02] px-4 py-3 ring-1 ring-white/[0.04] transition-all duration-500",
                    inView
                      ? "translate-y-0 opacity-100"
                      : "translate-y-4 opacity-0",
                  )}
                  style={{ transitionDelay: `${2.2 + i * 0.15}s` }}
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
  );
}
