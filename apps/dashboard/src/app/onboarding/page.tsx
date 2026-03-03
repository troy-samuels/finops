"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, AlertTriangle, Terminal, Cloud, Cpu, Braces } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OnboardingProgress } from "@/components/onboarding-progress";
import { cn } from "@/lib/utils";

type ProviderId = "openai" | "anthropic" | "google" | "other";

interface OnboardingState {
  orgName: string;
  projectName: string;
  projectDescription: string;
  selectedProvider: ProviderId | null;
}

const MOCK_API_KEY = "pk_live_a8f3b2c1d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9";

const PROVIDERS: { id: ProviderId; name: string; icon: typeof Terminal }[] = [
  { id: "openai", name: "OpenAI", icon: Cpu },
  { id: "anthropic", name: "Anthropic", icon: Cloud },
  { id: "google", name: "Google AI", icon: Braces },
  { id: "other", name: "Other", icon: Terminal },
];

function getCodeSnippet(provider: ProviderId): string {
  const base = `import { ProjectTracker } from '@finops/sdk'

const tracker = new ProjectTracker({
  apiKey: '${MOCK_API_KEY}'
})`;

  const wrappers: Record<ProviderId, string> = {
    openai: `${base}

// Auto-tracks every OpenAI call
const openai = tracker.wrapOpenAI(new OpenAI())`,
    anthropic: `${base}

// Track Anthropic calls manually
tracker.trackLLM({
  provider: 'anthropic',
  model: 'claude-3-5-sonnet',
  tokensPrompt: usage.input_tokens,
  tokensCompletion: usage.output_tokens,
})`,
    google: `${base}

// Track Google AI calls manually
tracker.trackLLM({
  provider: 'google',
  model: 'gemini-pro',
  tokensPrompt: usage.promptTokenCount,
  tokensCompletion: usage.candidatesTokenCount,
})`,
    other: `${base}

// Track any API call
tracker.trackAPI({
  provider: 'my-service',
  endpoint: '/api/v1/generate',
  cost: 0.002,
})`,
  };

  return wrappers[provider];
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [state, setState] = useState<OnboardingState>({
    orgName: "Troy's Studio",
    projectName: "",
    projectDescription: "",
    selectedProvider: null,
  });

  const transition = useCallback((nextStep: number) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setStep(nextStep);
      setIsTransitioning(false);
    }, 150);
  }, []);

  function handleCopyKey() {
    void navigator.clipboard.writeText(MOCK_API_KEY);
    setCopied(true);
    toast.success("API key copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="w-full max-w-lg">
      <div
        className="rounded-xl bg-white/[0.02] p-8 ring-1 ring-white/[0.05] shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-150"
        style={{
          opacity: isTransitioning ? 0 : 1,
          transform: isTransitioning ? "translateY(8px)" : "translateY(0)",
        }}
      >
        <OnboardingProgress currentStep={step} totalSteps={4} />

        {/* Step 1: Name workspace */}
        {step === 0 && (
          <div>
            <h1 className="mt-6 text-2xl font-semibold tracking-tight text-white">
              Name your workspace
            </h1>
            <p className="mt-2 text-sm text-[#666666]">
              This is the name of your organization in FinOps.
            </p>
            <div className="mt-6 space-y-2">
              <Label htmlFor="org-name">Organization name</Label>
              <Input
                id="org-name"
                value={state.orgName}
                onChange={(e) =>
                  setState((prev) => ({ ...prev, orgName: e.target.value }))
                }
                placeholder="Acme Inc."
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && state.orgName.trim())
                    transition(1);
                }}
              />
            </div>
            <div className="mt-8 flex justify-end">
              <Button
                onClick={() => transition(1)}
                disabled={!state.orgName.trim()}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Create project */}
        {step === 1 && (
          <div>
            <h1 className="mt-6 text-2xl font-semibold tracking-tight text-white">
              Create your first project
            </h1>
            <p className="mt-2 text-sm text-[#666666]">
              Projects organize events and costs by application.
            </p>
            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="project-name">Project name</Label>
                <Input
                  id="project-name"
                  value={state.projectName}
                  onChange={(e) =>
                    setState((prev) => ({
                      ...prev,
                      projectName: e.target.value,
                    }))
                  }
                  placeholder="My ChatBot"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && state.projectName.trim())
                      transition(2);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-desc">
                  Description{" "}
                  <span className="text-[#555555]">(optional)</span>
                </Label>
                <Input
                  id="project-desc"
                  value={state.projectDescription}
                  onChange={(e) =>
                    setState((prev) => ({
                      ...prev,
                      projectDescription: e.target.value,
                    }))
                  }
                  placeholder="AI-powered customer support bot"
                />
              </div>
            </div>
            <div className="mt-8 flex justify-between">
              <Button variant="ghost" onClick={() => transition(0)}>
                Back
              </Button>
              <Button
                onClick={() => transition(2)}
                disabled={!state.projectName.trim()}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Connect integration */}
        {step === 2 && (
          <div>
            <h1 className="mt-6 text-2xl font-semibold tracking-tight text-white">
              Connect your first integration
            </h1>
            <p className="mt-2 text-sm text-[#666666]">
              Select your AI provider to get a tailored code snippet.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              {PROVIDERS.map((provider) => (
                <button
                  key={provider.id}
                  type="button"
                  onClick={() =>
                    setState((prev) => ({
                      ...prev,
                      selectedProvider: provider.id,
                    }))
                  }
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-xl p-4 text-sm transition-all",
                    state.selectedProvider === provider.id
                      ? "bg-white/[0.06] text-white ring-2 ring-white/[0.2]"
                      : "bg-white/[0.02] text-[#888888] ring-1 ring-white/[0.05] hover:bg-white/[0.04]",
                  )}
                >
                  <provider.icon className="h-6 w-6" />
                  <span className="font-medium">{provider.name}</span>
                </button>
              ))}
            </div>

            {/* API Key */}
            <div className="mt-6 rounded-lg bg-[#111111] p-4 ring-1 ring-white/[0.08]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#888888]">
                  Your API Key
                </span>
                <Button variant="ghost" size="sm" onClick={handleCopyKey}>
                  {copied ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
              <code className="mt-2 block break-all font-mono text-sm text-white">
                {MOCK_API_KEY}
              </code>
              <p className="mt-3 flex items-center gap-1.5 text-xs text-amber-400/80">
                <AlertTriangle className="h-3 w-3" />
                Save this key now — you won&apos;t be able to see it again.
              </p>
            </div>

            {/* Code snippet */}
            <pre className="mt-4 overflow-x-auto rounded-lg bg-[#111111] p-4 ring-1 ring-white/[0.08]">
              <code className="font-mono text-xs leading-relaxed text-[#AAAAAA]">
                {getCodeSnippet(state.selectedProvider ?? "openai")}
              </code>
            </pre>

            <div className="mt-8 flex justify-between">
              <Button variant="ghost" onClick={() => transition(1)}>
                Back
              </Button>
              <Button onClick={() => transition(3)}>Continue</Button>
            </div>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 3 && (
          <div className="text-center">
            <div className="mx-auto mt-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-400/10">
              <Check className="h-8 w-8 text-emerald-400" />
            </div>
            <h1 className="mt-6 text-2xl font-semibold tracking-tight text-white">
              You&apos;re all set!
            </h1>
            <p className="mt-2 text-sm text-[#666666]">
              Your workspace is ready. Start tracking costs from your dashboard.
            </p>
            <div className="mt-8 flex flex-col gap-3">
              <Button
                className="w-full"
                onClick={() => router.push("/dashboard")}
              >
                Go to dashboard
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => transition(1)}
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
