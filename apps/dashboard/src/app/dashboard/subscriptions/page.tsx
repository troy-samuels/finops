"use client";

import { useState } from "react";
import { Plus, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SubscriptionTable } from "@/components/subscription-table";
import { AddSubscriptionDialog } from "@/components/add-subscription-dialog";
import { EmptyState } from "@/components/empty-state";
import { MOCK_SUBSCRIPTIONS, MOCK_PROJECTS, MOCK_ORG } from "@/lib/mock-data";

export default function SubscriptionsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Fixed Monthly Costs
          </h1>
          <p className="mt-1 text-sm text-[#666666]">
            Your fixed monthly costs for tools and platforms.
          </p>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Add subscription
        </Button>
      </div>

      <div className="mt-8">
        {MOCK_SUBSCRIPTIONS.length > 0 ? (
          <SubscriptionTable
            subscriptions={MOCK_SUBSCRIPTIONS}
            projects={MOCK_PROJECTS}
          />
        ) : (
          <EmptyState
            icon={CreditCard}
            title="No subscriptions yet"
            description="Add your first subscription to start tracking fixed monthly costs."
            actionLabel="Add subscription"
            onAction={() => setDialogOpen(true)}
          />
        )}
      </div>

      <AddSubscriptionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        projects={MOCK_PROJECTS}
        orgId={MOCK_ORG.id}
      />
    </div>
  );
}
