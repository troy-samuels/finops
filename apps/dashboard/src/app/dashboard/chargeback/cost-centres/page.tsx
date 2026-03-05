"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Pencil, Trash2, ChevronDown, ChevronRight } from "lucide-react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  MOCK_COST_CENTRES,
  getRulesForCostCentre,
  type CostCentre,
} from "@/lib/mock-chargeback";

function formatCurrency(amount: number | null): string {
  if (amount === null) return "—";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
  }).format(amount);
}

function CostCentreRow({ costCentre }: { costCentre: CostCentre }) {
  const [expanded, setExpanded] = useState(false);
  const rules = getRulesForCostCentre(costCentre.id);

  return (
    <>
      <TableRow className="border-white/[0.06] hover:bg-white/[0.02]">
        <TableCell className="w-8">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[#666666] transition-colors hover:text-white"
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        </TableCell>
        <TableCell className="font-medium text-white">{costCentre.name}</TableCell>
        <TableCell className="font-mono text-xs text-[#AAAAAA]">
          {costCentre.code}
        </TableCell>
        <TableCell className="text-[#AAAAAA]">
          {formatCurrency(costCentre.budget_monthly)}
        </TableCell>
        <TableCell className="text-sm text-[#AAAAAA]">
          {costCentre.owner_email ?? "—"}
        </TableCell>
        <TableCell className="text-center">
          <Badge
            variant="outline"
            className="border-blue-500/50 bg-blue-500/10 text-blue-400"
          >
            {rules.length}
          </Badge>
        </TableCell>
        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-[#666666] hover:bg-white/[0.06] hover:text-white"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-[#666666] hover:bg-red-500/20 hover:text-red-400"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>

      {/* Expanded: show allocation rules */}
      {expanded && (
        <TableRow className="border-white/[0.06] bg-white/[0.02]">
          <TableCell colSpan={7} className="p-6">
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-white">Allocation Rules</h4>
              {rules.length === 0 ? (
                <p className="text-sm text-[#666666]">
                  No allocation rules configured for this cost centre.
                </p>
              ) : (
                <div className="space-y-2">
                  {rules.map((rule) => (
                    <div
                      key={rule.id}
                      className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-[#0A0A0A] p-3"
                    >
                      <div className="flex items-center gap-4">
                        <Badge
                          variant="outline"
                          className="border-emerald-500/50 text-emerald-400"
                        >
                          {rule.rule_type}
                        </Badge>
                        <span className="text-sm text-[#AAAAAA]">
                          {rule.rule_type === "tag" && (
                            <>
                              {rule.match_key} = {rule.match_value}
                            </>
                          )}
                          {(rule.rule_type === "project" ||
                            rule.rule_type === "provider" ||
                            rule.rule_type === "model") && <>{rule.match_value}</>}
                          {rule.rule_type === "percentage" && (
                            <>Catch-all {rule.allocation_percent}% of unallocated</>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-[#666666]">
                        <span>Priority: {rule.priority}</span>
                        <span>
                          Allocation: <span className="text-white">{rule.allocation_percent}%</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

export default function CostCentresPage() {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    budget: "",
    owner: "",
  });

  const handleAdd = () => {
    // In real app: insert into Supabase
    console.log("Adding cost centre:", formData);
    setAddDialogOpen(false);
    setFormData({ name: "", code: "", budget: "", owner: "" });
  };

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
            <h1 className="text-2xl font-semibold text-white">Cost Centres</h1>
            <p className="mt-1 text-sm text-[#666666]">
              Define departments, teams, and business units
            </p>
          </div>
        </div>

        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30">
              <Plus className="mr-2 h-4 w-4" />
              Add Cost Centre
            </Button>
          </DialogTrigger>
          <DialogContent className="border-white/[0.08] bg-[#0A0A0A]">
            <DialogHeader>
              <DialogTitle className="text-white">Add Cost Centre</DialogTitle>
              <DialogDescription className="text-[#666666]">
                Create a new department or business unit
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm text-[#AAAAAA]">
                  Name
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., Engineering"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="border-white/[0.08] bg-white/[0.03] text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code" className="text-sm text-[#AAAAAA]">
                  Code
                </Label>
                <Input
                  id="code"
                  placeholder="e.g., ENG-001"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="border-white/[0.08] bg-white/[0.03] text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget" className="text-sm text-[#AAAAAA]">
                  Monthly Budget (GBP, optional)
                </Label>
                <Input
                  id="budget"
                  type="number"
                  placeholder="e.g., 5000"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  className="border-white/[0.08] bg-white/[0.03] text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="owner" className="text-sm text-[#AAAAAA]">
                  Owner Email (optional)
                </Label>
                <Input
                  id="owner"
                  type="email"
                  placeholder="e.g., cto@example.com"
                  value={formData.owner}
                  onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                  className="border-white/[0.08] bg-white/[0.03] text-white"
                />
              </div>
              <Button
                onClick={handleAdd}
                disabled={!formData.name || !formData.code}
                className="w-full bg-emerald-500 text-white hover:bg-emerald-600"
              >
                Create Cost Centre
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cost centres table */}
      <Card className="border-white/[0.06] bg-[#0A0A0A] p-6">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/[0.06] hover:bg-transparent">
                <TableHead className="w-8"></TableHead>
                <TableHead className="text-[#666666]">Name</TableHead>
                <TableHead className="text-[#666666]">Code</TableHead>
                <TableHead className="text-[#666666]">Budget</TableHead>
                <TableHead className="text-[#666666]">Owner</TableHead>
                <TableHead className="text-center text-[#666666]">Rules</TableHead>
                <TableHead className="text-right text-[#666666]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_COST_CENTRES.map((costCentre) => (
                <CostCentreRow key={costCentre.id} costCentre={costCentre} />
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Help text */}
      <Card className="border-blue-500/20 bg-blue-500/5 p-4">
        <p className="text-sm text-blue-400">
          <strong>Tip:</strong> Click the arrow to expand a cost centre and view its
          allocation rules. Create rules on the{" "}
          <Link
            href="/dashboard/chargeback/rules"
            className="underline hover:text-blue-300"
          >
            Allocation Rules
          </Link>{" "}
          page.
        </p>
      </Card>
    </div>
  );
}
