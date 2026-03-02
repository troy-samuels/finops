import { Server, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/format";
import type { ActionItem as ActionItemType } from "@/lib/types";

interface ActionItemProps {
  item: ActionItemType;
}

export function ActionItem({ item }: ActionItemProps) {
  const Icon = item.type === "pending_resource" ? Server : HelpCircle;

  return (
    <div className="flex items-center gap-4 border-b border-border py-4 last:border-b-0">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{item.title}</p>
        <p className="text-xs text-muted-foreground">
          {item.description} &middot; {item.project_name} &middot;{" "}
          {formatRelativeTime(item.created_at)}
        </p>
      </div>

      <Button variant="outline" size="sm" className="shrink-0 text-xs">
        {item.action_label}
      </Button>
    </div>
  );
}
