"use client";

import { useInView } from "@/hooks/use-in-view";
import { StepCodeBlock } from "./step-code-block";
import { StepEventFeed } from "./step-event-feed";
import { StepCostAssembly } from "./step-cost-assembly";
import { cn } from "@/lib/utils";

export function HowItWorks() {
  const { ref: headerRef, inView: headerVisible } =
    useInView<HTMLDivElement>();
  const { ref: step1Ref, inView: step1Visible } = useInView<HTMLDivElement>();
  const { ref: step2Ref, inView: step2Visible } = useInView<HTMLDivElement>();
  const { ref: step3Ref, inView: step3Visible } = useInView<HTMLDivElement>();

  return (
    <section id="how-it-works" className="py-24 sm:py-32">
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
            How It Works
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
            Three lines of code.
            <br className="hidden sm:block" />
            {" Complete visibility."}
          </h2>
        </div>

        <div className="mt-16 space-y-24">
          {/* Step 1 — Drop in our SDK */}
          <div
            ref={step1Ref}
            className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2"
          >
            <div>
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-sm font-medium text-[#888888] transition-all duration-500",
                    step1Visible
                      ? "scale-100 opacity-100"
                      : "scale-75 opacity-0",
                  )}
                >
                  1
                </span>
                <h3
                  className={cn(
                    "text-xl font-semibold text-white transition-all duration-500",
                    step1Visible
                      ? "translate-x-0 opacity-100"
                      : "translate-x-4 opacity-0",
                  )}
                  style={{ transitionDelay: "100ms" }}
                >
                  Drop in our SDK
                </h3>
              </div>
              <p
                className={cn(
                  "mt-4 max-w-md text-sm leading-relaxed text-[#888888] transition-all duration-500",
                  step1Visible
                    ? "translate-y-0 opacity-100"
                    : "translate-y-4 opacity-0",
                )}
                style={{ transitionDelay: "200ms" }}
              >
                Install the package, initialize with your API key, and wrap your
                OpenAI client. Three lines — that&apos;s it. The SDK is
                fire-and-forget and will never crash your app.
              </p>
            </div>
            <StepCodeBlock />
          </div>

          {/* Connector */}
          <div className="mx-auto h-16 w-px bg-gradient-to-b from-white/[0.08] to-transparent" />

          {/* Step 2 — We track every dollar */}
          <div
            ref={step2Ref}
            className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2"
          >
            <div className="lg:order-2">
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-sm font-medium text-[#888888] transition-all duration-500",
                    step2Visible
                      ? "scale-100 opacity-100"
                      : "scale-75 opacity-0",
                  )}
                >
                  2
                </span>
                <h3
                  className={cn(
                    "text-xl font-semibold text-white transition-all duration-500",
                    step2Visible
                      ? "translate-x-0 opacity-100"
                      : "translate-x-4 opacity-0",
                  )}
                  style={{ transitionDelay: "100ms" }}
                >
                  We track every dollar
                </h3>
              </div>
              <p
                className={cn(
                  "mt-4 max-w-md text-sm leading-relaxed text-[#888888] transition-all duration-500",
                  step2Visible
                    ? "translate-y-0 opacity-100"
                    : "translate-y-4 opacity-0",
                )}
                style={{ transitionDelay: "200ms" }}
              >
                Every API call, every token, every subscription. The SDK
                auto-discovers providers from your environment and reports usage
                in real time.
              </p>
            </div>
            <div className="lg:order-1">
              <StepEventFeed />
            </div>
          </div>

          {/* Connector */}
          <div className="mx-auto h-16 w-px bg-gradient-to-b from-white/[0.08] to-transparent" />

          {/* Step 3 — See your true costs */}
          <div
            ref={step3Ref}
            className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2"
          >
            <div>
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-sm font-medium text-[#888888] transition-all duration-500",
                    step3Visible
                      ? "scale-100 opacity-100"
                      : "scale-75 opacity-0",
                  )}
                >
                  3
                </span>
                <h3
                  className={cn(
                    "text-xl font-semibold text-white transition-all duration-500",
                    step3Visible
                      ? "translate-x-0 opacity-100"
                      : "translate-x-4 opacity-0",
                  )}
                  style={{ transitionDelay: "100ms" }}
                >
                  See your true costs
                </h3>
              </div>
              <p
                className={cn(
                  "mt-4 max-w-md text-sm leading-relaxed text-[#888888] transition-all duration-500",
                  step3Visible
                    ? "translate-y-0 opacity-100"
                    : "translate-y-4 opacity-0",
                )}
                style={{ transitionDelay: "200ms" }}
              >
                Your dashboard shows the full picture: per-token metered costs
                plus amortized subscription fees. Set budgets, get alerts, and
                catch anomalies before they become problems.
              </p>
            </div>
            <StepCostAssembly />
          </div>
        </div>
      </div>
    </section>
  );
}
