"use client";

import { useState } from "react";
import { Plus, Copy, Check, Key, ShieldCheck, ShieldX } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/lib/format";
import { MOCK_PROJECTS } from "@/lib/mock-data";

interface MockApiKey {
  id: string;
  label: string;
  projectName: string;
  lastUsed: string | null;
  createdAt: string;
  status: "active" | "revoked";
}

const MOCK_API_KEYS: MockApiKey[] = [
  {
    id: "key-1",
    label: "Production",
    projectName: "ChatBot Pro",
    lastUsed: "2026-03-02T14:00:00.000Z",
    createdAt: "2026-01-16T10:00:00.000Z",
    status: "active",
  },
  {
    id: "key-2",
    label: "Development",
    projectName: "API Gateway",
    lastUsed: null,
    createdAt: "2026-02-01T09:00:00.000Z",
    status: "active",
  },
];

const GENERATED_KEY = "pk_live_x9y8z7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2h1g0";

export default function ApiKeysSettingsPage() {
  const [keys, setKeys] = useState(MOCK_API_KEYS);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newKeyVisible, setNewKeyVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newProject, setNewProject] = useState("");

  function handleCreate() {
    if (!newLabel.trim() || !newProject) return;
    setNewKeyVisible(true);
    const project = MOCK_PROJECTS.find((p) => p.id === newProject);
    setKeys((prev) => [
      ...prev,
      {
        id: `key-${Date.now()}`,
        label: newLabel,
        projectName: project?.name ?? "Unknown",
        lastUsed: null,
        createdAt: new Date().toISOString(),
        status: "active" as const,
      },
    ]);
  }

  function handleCopy() {
    void navigator.clipboard.writeText(GENERATED_KEY);
    setCopied(true);
    toast.success("API key copied");
    setTimeout(() => setCopied(false), 2000);
  }

  function handleRevoke(id: string) {
    setKeys((prev) =>
      prev.map((k) => (k.id === id ? { ...k, status: "revoked" as const } : k)),
    );
    toast.success("API key revoked");
  }

  function handleCloseDialog(open: boolean) {
    setDialogOpen(open);
    if (!open) {
      setNewKeyVisible(false);
      setNewLabel("");
      setNewProject("");
      setCopied(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">API Keys</h2>
          <p className="mt-1 text-sm text-[#666666]">
            Manage API keys for your projects. Keys are used to authenticate SDK requests.
          </p>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Create key
        </Button>
      </div>

      <div className="mt-6 space-y-3">
        {keys.map((key) => (
          <div
            key={key.id}
            className="rounded-xl bg-white/[0.02] p-5 ring-1 ring-white/[0.06] transition-all duration-200 hover:ring-white/[0.1]"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {key.status === "active" ? (
                    <ShieldCheck className="h-5 w-5 text-emerald-400" />
                  ) : (
                    <ShieldX className="h-5 w-5 text-red-400/60" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-white">{key.label}</p>
                    <Badge
                      variant="secondary"
                      className={
                        key.status === "active"
                          ? "border-emerald-500/20 bg-emerald-500/10 text-xs text-emerald-400"
                          : "text-xs"
                      }
                    >
                      {key.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-[#666666]">
                    {key.projectName}
                  </p>
                  <div className="mt-2 flex items-center gap-4 text-xs text-[#555555]">
                    <span>Created {formatDate(key.createdAt)}</span>
                    <span>
                      {key.lastUsed
                        ? `Last used ${formatDate(key.lastUsed)}`
                        : "Never used"}
                    </span>
                  </div>
                </div>
              </div>
              {key.status === "active" ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRevoke(key.id)}
                  className="text-red-400/60 hover:text-red-400"
                >
                  Revoke
                </Button>
              ) : null}
            </div>

            {key.status === "active" ? (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-white/[0.03] px-3 py-2">
                <Key className="h-3.5 w-3.5 shrink-0 text-[#555555]" />
                <code className="flex-1 truncate font-mono text-xs text-[#777777]">
                  pk_live_••••••••••••••••••••••••
                </code>
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create API Key</DialogTitle>
          </DialogHeader>
          {!newKeyVisible ? (
            <div className="mt-2 space-y-5">
              <div className="space-y-2">
                <Label className="text-xs">Label</Label>
                <Input
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="e.g., Production"
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Project</Label>
                <Select value={newProject} onValueChange={setNewProject}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOCK_PROJECTS.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="ghost"
                  onClick={() => handleCloseDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={!newLabel.trim() || !newProject}
                >
                  Create
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-2 space-y-5">
              <p className="text-sm text-[#888888]">
                Your new API key has been created. Copy it now — you
                won&apos;t be able to see it again.
              </p>
              <div className="rounded-xl bg-[#111111] p-4 ring-1 ring-white/[0.08]">
                <div className="flex items-center justify-between gap-3">
                  <code className="flex-1 break-all font-mono text-sm text-white">
                    {GENERATED_KEY}
                  </code>
                  <Button variant="ghost" size="sm" onClick={handleCopy}>
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => handleCloseDialog(false)}>Done</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
