// ============================================================
// Auto-Discovery Scanner — detect providers from env var key names
// ============================================================
// SAFETY: Never reads env var values. Only matches key name prefixes.
// SAFETY: Wrapped in try/catch for browser environments where
//         process.env does not exist.
// SECURITY: Discovery results are LOCAL ONLY — never transmitted to server.
// ============================================================

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
 * Returns an array of detected provider names.
 * Pure function — results are stored locally and NEVER transmitted.
 */
export function scanEnvironment(): string[] {
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

  return Array.from(detected);
}
