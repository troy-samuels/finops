"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Bell, Mail, MessageSquare, AlertTriangle, BarChart3, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

type DigestFrequency = "off" | "daily" | "weekly";

const FREQUENCIES: { id: DigestFrequency; label: string; desc: string }[] = [
  { id: "off", label: "Off", desc: "No digest emails" },
  { id: "daily", label: "Daily", desc: "Every morning at 9am" },
  { id: "weekly", label: "Weekly", desc: "Every Monday at 9am" },
];

interface AlertSetting {
  id: string;
  icon: typeof Bell;
  title: string;
  description: string;
  enabled: boolean;
}

export default function NotificationsSettingsPage() {
  const [digest, setDigest] = useState<DigestFrequency>("weekly");
  const [alerts, setAlerts] = useState<AlertSetting[]>([
    {
      id: "budget",
      icon: AlertTriangle,
      title: "Budget alerts",
      description: "Get notified when spending approaches or exceeds budget limits",
      enabled: true,
    },
    {
      id: "anomaly",
      icon: Zap,
      title: "Anomaly detection",
      description: "Alert when daily spend is significantly higher than usual",
      enabled: true,
    },
    {
      id: "report",
      icon: BarChart3,
      title: "Monthly reports",
      description: "Receive a detailed cost breakdown at the end of each month",
      enabled: false,
    },
  ]);
  const [slackEnabled, setSlackEnabled] = useState(false);
  const [slackUrl, setSlackUrl] = useState("");

  function toggleAlert(id: string) {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)),
    );
  }

  return (
    <div className="space-y-8">
      {/* Email digest */}
      <section>
        <div className="flex items-center gap-2">
          <Mail className="h-4.5 w-4.5 text-[#888888]" />
          <h2 className="text-lg font-semibold text-white">Email Digest</h2>
        </div>
        <p className="mt-1 text-sm text-[#666666]">
          Receive a summary of your AI costs delivered to your inbox.
        </p>
        <div className="mt-5 flex gap-3">
          {FREQUENCIES.map((freq) => (
            <button
              key={freq.id}
              type="button"
              onClick={() => setDigest(freq.id)}
              className={cn(
                "flex-1 rounded-xl p-4 text-left ring-1 transition-all duration-200",
                digest === freq.id
                  ? "bg-white/[0.04] text-white ring-white/[0.15]"
                  : "bg-white/[0.01] text-[#666666] ring-white/[0.05] hover:bg-white/[0.03] hover:text-[#888888]",
              )}
            >
              <p className={cn(
                "text-sm font-medium",
                digest === freq.id ? "text-white" : "text-[#888888]",
              )}>
                {freq.label}
              </p>
              <p className="mt-1 text-xs text-[#555555]">{freq.desc}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Alert types */}
      <section>
        <div className="flex items-center gap-2">
          <Bell className="h-4.5 w-4.5 text-[#888888]" />
          <h2 className="text-lg font-semibold text-white">Alert Preferences</h2>
        </div>
        <p className="mt-1 text-sm text-[#666666]">
          Choose which alerts you&apos;d like to receive.
        </p>
        <div className="mt-5 space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-center justify-between rounded-xl bg-white/[0.02] p-5 ring-1 ring-white/[0.06] transition-all duration-200 hover:ring-white/[0.1]"
            >
              <div className="flex items-start gap-3">
                <alert.icon className="mt-0.5 h-4.5 w-4.5 shrink-0 text-[#888888]" />
                <div>
                  <p className="text-sm font-medium text-white">{alert.title}</p>
                  <p className="mt-1 text-xs text-[#666666]">{alert.description}</p>
                </div>
              </div>
              <Switch
                checked={alert.enabled}
                onCheckedChange={() => toggleAlert(alert.id)}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Slack integration */}
      <section>
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4.5 w-4.5 text-[#888888]" />
          <h2 className="text-lg font-semibold text-white">Slack Integration</h2>
        </div>
        <p className="mt-1 text-sm text-[#666666]">
          Send alerts and digests to a Slack channel.
        </p>
        <div className="mt-5 rounded-xl bg-white/[0.02] p-5 ring-1 ring-white/[0.06]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Enable Slack notifications</p>
              <p className="mt-0.5 text-xs text-[#555555]">
                Receive all enabled alerts in your Slack workspace
              </p>
            </div>
            <Switch
              checked={slackEnabled}
              onCheckedChange={setSlackEnabled}
            />
          </div>
          {slackEnabled ? (
            <div className="mt-5 space-y-3">
              <div className="space-y-2">
                <Label className="text-xs" htmlFor="slack-url">Webhook URL</Label>
                <Input
                  id="slack-url"
                  value={slackUrl}
                  onChange={(e) => setSlackUrl(e.target.value)}
                  placeholder="https://hooks.slack.com/services/..."
                  className="h-10"
                />
              </div>
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

      <div className="pt-2">
        <Button
          onClick={() => toast.success("Notification preferences saved")}
        >
          Save preferences
        </Button>
      </div>
    </div>
  );
}
