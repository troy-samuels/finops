"use client";

import { useState } from "react";
import Link from "next/link";
import { Calendar, FileText, Plus, TrendingUp } from "lucide-react";
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
import { MOCK_CHARGEBACK_REPORTS } from "@/lib/mock-chargeback";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export default function ChargebackOverviewPage() {
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const reports = [...MOCK_CHARGEBACK_REPORTS].sort(
    (a, b) => new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime()
  );

  const handleGenerate = () => {
    // In real app: call Supabase RPC generate_chargeback_report
    console.log("Generating report:", { startDate, endDate });
    setGenerateDialogOpen(false);
    setStartDate("");
    setEndDate("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Chargeback Reports</h1>
          <p className="mt-1 text-sm text-[#666666]">
            Allocate AI costs to departments and business units
          </p>
        </div>

        <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30">
              <Plus className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
          </DialogTrigger>
          <DialogContent className="border-white/[0.08] bg-[#0A0A0A]">
            <DialogHeader>
              <DialogTitle className="text-white">Generate Chargeback Report</DialogTitle>
              <DialogDescription className="text-[#666666]">
                Select the date range for cost allocation
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="start-date" className="text-sm text-[#AAAAAA]">
                  Period Start
                </Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="border-white/[0.08] bg-white/[0.03] text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date" className="text-sm text-[#AAAAAA]">
                  Period End
                </Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="border-white/[0.08] bg-white/[0.03] text-white"
                />
              </div>
              <Button
                onClick={handleGenerate}
                disabled={!startDate || !endDate}
                className="w-full bg-emerald-500 text-white hover:bg-emerald-600"
              >
                Generate
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-white/[0.06] bg-[#0A0A0A] p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
              <FileText className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-[#666666]">Total Reports</p>
              <p className="text-2xl font-semibold text-white">{reports.length}</p>
            </div>
          </div>
        </Card>

        <Card className="border-white/[0.06] bg-[#0A0A0A] p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-[#666666]">Latest Period</p>
              <p className="text-lg font-semibold text-white">
                {formatCurrency(reports[0]?.total_cost ?? 0)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="border-white/[0.06] bg-[#0A0A0A] p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20">
              <Calendar className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-[#666666]">Allocation Rate</p>
              <p className="text-lg font-semibold text-white">
                {formatPercent(
                  ((reports[0]?.allocated_cost ?? 0) / (reports[0]?.total_cost ?? 1)) * 100
                )}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Reports list */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-widest text-[#666666]">
          Generated Reports
        </h2>

        <div className="space-y-3">
          {reports.map((report) => {
            const allocatedPercent =
              (report.allocated_cost / report.total_cost) * 100;

            return (
              <Link key={report.id} href={`/dashboard/chargeback/${report.id}`}>
                <Card className="border-white/[0.06] bg-[#0A0A0A] p-6 transition-all hover:border-white/[0.12] hover:bg-white/[0.02]">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-medium text-white">
                          {formatDate(report.period_start)} – {formatDate(report.period_end)}
                        </h3>
                        <Badge
                          variant="outline"
                          className={
                            report.status === "complete"
                              ? "border-emerald-500/50 text-emerald-400"
                              : report.status === "generating"
                                ? "border-blue-500/50 text-blue-400"
                                : report.status === "failed"
                                  ? "border-red-500/50 text-red-400"
                                  : "border-[#666666]/50 text-[#666666]"
                          }
                        >
                          {report.status}
                        </Badge>
                      </div>
                      <div className="mt-2 flex items-center gap-6 text-sm text-[#666666]">
                        <span>
                          Total: <span className="text-white">{formatCurrency(report.total_cost)}</span>
                        </span>
                        <span>
                          Allocated: <span className="text-emerald-400">{formatPercent(allocatedPercent)}</span>
                        </span>
                        <span>
                          Unallocated: <span className="text-[#AAAAAA]">{formatCurrency(report.unallocated_cost)}</span>
                        </span>
                        <span className="ml-auto">
                          Generated {formatDate(report.generated_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/dashboard/chargeback/cost-centres">
          <Card className="border-white/[0.06] bg-[#0A0A0A] p-6 transition-all hover:border-white/[0.12] hover:bg-white/[0.02]">
            <h3 className="text-lg font-medium text-white">Manage Cost Centres</h3>
            <p className="mt-1 text-sm text-[#666666]">
              Define departments, teams, and business units
            </p>
          </Card>
        </Link>

        <Link href="/dashboard/chargeback/rules">
          <Card className="border-white/[0.06] bg-[#0A0A0A] p-6 transition-all hover:border-white/[0.12] hover:bg-white/[0.02]">
            <h3 className="text-lg font-medium text-white">Allocation Rules</h3>
            <p className="mt-1 text-sm text-[#666666]">
              Configure how costs are mapped to cost centres
            </p>
          </Card>
        </Link>
      </div>
    </div>
  );
}
