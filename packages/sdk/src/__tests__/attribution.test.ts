// @ts-nocheck - Test mocks have loose typing
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProjectTracker } from "../client";

function mockJsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("Attribution", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("default attribution merges with per-call attribution", async () => {
    const fetchMock = vi.fn(async () => mockJsonResponse(200, { success: true }));
    vi.stubGlobal("fetch", fetchMock);

    const tracker = new ProjectTracker({
      apiKey: "pk_test",
      baseUrl: "https://example.supabase.co",
      autoDiscovery: false,
      flushIntervalMs: 60_000,
      defaultAttribution: {
        feature: "default-feature",
        environment: "production",
      },
    });

    tracker.trackLLM({
      provider: "openai",
      model: "gpt-4o",
      tokensPrompt: 10,
      tokensCompletion: 5,
      attribution: {
        userId: "user-123",
        workflow: "onboarding",
      },
    });

    await tracker.flush();

    const body = JSON.parse((fetchMock.mock.calls[0]![1] as unknown as RequestInit)!.body as string) as Array<{
      attribution?: {
        feature?: string;
        environment?: string;
        userId?: string;
        workflow?: string;
      };
    }>;

    expect(body[0]?.attribution).toEqual({
      feature: "default-feature",
      environment: "production",
      userId: "user-123",
      workflow: "onboarding",
    });

    await tracker.shutdown();
  });

  it("per-call attribution overrides defaults", async () => {
    const fetchMock = vi.fn(async () => mockJsonResponse(200, { success: true }));
    vi.stubGlobal("fetch", fetchMock);

    const tracker = new ProjectTracker({
      apiKey: "pk_test",
      baseUrl: "https://example.supabase.co",
      autoDiscovery: false,
      flushIntervalMs: 60_000,
      defaultAttribution: {
        feature: "default-feature",
        environment: "staging",
      },
    });

    tracker.trackLLM({
      provider: "openai",
      model: "gpt-4o",
      tokensPrompt: 10,
      tokensCompletion: 5,
      attribution: {
        feature: "override-feature",
        environment: "production",
      },
    });

    await tracker.flush();

    const body = JSON.parse((fetchMock.mock.calls[0]![1] as unknown as RequestInit)!.body as string) as Array<{
      attribution?: {
        feature?: string;
        environment?: string;
      };
    }>;

    expect(body[0]?.attribution?.feature).toBe("override-feature");
    expect(body[0]?.attribution?.environment).toBe("production");

    await tracker.shutdown();
  });

  it("attribution flows through to payload", async () => {
    const fetchMock = vi.fn(async () => mockJsonResponse(200, { success: true }));
    vi.stubGlobal("fetch", fetchMock);

    const tracker = new ProjectTracker({
      apiKey: "pk_test",
      baseUrl: "https://example.supabase.co",
      autoDiscovery: false,
      flushIntervalMs: 60_000,
    });

    tracker.trackLLM({
      provider: "anthropic",
      model: "claude-opus-4-5",
      tokensPrompt: 100,
      tokensCompletion: 50,
      attribution: {
        feature: "chat-assistant",
        workflow: "support-ticket",
        costCentre: "customer-success",
        userId: "user-456",
        environment: "production",
        tags: {
          team: "support",
          priority: "high",
        },
      },
    });

    await tracker.flush();

    const body = JSON.parse((fetchMock.mock.calls[0]![1] as unknown as RequestInit)!.body as string) as Array<{
      attribution?: {
        feature?: string;
        workflow?: string;
        costCentre?: string;
        userId?: string;
        environment?: string;
        tags?: Record<string, string>;
      };
    }>;

    expect(body[0]?.attribution).toEqual({
      feature: "chat-assistant",
      workflow: "support-ticket",
      costCentre: "customer-success",
      userId: "user-456",
      environment: "production",
      tags: {
        team: "support",
        priority: "high",
      },
    });

    await tracker.shutdown();
  });

  it("setAttribution updates runtime defaults", async () => {
    const fetchMock = vi.fn(async () => mockJsonResponse(200, { success: true }));
    vi.stubGlobal("fetch", fetchMock);

    const tracker = new ProjectTracker({
      apiKey: "pk_test",
      baseUrl: "https://example.supabase.co",
      autoDiscovery: false,
      flushIntervalMs: 60_000,
      defaultAttribution: {
        feature: "initial-feature",
      },
    });

    // Update default attribution
    tracker.setAttribution({
      feature: "updated-feature",
      environment: "staging",
    });

    tracker.trackLLM({
      provider: "openai",
      model: "gpt-4o",
      tokensPrompt: 10,
      tokensCompletion: 5,
    });

    await tracker.flush();

    const body = JSON.parse((fetchMock.mock.calls[0]![1] as unknown as RequestInit)!.body as string) as Array<{
      attribution?: {
        feature?: string;
        environment?: string;
      };
    }>;

    expect(body[0]?.attribution?.feature).toBe("updated-feature");
    expect(body[0]?.attribution?.environment).toBe("staging");

    await tracker.shutdown();
  });

  it("empty attribution is handled gracefully", async () => {
    const fetchMock = vi.fn(async () => mockJsonResponse(200, { success: true }));
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
      // No attribution
    });

    await tracker.flush();

    const body = JSON.parse((fetchMock.mock.calls[0]![1] as unknown as RequestInit)!.body as string) as Array<{
      attribution?: unknown;
    }>;

    // Should be undefined when no attribution is set
    expect(body[0]?.attribution).toBeUndefined();

    await tracker.shutdown();
  });

  it("undefined attribution is handled gracefully", async () => {
    const fetchMock = vi.fn(async () => mockJsonResponse(200, { success: true }));
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
      attribution: undefined,
    });

    await tracker.flush();

    const body = JSON.parse((fetchMock.mock.calls[0]![1] as unknown as RequestInit)!.body as string) as Array<{
      attribution?: unknown;
    }>;

    expect(body[0]?.attribution).toBeUndefined();

    await tracker.shutdown();
  });

  it("tags are merged correctly", async () => {
    const fetchMock = vi.fn(async () => mockJsonResponse(200, { success: true }));
    vi.stubGlobal("fetch", fetchMock);

    const tracker = new ProjectTracker({
      apiKey: "pk_test",
      baseUrl: "https://example.supabase.co",
      autoDiscovery: false,
      flushIntervalMs: 60_000,
      defaultAttribution: {
        tags: {
          defaultTag: "default-value",
          sharedTag: "default-shared",
        },
      },
    });

    tracker.trackLLM({
      provider: "openai",
      model: "gpt-4o",
      tokensPrompt: 10,
      tokensCompletion: 5,
      attribution: {
        tags: {
          callTag: "call-value",
          sharedTag: "override-shared",
        },
      },
    });

    await tracker.flush();

    const body = JSON.parse((fetchMock.mock.calls[0]![1] as unknown as RequestInit)!.body as string) as Array<{
      attribution?: {
        tags?: Record<string, string>;
      };
    }>;

    expect(body[0]?.attribution?.tags).toEqual({
      defaultTag: "default-value",
      callTag: "call-value",
      sharedTag: "override-shared",
    });

    await tracker.shutdown();
  });
});
