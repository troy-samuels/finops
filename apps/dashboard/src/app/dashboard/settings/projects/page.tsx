"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { formatDate } from "@/lib/format";
import { MOCK_PROJECTS } from "@/lib/mock-data";

export default function ProjectsSettingsPage() {
  const [expanded, setExpanded] = useState<string | null>(null);

  function toggleExpand(id: string) {
    setExpanded((prev) => (prev === id ? null : id));
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Projects</h2>
          <p className="mt-1 text-sm text-[#666666]">
            Manage projects and configure budgets.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => toast.info("Add project dialog coming soon")}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Add project
        </Button>
      </div>

      <div className="mt-6 divide-y divide-white/[0.04] rounded-xl bg-white/[0.02] ring-1 ring-white/[0.05]">
        {MOCK_PROJECTS.map((project) => (
          <div key={project.id}>
            <button
              type="button"
              onClick={() => toggleExpand(project.id)}
              className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-white/[0.02]"
            >
              <div className="flex items-center gap-3">
                {expanded === project.id ? (
                  <ChevronDown className="h-4 w-4 text-[#555555]" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-[#555555]" />
                )}
                <div>
                  <p className="text-sm font-medium text-white">
                    {project.name}
                  </p>
                  <p className="text-xs text-[#666666]">{project.slug}</p>
                </div>
              </div>
              <span className="text-xs text-[#666666]">
                {formatDate(project.created_at)}
              </span>
            </button>

            {expanded === project.id ? (
              <div className="border-t border-white/[0.04] px-4 py-4">
                <h3 className="text-sm font-medium text-[#888888]">
                  Budget Configuration
                </h3>
                <div className="mt-3 grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Monthly limit (USD)</Label>
                    <Input type="number" min="0" step="1" placeholder="500" />
                  </div>
                  <div className="space-y-2">
                    <Label>Alert threshold (%)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      placeholder="80"
                    />
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Email alerts</Label>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Slack alerts</Label>
                    <Switch />
                  </div>
                </div>
                <div className="mt-4">
                  <Button
                    size="sm"
                    onClick={() => toast.success("Budget saved")}
                  >
                    Save budget
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
