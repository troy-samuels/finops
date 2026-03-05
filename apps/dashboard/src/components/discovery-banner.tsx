"use client";

import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { ActionItem } from "@/lib/types";

interface DiscoveryBannerProps {
  items: ActionItem[];
}

export function DiscoveryBanner({ items }: DiscoveryBannerProps) {
  const firstItem = items[0];
  if (!firstItem) return null;

  const isSingle = items.length === 1;
  const provider = firstItem.provider;

  function handleTrack() {
    toast.success(
      isSingle
        ? `Now tracking costs for ${provider}`
        : `Tracking ${items.length} new services`,
    );
  }

  function handleDismiss() {
    toast("Dismissed", { description: "You can review discoveries later in settings." });
  }

  return (
    <div
      role="alert"
      aria-live="polite"
      className="animate-slide-down-fade flex items-start gap-3 rounded-xl bg-white/[0.02] px-5 py-4 ring-1 ring-white/[0.06]"
    >
      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#888888]" />
      <div className="flex-1">
        <p className="text-sm text-[#AAAAAA]">
          {isSingle
            ? `We noticed you started using ${firstItem.provider}.`
            : `${items.length} new services were discovered.`}
        </p>
        <div className="mt-2 flex gap-2">
          <Button variant="outline" size="sm" onClick={handleTrack}>
            {isSingle ? "Track its cost" : "Review"}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDismiss}>
            {isSingle ? "Ignore" : "Dismiss all"}
          </Button>
        </div>
      </div>
    </div>
  );
}
