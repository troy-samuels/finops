"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatCurrency, formatDate } from "@/lib/format";
import type { RecurringSubscription, Project } from "@/lib/types";

interface SubscriptionTableProps {
  subscriptions: RecurringSubscription[];
  projects: Project[];
}

export function SubscriptionTable({
  subscriptions,
  projects,
}: SubscriptionTableProps) {
  const [rows, setRows] = useState(subscriptions);

  function projectName(id: string | null): string {
    if (!id) return "—";
    return projects.find((p) => p.id === id)?.name ?? "Unknown";
  }

  function toggleMetered(id: string) {
    setRows((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, covers_metered_usage: !s.covers_metered_usage } : s,
      ),
    );
  }

  return (
    <TooltipProvider>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Provider
            </TableHead>
            <TableHead className="text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Monthly Cost
            </TableHead>
            <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Scope
            </TableHead>
            <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Project
            </TableHead>
            <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Covers Metered
            </TableHead>
            <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Created
            </TableHead>
            <TableHead className="w-[80px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((sub) => (
            <TableRow key={sub.id}>
              <TableCell className="text-sm font-medium">
                {sub.provider}
              </TableCell>
              <TableCell className="text-right text-sm tabular-nums">
                {formatCurrency(sub.monthly_cost)}
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="text-xs capitalize">
                  {sub.scope}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {projectName(sub.project_id)}
              </TableCell>
              <TableCell>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Switch
                      checked={sub.covers_metered_usage}
                      onCheckedChange={() => toggleMetered(sub.id)}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="text-xs">
                      When enabled, metered usage for this provider won&apos;t
                      be counted separately.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(sub.created_at)}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TooltipProvider>
  );
}
