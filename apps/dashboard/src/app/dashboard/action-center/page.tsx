import { CheckCircle2 } from "lucide-react";
import { ActionItem } from "@/components/action-item";
import { MOCK_ACTION_ITEMS } from "@/lib/mock-data";

export default function ActionCenterPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Action Center</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Items that need your attention.
      </p>

      <div className="mt-8">
        {MOCK_ACTION_ITEMS.length > 0 ? (
          <div>
            {MOCK_ACTION_ITEMS.map((item) => (
              <ActionItem key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <CheckCircle2 className="h-10 w-10 text-muted-foreground/40" />
            <p className="mt-4 text-sm font-medium text-muted-foreground">
              All clear
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              No pending actions right now.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
