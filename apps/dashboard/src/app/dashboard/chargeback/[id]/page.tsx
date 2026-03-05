"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download, Share2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  MOCK_CHARGEBACK_REPORTS,
  getLineItemsForReport,
  getCostCentreName,
  getCostCentreCode,
} from "@/lib/mock-chargeback";

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

function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-GB").format(num);
}

export default function ChargebackReportDetailPage() {
  const params = useParams();
  const reportId = params.id as string;

  const report = MOCK_CHARGEBACK_REPORTS.find((r) => r.id === reportId);
  const lineItems = getLineItemsForReport(reportId);

  if (!report) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <FileText className="mx-auto h-12 w-12 text-[#666666]" />
          <h2 className="mt-4 text-xl font-medium text-white">Report not found</h2>
          <p className="mt-2 text-sm text-[#666666]">
            The requested chargeback report does not exist.
          </p>
          <Link href="/dashboard/chargeback">
            <Button className="mt-4 bg-white/[0.06] text-white hover:bg-white/[0.12]">
              Back to Reports
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const allocatedPercent = (report.allocated_cost / report.total_cost) * 100;
  const unallocatedPercent = (report.unallocated_cost / report.total_cost) * 100;

  // Sort line items by cost descending
  const sortedLineItems = [...lineItems].sort((a, b) => b.total_cost - a.total_cost);

  const handleExportCSV = () => {
    // Build CSV content
    const headers = [
      "Cost Centre",
      "Code",
      "Cost (GBP)",
      "% of Total",
      "Events",
      "Tokens (Prompt)",
      "Tokens (Completion)",
      "Top Model",
    ];

    const rows = sortedLineItems.map((item) => {
      const percent = (item.total_cost / report.total_cost) * 100;
      const topModel = item.top_models[0]?.model ?? "N/A";
      return [
        getCostCentreName(item.cost_centre_id),
        getCostCentreCode(item.cost_centre_id),
        item.total_cost.toFixed(2),
        percent.toFixed(1),
        item.event_count,
        item.tokens_prompt,
        item.tokens_completion,
        topModel,
      ];
    });

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");

    // Download
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chargeback-report-${report.period_start}-${report.period_end}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    alert("Report link copied to clipboard!");
  };

  const maxCost = Math.max(...sortedLineItems.map((li) => li.total_cost));

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
            <h1 className="text-2xl font-semibold text-white">
              Chargeback Report
            </h1>
            <p className="mt-1 text-sm text-[#666666]">
              {formatDate(report.period_start)} – {formatDate(report.period_end)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleExportCSV}
            variant="outline"
            className="border-white/[0.08] bg-transparent text-white hover:bg-white/[0.06]"
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button
            onClick={handleShare}
            variant="outline"
            className="border-white/[0.08] bg-transparent text-white hover:bg-white/[0.06]"
          >
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
        </div>
      </div>

      {/* Summary bar */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-white/[0.06] bg-[#0A0A0A] p-6">
          <p className="text-sm text-[#666666]">Total Cost</p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {formatCurrency(report.total_cost)}
          </p>
        </Card>

        <Card className="border-white/[0.06] bg-[#0A0A0A] p-6">
          <p className="text-sm text-[#666666]">Allocated</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-400">
            {formatCurrency(report.allocated_cost)}
          </p>
          <p className="mt-1 text-xs text-[#666666]">{formatPercent(allocatedPercent)}</p>
        </Card>

        <Card className="border-white/[0.06] bg-[#0A0A0A] p-6">
          <p className="text-sm text-[#666666]">Unallocated</p>
          <p className="mt-2 text-2xl font-semibold text-[#AAAAAA]">
            {formatCurrency(report.unallocated_cost)}
          </p>
          <p className="mt-1 text-xs text-[#666666]">{formatPercent(unallocatedPercent)}</p>
        </Card>

        <Card className="border-white/[0.06] bg-[#0A0A0A] p-6">
          <p className="text-sm text-[#666666]">Period</p>
          <p className="mt-2 text-lg font-medium text-white">
            {new Date(report.period_end).getDate() -
              new Date(report.period_start).getDate() +
              1}{" "}
            days
          </p>
        </Card>
      </div>

      {/* Bar chart */}
      <Card className="border-white/[0.06] bg-[#0A0A0A] p-6">
        <h2 className="mb-6 text-sm font-medium uppercase tracking-widest text-[#666666]">
          Cost by Centre
        </h2>
        <div className="space-y-4">
          {sortedLineItems.map((item) => {
            const percent = (item.total_cost / report.total_cost) * 100;
            const barWidth = (item.total_cost / maxCost) * 100;

            return (
              <div key={item.id} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-white">
                    {getCostCentreName(item.cost_centre_id)}
                  </span>
                  <span className="text-[#AAAAAA]">{formatCurrency(item.total_cost)}</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-white/[0.04]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500/60 to-emerald-500/40"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                <p className="text-xs text-[#666666]">{formatPercent(percent)} of total</p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Line items table */}
      <Card className="border-white/[0.06] bg-[#0A0A0A] p-6">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-widest text-[#666666]">
          Breakdown by Cost Centre
        </h2>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/[0.06] hover:bg-transparent">
                <TableHead className="text-[#666666]">Cost Centre</TableHead>
                <TableHead className="text-[#666666]">Code</TableHead>
                <TableHead className="text-right text-[#666666]">Cost</TableHead>
                <TableHead className="text-right text-[#666666]">% of Total</TableHead>
                <TableHead className="text-right text-[#666666]">Events</TableHead>
                <TableHead className="text-[#666666]">Top Model</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedLineItems.map((item) => {
                const percent = (item.total_cost / report.total_cost) * 100;
                const topModel = item.top_models[0];

                return (
                  <TableRow
                    key={item.id}
                    className="border-white/[0.06] hover:bg-white/[0.02]"
                  >
                    <TableCell className="font-medium text-white">
                      {getCostCentreName(item.cost_centre_id)}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-[#AAAAAA]">
                      {getCostCentreCode(item.cost_centre_id)}
                    </TableCell>
                    <TableCell className="text-right text-white">
                      {formatCurrency(item.total_cost)}
                    </TableCell>
                    <TableCell className="text-right text-emerald-400">
                      {formatPercent(percent)}
                    </TableCell>
                    <TableCell className="text-right text-[#AAAAAA]">
                      {formatNumber(item.event_count)}
                    </TableCell>
                    <TableCell className="text-[#AAAAAA]">
                      {topModel ? (
                        <div>
                          <div className="text-sm text-white">{topModel.model}</div>
                          <div className="text-xs text-[#666666]">
                            {formatCurrency(topModel.cost)} ({formatPercent(topModel.percent)})
                          </div>
                        </div>
                      ) : (
                        <span className="text-[#666666]">N/A</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
