"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { useInView } from "@/hooks/use-in-view";
import { cn } from "@/lib/utils";

export function ProductDemo() {
  const { ref, inView } = useInView<HTMLElement>();

  const path1Ref = useRef<SVGPathElement>(null);
  const path2Ref = useRef<SVGPathElement>(null);
  const path3Ref = useRef<SVGPathElement>(null);
  const [lengths, setLengths] = useState([1200, 1200, 1200]);

  useEffect(() => {
    const l1 = path1Ref.current?.getTotalLength() ?? 1200;
    const l2 = path2Ref.current?.getTotalLength() ?? 1200;
    const l3 = path3Ref.current?.getTotalLength() ?? 1200;
    setLengths([l1, l2, l3]);
  }, []);

  const paths = [
    {
      ref: path1Ref,
      d: "M0,170 C100,165 200,168 300,160 C400,152 500,155 600,150 C700,145 750,148 800,145",
      fill: "M0,170 C100,165 200,168 300,160 C400,152 500,155 600,150 C700,145 750,148 800,145 L800,200 L0,200Z",
      gradId: "g1",
      color: "hsl(160 84% 39%)",
      delay: 0,
    },
    {
      ref: path2Ref,
      d: "M0,140 C100,130 200,125 300,110 C400,95 500,100 600,85 C700,75 750,80 800,70",
      fill: "M0,140 C100,130 200,125 300,110 C400,95 500,100 600,85 C700,75 750,80 800,70 L800,200 L0,200Z",
      gradId: "g2",
      color: "hsl(262 83% 58%)",
      delay: 0.3,
    },
    {
      ref: path3Ref,
      d: "M0,120 C100,105 200,95 300,80 C400,60 500,65 600,45 C700,30 750,35 800,20",
      fill: "M0,120 C100,105 200,95 300,80 C400,60 500,65 600,45 C700,30 750,35 800,20 L800,200 L0,200Z",
      gradId: "g3",
      color: "hsl(217 91% 60%)",
      delay: 0.6,
    },
  ];

  return (
    <section ref={ref} id="demo" className="relative overflow-hidden py-24 sm:py-32">
      <div className="relative mx-auto max-w-6xl px-6">
        <p
          className={cn(
            "text-center text-sm font-medium uppercase tracking-widest text-[#555555] transition-all duration-700",
            inView ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
          )}
        >
          Product
        </p>
        <h2
          className={cn(
            "mt-4 text-center text-3xl font-semibold tracking-tight text-white transition-all duration-700 sm:text-4xl",
            inView ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
          )}
          style={{ transitionDelay: "100ms" }}
        >
          Your AI costs, unified
        </h2>
        <p
          className={cn(
            "mx-auto mt-4 max-w-2xl text-center text-base text-[#666666] transition-all duration-700",
            inView ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
          )}
          style={{ transitionDelay: "200ms" }}
        >
          See metered usage, subscriptions, and infrastructure in one view.
          FinOps amortizes everything automatically.
        </p>

        <div className="relative mt-16">
          <div
            className={cn(
              "rounded-xl bg-white/[0.02] p-8 shadow-[0_20px_60px_rgb(0,0,0,0.4)] ring-1 ring-white/[0.06] transition-all duration-1000",
              inView ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0",
            )}
            style={{ transitionDelay: "300ms" }}
          >
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

            {/* Stacked area chart with draw animation */}
            <div className="mt-8 h-[160px] sm:h-[200px]">
              <svg
                viewBox="0 0 800 200"
                preserveAspectRatio="none"
                className="h-full w-full"
              >
                <defs>
                  {paths.map((p) => (
                    <linearGradient
                      key={p.gradId}
                      id={p.gradId}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor={p.color}
                        stopOpacity="0.2"
                      />
                      <stop
                        offset="100%"
                        stopColor={p.color}
                        stopOpacity="0"
                      />
                    </linearGradient>
                  ))}
                </defs>
                {paths.map((p, i) => (
                  <g key={p.gradId}>
                    <path
                      d={p.fill}
                      fill={`url(#${p.gradId})`}
                      className={cn(
                        "transition-opacity duration-700",
                        inView ? "opacity-100" : "opacity-0",
                      )}
                      style={{ transitionDelay: `${1.5 + p.delay}s` }}
                    />
                    <path
                      ref={p.ref}
                      d={p.d}
                      fill="none"
                      stroke={p.color}
                      strokeWidth="1.5"
                      style={{
                        strokeDasharray: lengths[i],
                        strokeDashoffset: inView ? 0 : lengths[i],
                        transition: `stroke-dashoffset 1.5s ease-out ${0.8 + p.delay}s`,
                      }}
                    />
                  </g>
                ))}
              </svg>
            </div>

            {/* Top drivers */}
            <div className="mt-6 space-y-3">
              {[
                { rank: 1, name: "OpenAI", cost: "$200.00" },
                { rank: 2, name: "GPT-4o", cost: "$142.37" },
                { rank: 3, name: "Vercel", cost: "$20.00" },
              ].map((d, i) => (
                <div
                  key={d.rank}
                  className={cn(
                    "flex items-center justify-between border-b border-white/[0.04] pb-3 transition-all duration-500 last:border-0",
                    inView
                      ? "translate-y-0 opacity-100"
                      : "translate-y-4 opacity-0",
                  )}
                  style={{ transitionDelay: `${2.2 + i * 0.15}s` }}
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

          {/* Desktop floating annotations */}
          <div
            className={cn(
              "absolute -right-2 top-8 hidden max-w-[200px] rounded-lg bg-[#1A1A1A] p-3 shadow-2xl ring-1 ring-white/[0.1] transition-all duration-500 lg:-right-8 lg:top-12 lg:block",
              inView
                ? "translate-x-0 opacity-100"
                : "translate-x-4 opacity-0",
            )}
            style={{ transitionDelay: "1.5s" }}
          >
            <p className="text-xs font-medium text-white">Auto-discovery</p>
            <p className="mt-1 text-xs text-[#666666]">
              SDK detects new providers automatically from your env vars
            </p>
          </div>
          <div
            className={cn(
              "absolute -left-2 bottom-16 hidden max-w-[200px] rounded-lg bg-[#1A1A1A] p-3 shadow-2xl ring-1 ring-white/[0.1] transition-all duration-500 lg:-left-8 lg:bottom-24 lg:block",
              inView
                ? "translate-x-0 opacity-100"
                : "-translate-x-4 opacity-0",
            )}
            style={{ transitionDelay: "1.8s" }}
          >
            <p className="text-xs font-medium text-white">
              True cost = tokens + subs
            </p>
            <p className="mt-1 text-xs text-[#666666]">
              Amortized subscription costs distributed across daily spend
            </p>
          </div>

          {/* Mobile annotations (inline) */}
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:hidden">
            {[
              {
                title: "Auto-discovery",
                desc: "SDK detects new providers automatically from your env vars",
              },
              {
                title: "True cost = tokens + subs",
                desc: "Amortized subscription costs distributed across daily spend",
              },
            ].map((ann, i) => (
              <div
                key={ann.title}
                className={cn(
                  "rounded-lg bg-[#1A1A1A] p-3 ring-1 ring-white/[0.1] transition-all duration-500",
                  inView
                    ? "translate-y-0 opacity-100"
                    : "translate-y-4 opacity-0",
                )}
                style={{ transitionDelay: `${2.5 + i * 0.15}s` }}
              >
                <p className="text-xs font-medium text-white">{ann.title}</p>
                <p className="mt-1 text-xs text-[#666666]">{ann.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
