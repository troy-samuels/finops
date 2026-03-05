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
});
