"use client";

import { useInView } from "@/hooks/use-in-view";
import { cn } from "@/lib/utils";

const PROVIDERS = ["OpenAI", "Anthropic", "Google AI", "Vercel", "AWS"];

export function TrustBar() {
  const { ref, inView } = useInView<HTMLElement>();

  return (
    <section ref={ref} className="border-y border-white/[0.04] py-12">
      <div className="mx-auto max-w-6xl px-6">
        <p
          className={cn(
            "text-center text-sm text-[#555555] transition-all duration-700",
            inView ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
          )}
        >
          Trusted by 500+ developers tracking AI costs
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
          {PROVIDERS.map((name, i) => (
            <span
              key={name}
              className={cn(
                "text-lg font-semibold tracking-tight text-white/[0.15] transition-all duration-500 hover:text-white/[0.3]",
                inView
                  ? "translate-y-0 opacity-100"
                  : "translate-y-4 opacity-0",
              )}
              style={{ transitionDelay: `${0.2 + i * 0.1}s` }}
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
