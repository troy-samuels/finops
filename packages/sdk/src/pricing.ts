// ============================================================
// Static Pricing Registry — per-token costs for major LLM providers
// ============================================================
// Prices are in USD per token. Last updated: March 2026.
// ============================================================

/** Per-token pricing for a single model. */
export interface ModelPricing {
  /** Provider name (e.g., "openai", "anthropic"). */
  provider: string;
  /** Model identifier. */
  model: string;
  /** Cost per prompt/input token in USD. */
  promptCostPerToken: number;
  /** Cost per completion/output token in USD. */
  completionCostPerToken: number;
}

/**
 * Static pricing registry for known models.
 *
 * Prices sourced from official provider pricing pages.
 * All values are USD per token.
 */
export const MODEL_PRICING: readonly ModelPricing[] = [
  // ---- OpenAI ----
  {
    provider: "openai",
    model: "gpt-4o",
    promptCostPerToken: 2.5 / 1_000_000,
    completionCostPerToken: 10.0 / 1_000_000,
  },
  {
    provider: "openai",
    model: "gpt-4o-mini",
    promptCostPerToken: 0.15 / 1_000_000,
    completionCostPerToken: 0.6 / 1_000_000,
  },
  {
    provider: "openai",
    model: "gpt-4-turbo",
    promptCostPerToken: 10.0 / 1_000_000,
    completionCostPerToken: 30.0 / 1_000_000,
  },
  {
    provider: "openai",
    model: "gpt-3.5-turbo",
    promptCostPerToken: 0.5 / 1_000_000,
    completionCostPerToken: 1.5 / 1_000_000,
  },
  {
    provider: "openai",
    model: "o1",
    promptCostPerToken: 15.0 / 1_000_000,
    completionCostPerToken: 60.0 / 1_000_000,
  },
  {
    provider: "openai",
    model: "o1-mini",
    promptCostPerToken: 3.0 / 1_000_000,
    completionCostPerToken: 12.0 / 1_000_000,
  },
  {
    provider: "openai",
    model: "o3-mini",
    promptCostPerToken: 1.1 / 1_000_000,
    completionCostPerToken: 4.4 / 1_000_000,
  },
  {
    provider: "openai",
    model: "gpt-4.1",
    promptCostPerToken: 2.0 / 1_000_000,
    completionCostPerToken: 8.0 / 1_000_000,
  },
  {
    provider: "openai",
    model: "gpt-4.1-mini",
    promptCostPerToken: 0.4 / 1_000_000,
    completionCostPerToken: 1.6 / 1_000_000,
  },
  {
    provider: "openai",
    model: "gpt-4.1-nano",
    promptCostPerToken: 0.1 / 1_000_000,
    completionCostPerToken: 0.4 / 1_000_000,
  },
  {
    provider: "openai",
    model: "o3",
    promptCostPerToken: 10.0 / 1_000_000,
    completionCostPerToken: 40.0 / 1_000_000,
  },
  {
    provider: "openai",
    model: "o4-mini",
    promptCostPerToken: 1.1 / 1_000_000,
    completionCostPerToken: 4.4 / 1_000_000,
  },

  // ---- Anthropic ----
  {
    provider: "anthropic",
    model: "claude-opus-4-5",
    promptCostPerToken: 15.0 / 1_000_000,
    completionCostPerToken: 75.0 / 1_000_000,
  },
  {
    provider: "anthropic",
    model: "claude-opus-4-6",
    promptCostPerToken: 15.0 / 1_000_000,
    completionCostPerToken: 75.0 / 1_000_000,
  },
  {
    provider: "anthropic",
    model: "claude-sonnet-4-5",
    promptCostPerToken: 3.0 / 1_000_000,
    completionCostPerToken: 15.0 / 1_000_000,
  },
  {
    provider: "anthropic",
    model: "claude-3-5-haiku",
    promptCostPerToken: 0.8 / 1_000_000,
    completionCostPerToken: 4.0 / 1_000_000,
  },
  {
    provider: "anthropic",
    model: "claude-sonnet-4-0",
    promptCostPerToken: 3.0 / 1_000_000,
    completionCostPerToken: 15.0 / 1_000_000,
  },

  // ---- Google ----
  {
    provider: "google",
    model: "gemini-2.0-flash",
    promptCostPerToken: 0.1 / 1_000_000,
    completionCostPerToken: 0.4 / 1_000_000,
  },
  {
    provider: "google",
    model: "gemini-2.5-pro",
    promptCostPerToken: 1.25 / 1_000_000,
    completionCostPerToken: 10.0 / 1_000_000,
  },
  {
    provider: "google",
    model: "gemini-2.5-flash",
    promptCostPerToken: 0.15 / 1_000_000,
    completionCostPerToken: 0.6 / 1_000_000,
  },
  {
    provider: "google",
    model: "gemini-1.5-pro",
    promptCostPerToken: 1.25 / 1_000_000,
    completionCostPerToken: 5.0 / 1_000_000,
  },
  {
    provider: "google",
    model: "gemini-1.5-flash",
    promptCostPerToken: 0.075 / 1_000_000,
    completionCostPerToken: 0.3 / 1_000_000,
  },

  // ---- Cohere ----
  {
    provider: "cohere",
    model: "command-r-plus",
    promptCostPerToken: 2.5 / 1_000_000,
    completionCostPerToken: 10.0 / 1_000_000,
  },
  {
    provider: "cohere",
    model: "command-r",
    promptCostPerToken: 0.15 / 1_000_000,
    completionCostPerToken: 0.6 / 1_000_000,
  },

  // ---- Mistral ----
  {
    provider: "mistral",
    model: "mistral-large",
    promptCostPerToken: 2.0 / 1_000_000,
    completionCostPerToken: 6.0 / 1_000_000,
  },
  {
    provider: "mistral",
    model: "mistral-medium",
    promptCostPerToken: 2.7 / 1_000_000,
    completionCostPerToken: 8.1 / 1_000_000,
  },
  {
    provider: "mistral",
    model: "mistral-small",
    promptCostPerToken: 0.2 / 1_000_000,
    completionCostPerToken: 0.6 / 1_000_000,
  },
] as const;

/** Lookup map for O(1) access: "provider::model" → ModelPricing */
const pricingMap = new Map<string, ModelPricing>();
for (const entry of MODEL_PRICING) {
  pricingMap.set(`${entry.provider}::${entry.model}`, entry);
}

/**
 * Look up a model's pricing entry.
 *
 * @returns The ModelPricing entry, or undefined if the model is not in the registry.
 */
export function getModelPricing(
  provider: string,
  model: string,
): ModelPricing | undefined {
  return pricingMap.get(`${provider}::${model}`);
}

/**
 * Calculate the USD cost for a given number of prompt and completion tokens.
 *
 * @param provider         Provider name (e.g., "openai")
 * @param model            Model identifier (e.g., "gpt-4o")
 * @param promptTokens     Number of input/prompt tokens
 * @param completionTokens Number of output/completion tokens
 * @returns                Cost in USD, or undefined if the model is not in the registry
 */
export function getCostForTokens(
  provider: string,
  model: string,
  promptTokens: number,
  completionTokens: number,
): number | undefined {
  const pricing = pricingMap.get(`${provider}::${model}`);
  if (!pricing) {
    return undefined;
  }
  return (
    promptTokens * pricing.promptCostPerToken +
    completionTokens * pricing.completionCostPerToken
  );
}
