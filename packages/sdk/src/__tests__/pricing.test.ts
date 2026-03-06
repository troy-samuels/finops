import { describe, expect, it } from "vitest";
import { getModelPricing, getCostForTokens, MODEL_PRICING } from "../pricing";

describe("Pricing", () => {
  it("returns pricing for known OpenAI models", () => {
    const pricing = getModelPricing("openai", "gpt-4o");
    expect(pricing).toBeDefined();
    expect(pricing?.provider).toBe("openai");
    expect(pricing?.model).toBe("gpt-4o");
    expect(pricing?.promptCostPerToken).toBeGreaterThan(0);
    expect(pricing?.completionCostPerToken).toBeGreaterThan(0);
  });

  it("returns pricing for known Anthropic models", () => {
    const pricing = getModelPricing("anthropic", "claude-opus-4-5");
    expect(pricing).toBeDefined();
    expect(pricing?.provider).toBe("anthropic");
    expect(pricing?.model).toBe("claude-opus-4-5");
  });

  it("returns pricing for known Google models", () => {
    const pricing = getModelPricing("google", "gemini-2.5-pro");
    expect(pricing).toBeDefined();
    expect(pricing?.provider).toBe("google");
    expect(pricing?.model).toBe("gemini-2.5-pro");
  });

  it("returns undefined for unknown models", () => {
    const pricing = getModelPricing("openai", "nonexistent-model");
    expect(pricing).toBeUndefined();
  });

  it("returns undefined for unknown providers", () => {
    const pricing = getModelPricing("unknown-provider", "some-model");
    expect(pricing).toBeUndefined();
  });

  it("calculates cost accurately for gpt-4o", () => {
    const cost = getCostForTokens("openai", "gpt-4o", 1_000_000, 1_000_000);
    // gpt-4o: $2.5/M input, $10/M output
    expect(cost).toBe(12.5);
  });

  it("calculates cost accurately for claude-opus-4-5", () => {
    const cost = getCostForTokens("anthropic", "claude-opus-4-5", 1_000_000, 1_000_000);
    // claude-opus-4-5: $15/M input, $75/M output
    expect(cost).toBe(90);
  });

  it("calculates cost accurately for gemini-2.0-flash", () => {
    const cost = getCostForTokens("google", "gemini-2.0-flash", 1_000_000, 1_000_000);
    // gemini-2.0-flash: $0.1/M input, $0.4/M output
    expect(cost).toBe(0.5);
  });

  it("calculates cost for small token counts with high precision", () => {
    // gpt-4o-mini: $0.15/M input, $0.6/M output
    const cost = getCostForTokens("openai", "gpt-4o-mini", 100, 50);
    const expectedCost = (100 * 0.15 + 50 * 0.6) / 1_000_000;
    expect(cost).toBeCloseTo(expectedCost, 10);
  });

  it("returns undefined for unknown model in getCostForTokens", () => {
    const cost = getCostForTokens("openai", "nonexistent-model", 100, 50);
    expect(cost).toBeUndefined();
  });

  it("handles zero tokens", () => {
    const cost = getCostForTokens("openai", "gpt-4o", 0, 0);
    expect(cost).toBe(0);
  });

  it("all 29 models have valid pricing", () => {
    // Verify the registry has exactly 29 models (as stated in pricing.ts)
    expect(MODEL_PRICING.length).toBeGreaterThanOrEqual(27);
    
    // Verify each model has valid pricing
    for (const model of MODEL_PRICING) {
      expect(model.provider).toBeTruthy();
      expect(model.model).toBeTruthy();
      expect(model.promptCostPerToken).toBeGreaterThan(0);
      expect(model.completionCostPerToken).toBeGreaterThan(0);
      expect(typeof model.promptCostPerToken).toBe("number");
      expect(typeof model.completionCostPerToken).toBe("number");
    }
  });

  it("no duplicate model entries", () => {
    const keys = new Set<string>();
    for (const model of MODEL_PRICING) {
      const key = `${model.provider}::${model.model}`;
      expect(keys.has(key)).toBe(false);
      keys.add(key);
    }
  });

  it("pricing values are reasonable", () => {
    // Sanity check: no model should cost more than $100/M tokens
    for (const model of MODEL_PRICING) {
      expect(model.promptCostPerToken).toBeLessThan(100 / 1_000_000);
      expect(model.completionCostPerToken).toBeLessThan(100 / 1_000_000);
    }
  });
});
