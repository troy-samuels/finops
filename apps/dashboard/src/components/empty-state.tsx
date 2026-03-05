import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl bg-white/[0.02] py-20 text-center ring-1 ring-white/[0.06]">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04]">
        <Icon className="h-6 w-6 text-[#555555]" />
      </div>
      <h3 className="mt-5 text-sm font-medium text-white">{title}</h3>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-[#666666]">
        {description}
      </p>
      {actionLabel && onAction ? (
        <Button size="sm" className="mt-6" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
