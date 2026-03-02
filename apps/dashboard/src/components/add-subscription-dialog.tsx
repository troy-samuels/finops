"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import type { Project, SubscriptionFormData } from "@/lib/types";

interface AddSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: Project[];
  orgId: string;
}

const INITIAL_FORM: SubscriptionFormData = {
  provider: "",
  monthly_cost: "",
  scope: "organization",
  project_id: null,
  covers_metered_usage: false,
};

export function AddSubscriptionDialog({
  open,
  onOpenChange,
  projects,
}: AddSubscriptionDialogProps) {
  const [form, setForm] = useState<SubscriptionFormData>(INITIAL_FORM);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    toast.success("Subscription added", {
      description: `${form.provider} — $${form.monthly_cost}/mo`,
    });
    setForm(INITIAL_FORM);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add subscription</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="provider">Provider</Label>
            <Input
              id="provider"
              placeholder="e.g. OpenAI, Vercel, AWS"
              value={form.provider}
              onChange={(e) =>
                setForm((f) => ({ ...f, provider: e.target.value }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="monthly_cost">Monthly cost ($)</Label>
            <Input
              id="monthly_cost"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={form.monthly_cost}
              onChange={(e) =>
                setForm((f) => ({ ...f, monthly_cost: e.target.value }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Scope</Label>
            <Select
              value={form.scope}
              onValueChange={(v: "organization" | "project") =>
                setForm((f) => ({
                  ...f,
                  scope: v,
                  project_id: v === "organization" ? null : f.project_id,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="organization">Organization</SelectItem>
                <SelectItem value="project">Project</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {form.scope === "project" ? (
            <div className="space-y-2">
              <Label>Project</Label>
              <Select
                value={form.project_id ?? ""}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, project_id: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <div className="flex items-center justify-between">
            <Label htmlFor="covers_metered">Covers metered usage</Label>
            <Switch
              id="covers_metered"
              checked={form.covers_metered_usage}
              onCheckedChange={(v) =>
                setForm((f) => ({ ...f, covers_metered_usage: v }))
              }
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Add</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
