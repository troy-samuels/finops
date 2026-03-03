"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type DigestFrequency = "off" | "daily" | "weekly";

const FREQUENCIES: { id: DigestFrequency; label: string }[] = [
  { id: "off", label: "Off" },
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
];

export default function NotificationsSettingsPage() {
  const [digest, setDigest] = useState<DigestFrequency>("off");
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [slackEnabled, setSlackEnabled] = useState(false);
  const [slackUrl, setSlackUrl] = useState("");

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-semibold text-white">Email Digest</h2>
        <p className="mt-1 text-sm text-[#666666]">
          Receive a summary of your AI costs by email.
        </p>
        <div className="mt-4 inline-flex gap-1 rounded-lg bg-white/[0.03] p-1 ring-1 ring-white/[0.06]">
          {FREQUENCIES.map((freq) => (
            <button
              key={freq.id}
              type="button"
              onClick={() => setDigest(freq.id)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                digest === freq.id
                  ? "bg-white/[0.08] text-white shadow-sm"
                  : "text-[#666666] hover:text-[#888888]",
              )}
            >
              {freq.label}
            </button>
          ))}
        </div>
      </section>

      <Separator />

      <section>
        <h2 className="text-lg font-semibold text-white">Budget Alerts</h2>
        <p className="mt-1 text-sm text-[#666666]">
          Get notified when project spending approaches your budget limits.
        </p>
        <div className="mt-4 flex items-center justify-between max-w-md">
          <Label>Enable budget alerts</Label>
          <Switch
            checked={budgetAlerts}
            onCheckedChange={setBudgetAlerts}
          />
        </div>
      </section>

      <Separator />

      <section>
        <h2 className="text-lg font-semibold text-white">
          Slack Integration
        </h2>
        <p className="mt-1 text-sm text-[#666666]">
          Send alerts and digests to a Slack channel.
        </p>
        <div className="mt-4 max-w-md space-y-4">
          <div className="flex items-center justify-between">
            <Label>Enable Slack notifications</Label>
            <Switch
              checked={slackEnabled}
              onCheckedChange={setSlackEnabled}
            />
          </div>
          {slackEnabled ? (
            <div className="space-y-2">
              <Label htmlFor="slack-url">Webhook URL</Label>
              <Input
                id="slack-url"
                value={slackUrl}
                onChange={(e) => setSlackUrl(e.target.value)}
                placeholder="https://hooks.slack.com/services/..."
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  toast.success("Test message sent to Slack")
                }
              >
                Test webhook
              </Button>
            </div>
          ) : null}
        </div>
      </section>

      <div className="pt-4">
        <Button
          onClick={() => toast.success("Notification preferences saved")}
        >
          Save preferences
        </Button>
      </div>
    </div>
  );
}
