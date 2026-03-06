import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProjectTracker } from "../client";

function mockJsonResponse(status: number, body: unknown, headers?: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

describe("Retry Logic", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("429 respects Retry-After header", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockJsonResponse(429, { error: "rate limited" }, { "Retry-After": "2" }))
      .mockResolvedValueOnce(mockJsonResponse(200, { success: true }));

    vi.stubGlobal("fetch", fetchMock);

    const tracker = new ProjectTracker({
      apiKey: "pk_test",
      baseUrl: "https://example.supabase.co",
      autoDiscovery: false,
      flushIntervalMs: 60_000,
    });

    tracker.trackLLM({
      provider: "openai",
      model: "gpt-4o",
      tokensPrompt: 10,
      tokensCompletion: 5,
    });

    // First flush hits 429
    await tracker.flush();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Second flush should succeed
    await tracker.flush();
    expect(fetchMock).toHaveBeenCalledTimes(2);

    await tracker.shutdown();
  });

  it("5xx triggers exponential backoff", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockJsonResponse(503, { error: "service unavailable" }))
      .mockResolvedValueOnce(mockJsonResponse(200, { success: true }));

    vi.stubGlobal("fetch", fetchMock);

    const tracker = new ProjectTracker({
      apiKey: "pk_test",
      baseUrl: "https://example.supabase.co",
      autoDiscovery: false,
      flushIntervalMs: 60_000,
    });

    tracker.trackLLM({
      provider: "openai",
      model: "gpt-4o",
      tokensPrompt: 10,
      tokensCompletion: 5,
    });

    // First flush hits 503
    await tracker.flush();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Second flush should succeed
    await tracker.flush();
    expect(fetchMock).toHaveBeenCalledTimes(2);

    await tracker.shutdown();
  });

  it("max retries reached drops batch", async () => {
    const fetchMock = vi.fn(async () => mockJsonResponse(500, { error: "server error" }));
    vi.stubGlobal("fetch", fetchMock);

    const tracker = new ProjectTracker({
      apiKey: "pk_test",
      baseUrl: "https://example.supabase.co",
      autoDiscovery: false,
      flushIntervalMs: 60_000,
    });

    tracker.trackLLM({
      provider: "openai",
      model: "gpt-4o",
      tokensPrompt: 10,
      tokensCompletion: 5,
    });

    // Attempt flushes until max retries
    for (let i = 0; i < 7; i++) {
      await tracker.flush();
    }

    // Should have attempted 6 times (initial + 5 retries = 6), then dropped
    expect(fetchMock).toHaveBeenCalledTimes(6);

    await tracker.shutdown();
  });

  it("successful retry clears retry state", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockJsonResponse(500, { error: "server error" }))
      .mockResolvedValueOnce(mockJsonResponse(200, { success: true }));

    vi.stubGlobal("fetch", fetchMock);

    const tracker = new ProjectTracker({
      apiKey: "pk_test",
      baseUrl: "https://example.supabase.co",
      autoDiscovery: false,
      flushIntervalMs: 60_000,
    });

    // First batch
    tracker.trackLLM({
      provider: "openai",
      model: "gpt-4o",
      tokensPrompt: 10,
      tokensCompletion: 5,
    });

    await tracker.flush(); // Fails
    await tracker.flush(); // Succeeds

    // Second batch with identical content (should not share retry state)
    tracker.trackLLM({
      provider: "openai",
      model: "gpt-4o",
      tokensPrompt: 10,
      tokensCompletion: 5,
    });

    // Reset mock to succeed
    fetchMock.mockResolvedValueOnce(mockJsonResponse(200, { success: true }));

    await tracker.flush(); // Should succeed immediately (new batch, no retry state)
    
    expect(fetchMock).toHaveBeenCalledTimes(3);

    await tracker.shutdown();
  });

  it("429 without Retry-After uses backoff", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockJsonResponse(429, { error: "rate limited" }))
      .mockResolvedValueOnce(mockJsonResponse(200, { success: true }));

    vi.stubGlobal("fetch", fetchMock);

    const tracker = new ProjectTracker({
      apiKey: "pk_test",
      baseUrl: "https://example.supabase.co",
      autoDiscovery: false,
      flushIntervalMs: 60_000,
    });

    tracker.trackLLM({
      provider: "openai",
      model: "gpt-4o",
      tokensPrompt: 10,
      tokensCompletion: 5,
    });

    // First flush hits 429 without Retry-After
    await tracker.flush();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Second flush should succeed
    await tracker.flush();
    expect(fetchMock).toHaveBeenCalledTimes(2);

    await tracker.shutdown();
  });

  it("different batches track retry state independently", async () => {
    const fetchMock = vi.fn(async () => mockJsonResponse(500, { error: "server error" }));
    vi.stubGlobal("fetch", fetchMock);

    const tracker = new ProjectTracker({
      apiKey: "pk_test",
      baseUrl: "https://example.supabase.co",
      autoDiscovery: false,
      flushIntervalMs: 60_000,
    });

    // First batch
    tracker.trackLLM({
      provider: "openai",
      model: "gpt-4o",
      tokensPrompt: 10,
      tokensCompletion: 5,
    });

    await tracker.flush(); // Attempt 1 for batch 1

    // Second batch (different content)
    tracker.trackLLM({
      provider: "openai",
      model: "gpt-4o-mini",
      tokensPrompt: 20,
      tokensCompletion: 10,
    });

    await tracker.flush(); // Attempt 1 for batch 2
    await tracker.flush(); // Attempt 2 for batch 1
    await tracker.flush(); // Attempt 2 for batch 2

    // Both batches should be retrying independently
    expect(fetchMock).toHaveBeenCalledTimes(4);

    await tracker.shutdown();
  });

  it("4xx errors (non-429) do not retry", async () => {
    const fetchMock = vi.fn(async () => mockJsonResponse(400, { error: "bad request" }));
    vi.stubGlobal("fetch", fetchMock);

    const tracker = new ProjectTracker({
      apiKey: "pk_test",
      baseUrl: "https://example.supabase.co",
      autoDiscovery: false,
      flushIntervalMs: 60_000,
    });

    tracker.trackLLM({
      provider: "openai",
      model: "gpt-4o",
      tokensPrompt: 10,
      tokensCompletion: 5,
    });

    await tracker.flush();
    
    // Should only call once (no retry for 400)
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Additional flushes should not retry (batch was dropped)
    await tracker.flush();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await tracker.shutdown();
  });

  it("network errors re-enqueue without retry state", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce(mockJsonResponse(200, { success: true }));

    vi.stubGlobal("fetch", fetchMock);

    const tracker = new ProjectTracker({
      apiKey: "pk_test",
      baseUrl: "https://example.supabase.co",
      autoDiscovery: false,
      flushIntervalMs: 60_000,
    });

    tracker.trackLLM({
      provider: "openai",
      model: "gpt-4o",
      tokensPrompt: 10,
      tokensCompletion: 5,
    });

    // First flush throws network error
    await tracker.flush();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Second flush should succeed
    await tracker.flush();
    expect(fetchMock).toHaveBeenCalledTimes(2);

    await tracker.shutdown();
  });
});
