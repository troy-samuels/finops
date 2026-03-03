"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInView } from "@/hooks/use-in-view";
import { cn } from "@/lib/utils";

export function FinalCta() {
  const { ref, inView } = useInView<HTMLElement>();

  return (
    <section ref={ref} className="relative overflow-hidden py-24 sm:py-32">
      <div className="relative mx-auto max-w-2xl px-6 text-center">
        <h2
          className={cn(
            "text-3xl font-semibold tracking-tight text-white transition-all duration-700 sm:text-4xl",
            inView ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
          )}
        >
          Stop guessing.
          <br />
          Start tracking.
        </h2>
        <p
          className={cn(
            "mt-4 text-base text-[#888888] transition-all duration-700",
            inView ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
          )}
          style={{ transitionDelay: "150ms" }}
        >
          Join 500+ developers who know exactly what their AI costs.
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
        </div>
        <p
          className={cn(
            "mt-6 text-xs text-[#555555] transition-all duration-700",
            inView ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
          )}
          style={{ transitionDelay: "450ms" }}
        >
          Free forever for small projects. No credit card required.
        </p>
      </div>
    </section>
  );
}
