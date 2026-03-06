import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProjectTracker } from "../client";
import type { BudgetAlert } from "../types";

function mockJsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("Budget Tracking", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("hourly alert fires at 80%", async () => {
    const fetchMock = vi.fn(async () => mockJsonResponse(200, { success: true }));
    vi.stubGlobal("fetch", fetchMock);

    const onBudgetAlert = vi.fn();
    const tracker = new ProjectTracker({
      apiKey: "pk_test",
      baseUrl: "https://example.supabase.co",
      autoDiscovery: false,
      flushIntervalMs: 60_000,
      budgetConfig: {
        hourlyLimitUsd: 10,
        onBudgetAlert,
      },
    });

    // Track $8 (80% of $10 limit) - gpt-4o: $2.5/M input, $10/M output
    tracker.trackLLM({
      provider: "openai",
      model: "gpt-4o",
      tokensPrompt: 320_000, // $0.8
      tokensCompletion: 720_000, // $7.2
      // Total: $8
    });

    expect(onBudgetAlert).toHaveBeenCalledTimes(1);
    const alert: BudgetAlert = onBudgetAlert.mock.calls[0]![0] as BudgetAlert;
    expect(alert.type).toBe("hourly");
    expect(alert.limitUsd).toBe(10);
    expect(alert.currentUsd).toBeCloseTo(8, 2);
    expect(alert.percentUsed).toBeCloseTo(80, 1);

    await tracker.shutdown();
  });

  it("exceeded callback fires at 100%", async () => {
    const fetchMock = vi.fn(async () => mockJsonResponse(200, { success: true }));
    vi.stubGlobal("fetch", fetchMock);

    const onBudgetExceeded = vi.fn();
    const tracker = new ProjectTracker({
      apiKey: "pk_test",
      baseUrl: "https://example.supabase.co",
      autoDiscovery: false,
      flushIntervalMs: 60_000,
      budgetConfig: {
        hourlyLimitUsd: 5,
        onBudgetExceeded,
      },
    });

    // Track $5 (100% of $5 limit)
    tracker.trackLLM({
      provider: "openai",
      model: "gpt-4o",
      tokensPrompt: 200_000, // $0.5
      tokensCompletion: 450_000, // $4.5
      // Total: $5
    });

    expect(onBudgetExceeded).toHaveBeenCalledTimes(1);
    const alert: BudgetAlert = onBudgetExceeded.mock.calls[0]![0] as BudgetAlert;
    expect(alert.type).toBe("hourly");
    expect(alert.limitUsd).toBe(5);
    expect(alert.currentUsd).toBeCloseTo(5, 2);
    expect(alert.percentUsed).toBeCloseTo(100, 1);

    await tracker.shutdown();
  });

  it("daily budget works independently from hourly", async () => {
    const fetchMock = vi.fn(async () => mockJsonResponse(200, { success: true }));
    vi.stubGlobal("fetch", fetchMock);

    const onBudgetAlert = vi.fn();
    const tracker = new ProjectTracker({
      apiKey: "pk_test",
      baseUrl: "https://example.supabase.co",
      autoDiscovery: false,
      flushIntervalMs: 60_000,
      budgetConfig: {
        dailyLimitUsd: 100,
        onBudgetAlert,
      },
    });

    // Track $80 (80% of $100 daily limit)
    tracker.trackLLM({
      provider: "openai",
      model: "gpt-4o",
      tokensPrompt: 3_200_000, // $8
      tokensCompletion: 7_200_000, // $72
      // Total: $80
    });

    expect(onBudgetAlert).toHaveBeenCalledTimes(1);
    const alert: BudgetAlert = onBudgetAlert.mock.calls[0]![0] as BudgetAlert;
    expect(alert.type).toBe("daily");
    expect(alert.limitUsd).toBe(100);
    expect(alert.currentUsd).toBeCloseTo(80, 2);

    await tracker.shutdown();
  });

  it("no callbacks when no budget configured", async () => {
    const fetchMock = vi.fn(async () => mockJsonResponse(200, { success: true }));
    vi.stubGlobal("fetch", fetchMock);

    const tracker = new ProjectTracker({
      apiKey: "pk_test",
      baseUrl: "https://example.supabase.co",
      autoDiscovery: false,
      flushIntervalMs: 60_000,
      // No budgetConfig
    });

    // Track a large amount
    tracker.trackLLM({
      provider: "openai",
      model: "gpt-4o",
      tokensPrompt: 1_000_000,
      tokensCompletion: 1_000_000,
    });

    // Should not throw or cause issues
    await tracker.flush();

    await tracker.shutdown();
  });

  it("multiple alerts don't re-fire for same window", async () => {
    const fetchMock = vi.fn(async () => mockJsonResponse(200, { success: true }));
    vi.stubGlobal("fetch", fetchMock);

    const onBudgetAlert = vi.fn();
    const onBudgetExceeded = vi.fn();
    const tracker = new ProjectTracker({
      apiKey: "pk_test",
      baseUrl: "https://example.supabase.co",
      autoDiscovery: false,
      flushIntervalMs: 60_000,
      budgetConfig: {
        hourlyLimitUsd: 10,
        onBudgetAlert,
        onBudgetExceeded,
      },
    });

    // Track $8 (80%)
    tracker.trackLLM({
      provider: "openai",
      model: "gpt-4o",
      tokensPrompt: 320_000,
      tokensCompletion: 720_000,
    });

    expect(onBudgetAlert).toHaveBeenCalledTimes(1);
    expect(onBudgetExceeded).not.toHaveBeenCalled();

    // Track another $1 (90% total, still under 100%)
    tracker.trackLLM({
      provider: "openai",
      model: "gpt-4o",
      tokensPrompt: 40_000,
      tokensCompletion: 90_000,
    });

    // Alert should not fire again
    expect(onBudgetAlert).toHaveBeenCalledTimes(1);
    expect(onBudgetExceeded).not.toHaveBeenCalled();

    // Track another $1.5 (reaching 101.5%)
    tracker.trackLLM({
      provider: "openai",
      model: "gpt-4o",
      tokensPrompt: 60_000,
      tokensCompletion: 135_000,
    });

    // Exceeded should fire once
    expect(onBudgetAlert).toHaveBeenCalledTimes(1);
    expect(onBudgetExceeded).toHaveBeenCalledTimes(1);

    // Track more
    tracker.trackLLM({
      provider: "openai",
      model: "gpt-4o",
      tokensPrompt: 100_000,
      tokensCompletion: 200_000,
    });

    // Neither should fire again
    expect(onBudgetAlert).toHaveBeenCalledTimes(1);
    expect(onBudgetExceeded).toHaveBeenCalledTimes(1);

    await tracker.shutdown();
  });

  it("budget does not block tracking", async () => {
    const fetchMock = vi.fn(async () => mockJsonResponse(200, { success: true }));
    vi.stubGlobal("fetch", fetchMock);

    const onBudgetExceeded = vi.fn();
    const tracker = new ProjectTracker({
      apiKey: "pk_test",
      baseUrl: "https://example.supabase.co",
      autoDiscovery: false,
      flushIntervalMs: 60_000,
      budgetConfig: {
        hourlyLimitUsd: 1,
        onBudgetExceeded,
      },
    });

    // Track way over budget
    tracker.trackLLM({
      provider: "openai",
      model: "gpt-4o",
      tokensPrompt: 1_000_000,
      tokensCompletion: 1_000_000,
    });

    expect(onBudgetExceeded).toHaveBeenCalled();

    // Should still flush and send data
    await tracker.flush();
    expect(fetchMock).toHaveBeenCalled();

    await tracker.shutdown();
  });

  it("cumulative spend tracks across multiple calls", async () => {
    const fetchMock = vi.fn(async () => mockJsonResponse(200, { success: true }));
    vi.stubGlobal("fetch", fetchMock);

    const onBudgetAlert = vi.fn();
    const tracker = new ProjectTracker({
      apiKey: "pk_test",
      baseUrl: "https://example.supabase.co",
      autoDiscovery: false,
      flushIntervalMs: 60_000,
      budgetConfig: {
        hourlyLimitUsd: 10,
        onBudgetAlert,
      },
    });

    // Track $4 first
    tracker.trackLLM({
      provider: "openai",
      model: "gpt-4o",
      tokensPrompt: 160_000,
      tokensCompletion: 360_000,
    });

    expect(onBudgetAlert).not.toHaveBeenCalled();

    // Track another $4 (total $8 = 80%)
    tracker.trackLLM({
      provider: "openai",
      model: "gpt-4o",
      tokensPrompt: 160_000,
      tokensCompletion: 360_000,
    });

    expect(onBudgetAlert).toHaveBeenCalledTimes(1);

    await tracker.shutdown();
  });
});
