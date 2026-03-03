"use client";

import { useState } from "react";
import { Plus, Copy, Check } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
            Manage API keys for your projects.
          </p>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Create API key
        </Button>
      </div>

      <div className="mt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Label</TableHead>
              <TableHead>Project</TableHead>
              <TableHead className="hidden md:table-cell">Last Used</TableHead>
              <TableHead className="hidden md:table-cell">Created</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {keys.map((key) => (
              <TableRow key={key.id}>
                <TableCell className="text-sm font-medium">
                  {key.label}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{key.projectName}</Badge>
                </TableCell>
                <TableCell className="hidden text-sm text-[#666666] md:table-cell">
                  {key.lastUsed ? formatDate(key.lastUsed) : "Never"}
                </TableCell>
                <TableCell className="hidden text-sm text-[#666666] md:table-cell">
                  {formatDate(key.createdAt)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      key.status === "active" ? "secondary" : "destructive"
                    }
                  >
                    {key.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {key.status === "active" ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRevoke(key.id)}
                    >
                      Revoke
                    </Button>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create API Key</DialogTitle>
          </DialogHeader>
          {!newKeyVisible ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Label</Label>
                <Input
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="e.g., Production"
                />
              </div>
              <div className="space-y-2">
                <Label>Project</Label>
                <Select value={newProject} onValueChange={setNewProject}>
                  <SelectTrigger>
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
              <div className="flex justify-end gap-2">
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
            <div className="space-y-4">
              <p className="text-sm text-[#888888]">
                Your new API key has been created. Copy it now — you
                won&apos;t be able to see it again.
              </p>
              <div className="rounded-lg bg-[#111111] p-4 ring-1 ring-white/[0.08]">
                <div className="flex items-center justify-between">
                  <code className="break-all font-mono text-sm text-white">
                    {GENERATED_KEY}
                  </code>
                  <Button variant="ghost" size="sm" onClick={handleCopy}>
                    {copied ? (
                      <Check className="h-3.5 w-3.5" />
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
