"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Copy,
  ArrowRight,
  ArrowLeft,
  Zap,
  Clock,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OnboardingProgress } from "@/components/onboarding-progress";
import { cn } from "@/lib/utils";

type ConnectionMethod = "sdk" | "manual";
type ProviderId = "openai" | "anthropic" | "google";

interface OnboardingState {
  orgName: string;
  projectName: string;
  method: ConnectionMethod | null;
  selectedProvider: ProviderId | null;
  apiKey: string;
}

const MOCK_SDK_KEY = "pk_live_a8f3b2c1d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9";

const PROVIDERS: { id: ProviderId; name: string; colour: string }[] = [
  { id: "openai", name: "OpenAI", colour: "#10A37F" },
  { id: "anthropic", name: "Anthropic", colour: "#D4A574" },
  { id: "google", name: "Google AI", colour: "#4285F4" },
];

const VALUE_PROPS = [
  { icon: Clock, text: "See your first cost report in 2 minutes" },
  { icon: Zap, text: "One line of code, all providers tracked" },
  { icon: Shield, text: "Your data stays private, always" },
];

function getCodeSnippet(provider: ProviderId): string {
  const snippets: Record<ProviderId, string> = {
    openai: `// npm install @costpane/sdk (also: @finops-tracker/sdk)
import { ProjectTracker } from '@costpane/sdk'

const tracker = new ProjectTracker({
  apiKey: '${MOCK_SDK_KEY}',
  defaultAttribution: { feature: 'my-ai-chatbot' },
})

// That's it — every OpenAI call is now tracked
const openai = tracker.wrapOpenAI(new OpenAI())`,
    anthropic: `// npm install @costpane/sdk (also: @finops-tracker/sdk)
import { ProjectTracker } from '@costpane/sdk'

const tracker = new ProjectTracker({
  apiKey: '${MOCK_SDK_KEY}',
  defaultAttribution: { feature: 'my-ai-chatbot' },
})

// Wrap your Anthropic client — auto-tracks all calls
const anthropic = tracker.wrapAnthropic(new Anthropic())`,
    google: `// npm install @costpane/sdk (also: @finops-tracker/sdk)
import { ProjectTracker } from '@costpane/sdk'

const tracker = new ProjectTracker({
  apiKey: '${MOCK_SDK_KEY}',
  defaultAttribution: { feature: 'my-ai-chatbot' },
})

// Wrap your Google AI client — auto-tracks all calls
const genAI = tracker.wrapGoogleAI(new GoogleGenerativeAI(apiKey))`,
  };

  return snippets[provider];
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [state, setState] = useState<OnboardingState>({
    orgName: "",
    projectName: "",
    method: null,
    selectedProvider: null,
    apiKey: "",
  });

  const transition = useCallback((nextStep: number) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setStep(nextStep);
      setIsTransitioning(false);
    }, 150);
  }, []);

  function handleCopyKey() {
    void navigator.clipboard.writeText(MOCK_SDK_KEY);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  }

  const totalSteps = 4;

  return (
    <div className="w-full max-w-lg">
      {/* Value props before the form */}
      {step === 0 ? (
        <div className="mb-8 flex justify-center gap-6">
          {VALUE_PROPS.map((prop) => (
            <div key={prop.text} className="flex items-center gap-2 text-xs text-[#666666]">
              <prop.icon className="h-3.5 w-3.5 shrink-0 text-[#888888]" />
              <span>{prop.text}</span>
            </div>
          ))}
        </div>
      ) : null}

      <div
        className="rounded-2xl bg-white/[0.02] p-8 ring-1 ring-white/[0.06] shadow-[0_16px_64px_rgb(0,0,0,0.2)] transition-all duration-150 md:p-10"
        style={{
          opacity: isTransitioning ? 0 : 1,
          transform: isTransitioning ? "translateY(8px)" : "translateY(0)",
        }}
      >
        <OnboardingProgress currentStep={step} totalSteps={totalSteps} />

        {/* Step 1: Name your workspace and project */}
        {step === 0 && (
          <div>
            <h1 className="mt-8 text-2xl font-semibold tracking-tight text-white">
              Let&apos;s get you set up
            </h1>
            <p className="mt-2 text-sm text-[#666666]">
              Tell us about your organisation and what you&apos;re building.
            </p>
            <div className="mt-8 space-y-5">
              <div className="space-y-2">
                <Label className="text-xs" htmlFor="org-name">Organisation name</Label>
                <Input
                  id="org-name"
                  value={state.orgName}
                  onChange={(e) =>
                    setState((prev) => ({ ...prev, orgName: e.target.value }))
                  }
                  placeholder="Acme Inc."
                  className="h-11"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && state.orgName.trim() && state.projectName.trim())
                      transition(1);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs" htmlFor="project-name">First project name</Label>
                <Input
                  id="project-name"
                  value={state.projectName}
                  onChange={(e) =>
                    setState((prev) => ({
                      ...prev,
                      projectName: e.target.value,
                    }))
                  }
                  placeholder="My AI ChatBot"
                  className="h-11"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && state.orgName.trim() && state.projectName.trim())
                      transition(1);
                  }}
                />
                <p className="text-xs text-[#555555]">
                  Projects group your AI costs by application or team.
                </p>
              </div>
            </div>
            <div className="mt-8 flex justify-end">
              <Button
                onClick={() => transition(1)}
                disabled={!state.orgName.trim() || !state.projectName.trim()}
                className="gap-2"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Connect — SDK or manual */}
        {step === 1 && (
          <div>
            <h1 className="mt-8 text-2xl font-semibold tracking-tight text-white">
              Connect your AI provider
            </h1>
            <p className="mt-2 text-sm text-[#666666]">
              Choose how you&apos;d like to start tracking costs.
            </p>

            <div className="mt-8 space-y-3">
              {/* SDK option */}
              <button
                type="button"
                onClick={() => setState((prev) => ({ ...prev, method: "sdk" }))}
                className={cn(
                  "w-full rounded-xl p-5 text-left ring-1 transition-all duration-200",
                  state.method === "sdk"
                    ? "bg-emerald-500/[0.06] ring-emerald-500/[0.2]"
                    : "bg-white/[0.02] ring-white/[0.06] hover:bg-white/[0.04]",
                )}
              >
                <p className="text-sm font-medium text-white">
                  Add one line to your app
                </p>
                <p className="mt-1 text-xs text-[#888888]">
                  Our SDK auto-tracks every API call. Recommended for developers.
                </p>
              </button>

              {/* Manual option */}
              <button
                type="button"
                onClick={() => setState((prev) => ({ ...prev, method: "manual" }))}
                className={cn(
                  "w-full rounded-xl p-5 text-left ring-1 transition-all duration-200",
                  state.method === "manual"
                    ? "bg-blue-500/[0.06] ring-blue-500/[0.2]"
                    : "bg-white/[0.02] ring-white/[0.06] hover:bg-white/[0.04]",
                )}
              >
                <p className="text-sm font-medium text-white">
                  Connect manually
                </p>
                <p className="mt-1 text-xs text-[#888888]">
                  Paste your provider API key and we&apos;ll pull costs directly. No code needed.
                </p>
              </button>
            </div>

            {/* SDK flow: select provider, show code */}
            {state.method === "sdk" ? (
              <div className="mt-6">
                <p className="text-xs font-medium text-[#888888]">
                  Which provider are you using?
                </p>
                <div className="mt-3 flex gap-2">
                  {PROVIDERS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() =>
                        setState((prev) => ({ ...prev, selectedProvider: p.id }))
                      }
                      className={cn(
                        "flex-1 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ring-1",
                        state.selectedProvider === p.id
                          ? "text-white ring-2"
                          : "text-[#888888] ring-white/[0.06] hover:text-white",
                      )}
                      style={{
                        backgroundColor:
                          state.selectedProvider === p.id ? `${p.colour}15` : undefined,
                        borderColor:
                          state.selectedProvider === p.id ? `${p.colour}40` : undefined,
                        outlineColor:
                          state.selectedProvider === p.id ? `${p.colour}40` : undefined,
                      }}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>

                {state.selectedProvider ? (
                  <pre className="mt-4 overflow-x-auto rounded-xl bg-[#111111] p-4 ring-1 ring-white/[0.08]">
                    <code className="font-mono text-xs leading-relaxed text-[#AAAAAA]">
                      {getCodeSnippet(state.selectedProvider)}
                    </code>
                  </pre>
                ) : null}
              </div>
            ) : null}

            {/* Manual flow: paste API key */}
            {state.method === "manual" ? (
              <div className="mt-6 space-y-3">
                <div className="space-y-2">
                  <Label className="text-xs">Provider API key</Label>
                  <Input
                    value={state.apiKey}
                    onChange={(e) =>
                      setState((prev) => ({ ...prev, apiKey: e.target.value }))
                    }
                    placeholder="sk-..."
                    className="h-11 font-mono text-sm"
                  />
                </div>
                <p className="text-xs text-[#555555]">
                  We use this to read your usage data. We never make API calls on your behalf.
                </p>
              </div>
            ) : null}

            <div className="mt-8 flex justify-between">
              <Button variant="ghost" onClick={() => transition(0)} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={() => transition(2)}
                disabled={!state.method}
                className="gap-2"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Verify connection */}
        {step === 2 && (
          <div className="text-center">
            <div className="mx-auto mt-8 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
              <Check className="h-8 w-8 text-emerald-400" />
            </div>
            <h1 className="mt-6 text-2xl font-semibold tracking-tight text-white">
              ✓ First event received!
            </h1>
            <p className="mx-auto mt-3 max-w-sm text-sm text-[#888888]">
              We tracked <span className="text-white font-medium">147 prompt tokens</span> on{" "}
              <span className="text-white font-medium">gpt-4o</span>
            </p>
            <div className="mx-auto mt-6 max-w-sm rounded-xl bg-[#111111] p-5 ring-1 ring-white/[0.08]">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#888888]">Model</span>
                <span className="text-white font-mono">gpt-4o</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-[#888888]">Tokens</span>
                <span className="text-white">147 prompt + 52 completion</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-[#888888]">Cost</span>
                <span className="text-emerald-400 font-medium">$0.0012</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-[#888888]">Feature</span>
                <span className="text-white font-mono">my-ai-chatbot</span>
              </div>
            </div>
            <div className="mt-8 flex justify-between">
              <Button variant="ghost" onClick={() => transition(1)} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button onClick={() => transition(3)} className="gap-2">
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 3 && (
          <div className="text-center">
            <div className="mx-auto mt-8 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
              <Check className="h-8 w-8 text-emerald-400" />
            </div>
            <h1 className="mt-6 text-2xl font-semibold tracking-tight text-white">
              You&apos;re all set!
            </h1>
            <p className="mx-auto mt-3 max-w-sm text-sm text-[#888888]">
              Your workspace <span className="text-white">{state.orgName}</span> is ready.
              Head to your dashboard to see your first cost report.
            </p>

            {state.method === "sdk" ? (
              <div className="mx-auto mt-6 max-w-sm">
                <div className="rounded-xl bg-[#111111] p-4 ring-1 ring-white/[0.08]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[#888888]">
                      Your SDK Key
                    </span>
                    <Button variant="ghost" size="sm" onClick={handleCopyKey}>
                      {copied ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                  <code className="mt-1.5 block break-all font-mono text-xs text-white">
                    {MOCK_SDK_KEY}
                  </code>
                </div>
                <div className="mt-4 rounded-xl bg-blue-500/[0.06] p-4 ring-1 ring-blue-500/[0.2]">
                  <p className="text-xs font-medium text-white">
                    💡 Pro tip: Tag costs by feature
                  </p>
                  <p className="mt-1.5 text-xs text-[#888888]">
                    Use attribution to see which parts of your app cost the most. Perfect for optimising spend.
                  </p>
                </div>
              </div>
            ) : null}

            <div className="mt-8 flex flex-col gap-3">
              <Button
                className="w-full gap-2"
                onClick={() => router.push("/dashboard")}
              >
                Go to dashboard
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => transition(0)}
              >
                Add another project
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
