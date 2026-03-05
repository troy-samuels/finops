"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Plus, Circle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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

      <div className="mt-6 space-y-3">
        {MOCK_PROJECTS.map((project) => (
          <div
            key={project.id}
            className="overflow-hidden rounded-xl bg-white/[0.02] ring-1 ring-white/[0.06] transition-all duration-200 hover:ring-white/[0.1]"
          >
            <button
              type="button"
              onClick={() => toggleExpand(project.id)}
              className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-white/[0.02]"
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {expanded === project.id ? (
                    <ChevronDown className="h-4 w-4 text-[#555555]" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-[#555555]" />
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Circle className="h-2.5 w-2.5 fill-emerald-400 text-emerald-400" />
                  <div>
                    <p className="text-sm font-medium text-white">
                      {project.name}
                    </p>
                    <p className="text-xs text-[#666666]">{project.slug}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  variant="secondary"
                  className="border-emerald-500/20 bg-emerald-500/10 text-xs text-emerald-400"
                >
                  Active
                </Badge>
                <span className="text-xs text-[#666666]">
                  Created {formatDate(project.created_at)}
                </span>
              </div>
            </button>

            {expanded === project.id ? (
              <div className="animate-scale-in border-t border-white/[0.04] px-5 py-5">
                <h3 className="text-sm font-medium text-[#888888]">
                  Budget Configuration
                </h3>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Monthly limit (£)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="500"
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Alert threshold (%)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      placeholder="80"
                      className="h-10"
                    />
                  </div>
                </div>
                <div className="mt-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm">Email alerts</Label>
                      <p className="text-xs text-[#555555]">
                        Get notified when spending approaches the limit
                      </p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm">Slack alerts</Label>
                      <p className="text-xs text-[#555555]">
                        Send alerts to your Slack channel
                      </p>
                    </div>
                    <Switch />
                  </div>
                </div>
                <div className="mt-5">
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
