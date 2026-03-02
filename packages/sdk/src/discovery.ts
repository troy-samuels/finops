// ============================================================
// Auto-Discovery Scanner — detect providers from env var key names
// ============================================================
// SAFETY: Never reads env var values. Only matches key name prefixes.
// SAFETY: Wrapped in try/catch for browser environments where
//         process.env does not exist.
// ============================================================

import type { DiscoveryPayload } from "./types";

/** Map from env-var prefix to canonical provider name. */
const PREFIX_MAP: ReadonlyArray<readonly [string, string]> = [
  ["OPENAI_", "openai"],
  ["ANTHROPIC_", "anthropic"],
  ["GOOGLE_AI_", "google-ai"],
  ["COHERE_", "cohere"],
  ["MISTRAL_", "mistral"],
  ["VERCEL_", "vercel"],
  ["STRIPE_", "stripe"],
  ["SUPABASE_", "supabase"],
  ["AWS_", "aws"],
  ["AZURE_", "azure"],
  ["CLOUDFLARE_", "cloudflare"],
  ["DATADOG_", "datadog"],
  ["SENTRY_", "sentry"],
] as const;

/**
 * Scan process.env key names against known prefixes.
 * Returns a DiscoveryPayload for each detected provider.
 * Pure function — does not enqueue, only returns payloads.
 */
export function scanEnvironment(): DiscoveryPayload[] {
  let envKeys: string[];
  try {
    if (typeof process === "undefined" || !process.env) {
      return [];
    }
    envKeys = Object.keys(process.env);
  } catch {
    return [];
  }

  const detected = new Set<string>();

  for (const key of envKeys) {
    for (const [prefix, provider] of PREFIX_MAP) {
      if (key.startsWith(prefix) && !detected.has(provider)) {
        detected.add(provider);
        break;
      }
    }
  }

  const payloads: DiscoveryPayload[] = [];
  for (const provider of detected) {
    payloads.push({
      type: "discovery",
      resource_type: "env_key",
      provider,
      status: "active",
      metadata: { detected_by: "sdk_auto_discovery" },
    });
  }

  return payloads;
}
