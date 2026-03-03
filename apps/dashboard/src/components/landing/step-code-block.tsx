"use client";

import { useInView } from "@/hooks/use-in-view";
import { cn } from "@/lib/utils";

const CODE_LINES = [
  {
    content: (
      <>
        <span className="text-[#888888]">import</span>{" "}
        <span className="text-white">{"{ ProjectTracker }"}</span>{" "}
        <span className="text-[#888888]">from</span>{" "}
        <span className="text-emerald-400">{'"@finops/sdk"'}</span>
      </>
    ),
  },
  { content: <>&nbsp;</> },
  {
    content: (
      <>
        <span className="text-[#888888]">const</span>{" "}
        <span className="text-white">tracker</span>{" "}
        <span className="text-[#888888]">=</span>{" "}
        <span className="text-[#888888]">new</span>{" "}
        <span className="text-[hsl(217,91%,60%)]">ProjectTracker</span>
        <span className="text-white">{"({"}</span>
      </>
    ),
  },
  {
    content: (
      <>
        {"  "}
        <span className="text-white">apiKey</span>
        <span className="text-[#888888]">:</span>{" "}
        <span className="text-emerald-400">process.env.FINOPS_API_KEY</span>
      </>
    ),
  },
  {
    content: <span className="text-white">{"});"}</span>,
  },
  { content: <>&nbsp;</> },
  {
    content: (
      <span className="text-[#555555]">
        {"// Auto-tracks every OpenAI call"}
      </span>
    ),
  },
  {
    content: (
      <>
        <span className="text-[#888888]">const</span>{" "}
        <span className="text-white">openai</span>{" "}
        <span className="text-[#888888]">=</span>{" "}
        <span className="text-white">tracker.</span>
        <span className="text-[hsl(262,83%,58%)]">wrapOpenAI</span>
        <span className="text-white">(</span>
        <span className="text-[#888888]">new</span>{" "}
        <span className="text-[hsl(217,91%,60%)]">OpenAI</span>
        <span className="text-white">{"())"}</span>
        <span className="animate-blink-cursor ml-0.5 text-white">|</span>
      </>
    ),
  },
];

export function StepCodeBlock() {
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className="rounded-xl bg-[#111111] p-6 ring-1 ring-white/[0.06]"
    >
      <div className="mb-4 flex items-center gap-1.5">
        <div className="h-3 w-3 rounded-full bg-white/[0.06]" />
        <div className="h-3 w-3 rounded-full bg-white/[0.06]" />
        <div className="h-3 w-3 rounded-full bg-white/[0.06]" />
        <span className="ml-3 text-xs text-[#555555]">app.ts</span>
      </div>
      <pre className="overflow-x-auto text-[13px] leading-6">
        <code>
          {CODE_LINES.map((line, i) => (
            <div
              key={i}
              className={cn(
                "transition-all duration-500",
                inView
                  ? "translate-y-0 opacity-100"
                  : "translate-y-3 opacity-0",
              )}
              style={{ transitionDelay: `${i * 0.12}s` }}
            >
              {line.content}
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
}
