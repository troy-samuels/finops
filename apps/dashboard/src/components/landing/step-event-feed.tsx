"use client";

import { useEffect, useState } from "react";
import { useInView } from "@/hooks/use-in-view";
import { cn } from "@/lib/utils";

const EVENTS = [
  {
    provider: "OpenAI",
    model: "gpt-4o",
    tokens: 2847,
    cost: "$0.0142",
    time: "2s ago",
  },
  {
    provider: "Anthropic",
    model: "claude-3-haiku",
    tokens: 1205,
    cost: "$0.0030",
    time: "5s ago",
  },
  {
    provider: "Google AI",
    model: "gemini-1.5-pro",
    tokens: 4310,
    cost: "$0.0108",
    time: "8s ago",
  },
  {
    provider: "AWS Lambda",
    model: "invocation",
    tokens: 0,
    cost: "$0.0001",
    time: "12s ago",
  },
  {
    provider: "Pinecone",
    model: "query",
    tokens: 0,
    cost: "$0.0004",
    time: "15s ago",
  },
];

export function StepEventFeed() {
  const { ref, inView } = useInView<HTMLDivElement>();
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (!inView) return;

    let count = 0;
    const interval = setInterval(() => {
      count += 1;
      setVisibleCount(count);
      if (count >= EVENTS.length) clearInterval(interval);
    }, 600);

    return () => clearInterval(interval);
  }, [inView]);

  return (
    <div
      ref={ref}
      className="rounded-xl bg-white/[0.02] p-6 ring-1 ring-white/[0.05]"
    >
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-medium uppercase tracking-wide text-[#555555]">
          Live Event Feed
        </p>
        {visibleCount > 0 ? (
          <span className="text-xs tabular-nums text-[#555555]">
            {visibleCount} events
          </span>
        ) : null}
      </div>
      <div className="space-y-2">
        {EVENTS.slice(0, visibleCount).map((event, i) => (
          <div
            key={`${event.provider}-${event.model}-${i}`}
            className="animate-pop-in flex items-center justify-between rounded-lg bg-white/[0.02] px-4 py-3 ring-1 ring-white/[0.04]"
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "h-2 w-2 rounded-full bg-emerald-400",
                  i === 0 ? "animate-pulse-dot" : "",
                )}
              />
              <span className="text-sm text-white">{event.provider}</span>
              <span className="hidden text-xs text-[#555555] sm:inline">
                {event.model}
              </span>
            </div>
            <div className="flex items-center gap-4">
              {event.tokens > 0 ? (
                <span className="hidden text-xs tabular-nums text-[#555555] sm:inline">
                  {event.tokens.toLocaleString()} tokens
                </span>
              ) : null}
              <span className="text-xs font-medium tabular-nums text-white">
                {event.cost}
              </span>
              <span className="text-xs text-[#444444]">{event.time}</span>
            </div>
          </div>
        ))}
        {visibleCount === 0 ? (
          <div className="flex h-[200px] items-center justify-center">
            <p className="text-sm text-[#444444]">Waiting for events...</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
