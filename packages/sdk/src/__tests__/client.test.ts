import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProjectTracker } from "../client";

function mockJsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("ProjectTracker", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("adds identity metadata and request headers during flush", async () => {
    const fetchMock = vi.fn(async () => mockJsonResponse(200, { success: true }));
    vi.stubGlobal("fetch", fetchMock);

    const tracker = new ProjectTracker({
      apiKey: "pk_live_test",
      baseUrl: "https://example.supabase.co",
      autoDiscovery: false,
      flushIntervalMs: 60_000,
    });

    tracker.trackLLM({
      provider: "openai",
      model: "gpt-4o",
      tokensPrompt: 100,
      tokensCompletion: 40,
    });

    await tracker.flush();

    expect(fetchMock).toHaveBeenCalledTimes(1);

    const firstCall = fetchMock.mock.calls[0];
    expect(firstCall).toBeDefined();
    const [url, init] = firstCall as unknown as [string, RequestInit];
    expect(url).toBe("https://example.supabase.co/functions/v1/track-event");
    expect(init.headers).toMatchObject({
      "Content-Type": "application/json",
      "x-api-key": "pk_live_test",
    });

    const headers = init.headers as Record<string, string>;
    expect(headers["x-request-id"]).toMatch(/^batch_/);
    expect(typeof headers["x-request-timestamp"]).toBe("string");

    const parsedBody = JSON.parse(init.body as string) as Array<{
      request_id?: string;
      sent_at?: string;
    }>;
    expect(parsedBody.length).toBe(1);
    expect(parsedBody[0]?.request_id).toBeTypeOf("string");
    expect(parsedBody[0]?.sent_at).toBeTypeOf("string");

    await tracker.shutdown();
  });

  it("re-enqueues events on server errors", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(async () => mockJsonResponse(500, { error: "boom" }))
      .mockImplementationOnce(async () => mockJsonResponse(200, { success: true }));

    vi.stubGlobal("fetch", fetchMock);

    const tracker = new ProjectTracker({
      apiKey: "pk_live_test",
      baseUrl: "https://example.supabase.co",
      autoDiscovery: false,
      flushIntervalMs: 60_000,
    });

    tracker.trackAPI({
      provider: "anthropic",
      endpoint: "/v1/messages",
      tokensPrompt: 12,
      tokensCompletion: 8,
    });

    await tracker.flush();
    await tracker.flush();

    expect(fetchMock).toHaveBeenCalledTimes(2);

    await tracker.shutdown();
  });

  it("runs in no-op mode when required config is missing", async () => {
    const fetchMock = vi.fn(async () => mockJsonResponse(200, { success: true }));
    vi.stubGlobal("fetch", fetchMock);

    const tracker = new ProjectTracker({
      apiKey: "",
      baseUrl: "",
      autoDiscovery: false,
      flushIntervalMs: 60_000,
    });

    tracker.trackLLM({
      provider: "openai",
      model: "gpt-4o-mini",
      tokensPrompt: 1,
      tokensCompletion: 1,
    });

    await tracker.flush();

    expect(fetchMock).not.toHaveBeenCalled();

    await tracker.shutdown();
  });

  it("discovery is local-only and never transmitted", async () => {
    const fetchMock = vi.fn(async () => mockJsonResponse(200, { success: true }));
    vi.stubGlobal("fetch", fetchMock);

    // Mock process.env with some known provider keys
    const originalEnv = process.env;
    process.env = {
      ...originalEnv,
      OPENAI_API_KEY: "test",
      ANTHROPIC_API_KEY: "test",
    };

    const tracker = new ProjectTracker({
      apiKey: "pk_live_test",
      baseUrl: "https://example.supabase.co",
      autoDiscovery: true,
      flushIntervalMs: 60_000,
    });

    // Discovery should be stored locally
    const discovered = tracker.getDiscoveredProviders();
    expect(discovered).toContain("openai");
    expect(discovered).toContain("anthropic");

    // Flush immediately — should be empty (no discovery payloads enqueued)
    await tracker.flush();

    expect(fetchMock).not.toHaveBeenCalled();

    // Track a regular event to ensure the queue works
    tracker.trackLLM({
      provider: "openai",
      model: "gpt-4o",
      tokensPrompt: 10,
      tokensCompletion: 5,
    });

    await tracker.flush();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const firstCall = fetchMock.mock.calls[0];
    expect(firstCall).toBeDefined();
    const [, init] = firstCall as unknown as [string, RequestInit];
    const body = JSON.parse(init.body as string) as Array<{ type: string }>;
    
    // Should only have telemetry, not discovery
    expect(body.length).toBe(1);
    expect(body[0]?.type).toBe("telemetry");

    // Restore env
    process.env = originalEnv;
    await tracker.shutdown();
  });

  it("trackingMode 'cost-only' strips metadata and tokens", async () => {
    const fetchMock = vi.fn(async () => mockJsonResponse(200, { success: true }));
    vi.stubGlobal("fetch", fetchMock);

    const tracker = new ProjectTracker({
      apiKey: "pk_live_test",
      baseUrl: "https://example.supabase.co",
      autoDiscovery: false,
      flushIntervalMs: 60_000,
      trackingMode: "cost-only",
    });

    tracker.trackLLM({
      provider: "openai",
      model: "gpt-4o",
      tokensPrompt: 100,
      tokensCompletion: 50,
      metadata: { user: "test-user", session: "abc123" },
    });

    await tracker.flush();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const firstCall = fetchMock.mock.calls[0];
    expect(firstCall).toBeDefined();
    const [, init] = firstCall as unknown as [string, RequestInit];
    const body = JSON.parse(init.body as string) as Array<{
      tokens_prompt: number;
      tokens_completion: number;
      metadata?: unknown;
    }>;

    expect(body.length).toBe(1);
    expect(body[0]?.tokens_prompt).toBe(0);
    expect(body[0]?.tokens_completion).toBe(0);
    expect(body[0]?.metadata).toBeUndefined();

    await tracker.shutdown();
  });

  it("trackingMode 'tokens-only' strips metadata but keeps tokens", async () => {
    const fetchMock = vi.fn(async () => mockJsonResponse(200, { success: true }));
    vi.stubGlobal("fetch", fetchMock);

    const tracker = new ProjectTracker({
      apiKey: "pk_live_test",
      baseUrl: "https://example.supabase.co",
      autoDiscovery: false,
      flushIntervalMs: 60_000,
      trackingMode: "tokens-only",
    });

    tracker.trackLLM({
      provider: "openai",
      model: "gpt-4o",
      tokensPrompt: 100,
      tokensCompletion: 50,
      metadata: { user: "test-user", session: "abc123" },
    });

    await tracker.flush();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const firstCall = fetchMock.mock.calls[0];
    expect(firstCall).toBeDefined();
    const [, init] = firstCall as unknown as [string, RequestInit];
    const body = JSON.parse(init.body as string) as Array<{
      tokens_prompt: number;
      tokens_completion: number;
      metadata?: unknown;
    }>;

    expect(body.length).toBe(1);
    expect(body[0]?.tokens_prompt).toBe(100);
    expect(body[0]?.tokens_completion).toBe(50);
    expect(body[0]?.metadata).toBeUndefined();

    await tracker.shutdown();
  });

  it("trackingMode 'full' sends all data unchanged", async () => {
    const fetchMock = vi.fn(async () => mockJsonResponse(200, { success: true }));
    vi.stubGlobal("fetch", fetchMock);

    const tracker = new ProjectTracker({
      apiKey: "pk_live_test",
      baseUrl: "https://example.supabase.co",
      autoDiscovery: false,
      flushIntervalMs: 60_000,
      trackingMode: "full",
    });

    tracker.trackLLM({
      provider: "openai",
      model: "gpt-4o",
      tokensPrompt: 100,
      tokensCompletion: 50,
      metadata: { user: "test-user", session: "abc123" },
    });

    await tracker.flush();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const firstCall = fetchMock.mock.calls[0];
    expect(firstCall).toBeDefined();
    const [, init] = firstCall as unknown as [string, RequestInit];
    const body = JSON.parse(init.body as string) as Array<{
      tokens_prompt: number;
      tokens_completion: number;
      metadata?: Record<string, unknown>;
    }>;

    expect(body.length).toBe(1);
    expect(body[0]?.tokens_prompt).toBe(100);
    expect(body[0]?.tokens_completion).toBe(50);
    expect(body[0]?.metadata).toEqual({ user: "test-user", session: "abc123" });

    await tracker.shutdown();
  });
});
