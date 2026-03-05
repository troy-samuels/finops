"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  MOCK_COST_ALLOCATION_RULES,
  MOCK_COST_CENTRES,
  getCostCentreName,
  getCostCentreCode,
} from "@/lib/mock-chargeback";

type RuleType = "project" | "provider" | "model" | "tag" | "percentage";

export default function AllocationRulesPage() {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    costCentreId: "",
    ruleType: "" as RuleType | "",
    matchKey: "",
    matchValue: "",
    allocationPercent: "100",
    priority: "10",
  });

  const handleAdd = () => {
    // In real app: insert into Supabase
    console.log("Adding allocation rule:", formData);
    setAddDialogOpen(false);
    setFormData({
      costCentreId: "",
      ruleType: "",
      matchKey: "",
      matchValue: "",
      allocationPercent: "100",
      priority: "10",
    });
  };

  // Sort rules by priority descending
  const sortedRules = [...MOCK_COST_ALLOCATION_RULES].sort(
    (a, b) => b.priority - a.priority
  );

  const showMatchKey = formData.ruleType === "tag";
  const showMatchValue =
    formData.ruleType === "project" ||
    formData.ruleType === "provider" ||
    formData.ruleType === "model" ||
    formData.ruleType === "tag";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/chargeback">
            <Button
              variant="outline"
              size="icon"
              className="border-white/[0.08] bg-transparent text-[#666666] hover:bg-white/[0.03] hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-white">Allocation Rules</h1>
            <p className="mt-1 text-sm text-[#666666]">
              Configure how costs are mapped to cost centres
            </p>
          </div>
        </div>

        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30">
              <Plus className="mr-2 h-4 w-4" />
              Add Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="border-white/[0.08] bg-[#0A0A0A]">
            <DialogHeader>
              <DialogTitle className="text-white">Add Allocation Rule</DialogTitle>
              <DialogDescription className="text-[#666666]">
                Define how to map events to a cost centre
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="cost-centre" className="text-sm text-[#AAAAAA]">
                  Cost Centre
                </Label>
                <Select
                  value={formData.costCentreId}
                  onValueChange={(val) =>
                    setFormData({ ...formData, costCentreId: val })
                  }
                >
                  <SelectTrigger className="border-white/[0.08] bg-white/[0.03] text-white">
                    <SelectValue placeholder="Select cost centre" />
                  </SelectTrigger>
                  <SelectContent className="border-white/[0.08] bg-[#0A0A0A]">
                    {MOCK_COST_CENTRES.map((cc) => (
                      <SelectItem key={cc.id} value={cc.id} className="text-white">
                        {cc.name} ({cc.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rule-type" className="text-sm text-[#AAAAAA]">
                  Rule Type
                </Label>
                <Select
                  value={formData.ruleType}
                  onValueChange={(val) =>
                    setFormData({ ...formData, ruleType: val as RuleType })
                  }
                >
                  <SelectTrigger className="border-white/[0.08] bg-white/[0.03] text-white">
                    <SelectValue placeholder="Select rule type" />
                  </SelectTrigger>
                  <SelectContent className="border-white/[0.08] bg-[#0A0A0A]">
                    <SelectItem value="project" className="text-white">
                      Project (by project ID)
                    </SelectItem>
                    <SelectItem value="provider" className="text-white">
                      Provider (e.g., openai, anthropic)
                    </SelectItem>
                    <SelectItem value="model" className="text-white">
                      Model (e.g., gpt-4o, claude-3.5-sonnet)
                    </SelectItem>
                    <SelectItem value="tag" className="text-white">
                      Tag (metadata key/value)
                    </SelectItem>
                    <SelectItem value="percentage" className="text-white">
                      Percentage (catch-all)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {showMatchKey && (
                <div className="space-y-2">
                  <Label htmlFor="match-key" className="text-sm text-[#AAAAAA]">
                    Match Key (metadata field)
                  </Label>
                  <Input
                    id="match-key"
                    placeholder="e.g., department"
                    value={formData.matchKey}
                    onChange={(e) =>
                      setFormData({ ...formData, matchKey: e.target.value })
                    }
                    className="border-white/[0.08] bg-white/[0.03] text-white"
                  />
                </div>
              )}

              {showMatchValue && (
                <div className="space-y-2">
                  <Label htmlFor="match-value" className="text-sm text-[#AAAAAA]">
                    Match Value
                  </Label>
                  <Input
                    id="match-value"
                    placeholder={
                      formData.ruleType === "project"
                        ? "Project ID"
                        : formData.ruleType === "provider"
                          ? "e.g., openai"
                          : formData.ruleType === "model"
                            ? "e.g., gpt-4o"
                            : "e.g., engineering"
                    }
                    value={formData.matchValue}
                    onChange={(e) =>
                      setFormData({ ...formData, matchValue: e.target.value })
                    }
                    className="border-white/[0.08] bg-white/[0.03] text-white"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="allocation-percent" className="text-sm text-[#AAAAAA]">
                  Allocation %
                </Label>
                <Input
                  id="allocation-percent"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.allocationPercent}
                  onChange={(e) =>
                    setFormData({ ...formData, allocationPercent: e.target.value })
                  }
                  className="border-white/[0.08] bg-white/[0.03] text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority" className="text-sm text-[#AAAAAA]">
                  Priority (higher = evaluated first)
                </Label>
                <Input
                  id="priority"
                  type="number"
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({ ...formData, priority: e.target.value })
                  }
                  className="border-white/[0.08] bg-white/[0.03] text-white"
                />
              </div>

              <Button
                onClick={handleAdd}
                disabled={!formData.costCentreId || !formData.ruleType}
                className="w-full bg-emerald-500 text-white hover:bg-emerald-600"
              >
                Create Rule
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Rules table */}
      <Card className="border-white/[0.06] bg-[#0A0A0A] p-6">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/[0.06] hover:bg-transparent">
                <TableHead className="text-[#666666]">Cost Centre</TableHead>
                <TableHead className="text-[#666666]">Rule Type</TableHead>
                <TableHead className="text-[#666666]">Match</TableHead>
                <TableHead className="text-right text-[#666666]">Allocation %</TableHead>
                <TableHead className="text-right text-[#666666]">Priority</TableHead>
                <TableHead className="text-right text-[#666666]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRules.map((rule) => {
                let matchDisplay = "";

                if (rule.rule_type === "tag") {
                  matchDisplay = `${rule.match_key} = ${rule.match_value}`;
                } else if (
                  rule.rule_type === "project" ||
                  rule.rule_type === "provider" ||
                  rule.rule_type === "model"
                ) {
                  matchDisplay = rule.match_value ?? "—";
                } else if (rule.rule_type === "percentage") {
                  matchDisplay = "Unallocated costs";
                }

                return (
                  <TableRow key={rule.id} className="border-white/[0.06] hover:bg-white/[0.02]">
                    <TableCell>
                      <div>
                        <div className="font-medium text-white">
                          {getCostCentreName(rule.cost_centre_id)}
                        </div>
                        <div className="font-mono text-xs text-[#666666]">
                          {getCostCentreCode(rule.cost_centre_id)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="border-emerald-500/50 text-emerald-400"
                      >
                        {rule.rule_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[#AAAAAA]">{matchDisplay}</TableCell>
                    <TableCell className="text-right text-white">
                      {rule.allocation_percent}%
                    </TableCell>
                    <TableCell className="text-right text-[#AAAAAA]">
                      {rule.priority}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-[#666666] hover:bg-red-500/20 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Help text */}
      <Card className="border-blue-500/20 bg-blue-500/5 p-4">
        <div className="space-y-2 text-sm text-blue-400">
          <p>
            <strong>How allocation works:</strong>
          </p>
          <ul className="ml-4 list-disc space-y-1">
            <li>
              <strong>Project rules:</strong> Match events by project ID
            </li>
            <li>
              <strong>Provider rules:</strong> Match events by provider (openai, anthropic,
              etc.)
            </li>
            <li>
              <strong>Model rules:</strong> Match events by specific model (gpt-4o,
              claude-3.5-sonnet, etc.)
            </li>
            <li>
              <strong>Tag rules:</strong> Match events by metadata key/value pairs
            </li>
            <li>
              <strong>Percentage rules:</strong> Allocate a % of unallocated costs (catch-all)
            </li>
          </ul>
          <p className="pt-2">
            Rules are evaluated in priority order (highest first). Each event is matched
            to the first applicable rule.
          </p>
        </div>
      </Card>
    </div>
  );
}
