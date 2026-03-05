import { describe, expect, it, vi } from "vitest";
import { wrapAsyncIterable } from "../wrap-stream";

describe("wrapAsyncIterable", () => {
  it("yields all chunks unchanged", async () => {
    const chunks = [1, 2, 3, 4, 5];
    async function* source() {
      for (const chunk of chunks) {
        yield chunk;
      }
    }

    const onChunk = vi.fn();
    const onDone = vi.fn();

    const wrapped = wrapAsyncIterable(source(), onChunk, onDone);
    const received: number[] = [];

    for await (const chunk of wrapped) {
      received.push(chunk);
    }

    expect(received).toEqual(chunks);
    expect(onChunk).toHaveBeenCalledTimes(5);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("calls onChunk for each chunk", async () => {
    const chunks = ["a", "b", "c"];
    async function* source() {
      for (const chunk of chunks) {
        yield chunk;
      }
    }

    const onChunk = vi.fn();
    const onDone = vi.fn();

    const wrapped = wrapAsyncIterable(source(), onChunk, onDone);
    
    for await (const _chunk of wrapped) {
      // Consume the stream
    }

    expect(onChunk).toHaveBeenCalledTimes(3);
    expect(onChunk).toHaveBeenNthCalledWith(1, "a");
    expect(onChunk).toHaveBeenNthCalledWith(2, "b");
    expect(onChunk).toHaveBeenNthCalledWith(3, "c");
  });

  it("calls onDone when iteration completes successfully", async () => {
    async function* source() {
      yield 1;
      yield 2;
    }

    const onChunk = vi.fn();
    const onDone = vi.fn();

    const wrapped = wrapAsyncIterable(source(), onChunk, onDone);
    
    for await (const _chunk of wrapped) {
      // Consume the stream
    }

    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("calls onDone even when iteration errors", async () => {
    async function* source() {
      yield 1;
      throw new Error("stream error");
    }

    const onChunk = vi.fn();
    const onDone = vi.fn();

    const wrapped = wrapAsyncIterable(source(), onChunk, onDone);
    
    try {
      for await (const _chunk of wrapped) {
        // Consume the stream
      }
      expect.fail("should have thrown");
    } catch (error: unknown) {
      expect((error as Error).message).toBe("stream error");
    }

    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("swallows tracking errors in onChunk", async () => {
    async function* source() {
      yield 1;
      yield 2;
      yield 3;
    }

    const onChunk = vi.fn((chunk: number) => {
      if (chunk === 2) {
        throw new Error("tracking error");
      }
    });
    const onDone = vi.fn();

    const wrapped = wrapAsyncIterable(source(), onChunk, onDone);
    const received: number[] = [];

    // Should not throw even though onChunk throws
    for await (const chunk of wrapped) {
      received.push(chunk);
    }

    expect(received).toEqual([1, 2, 3]);
    expect(onChunk).toHaveBeenCalledTimes(3);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("swallows tracking errors in onDone", async () => {
    async function* source() {
      yield 1;
    }

    const onChunk = vi.fn();
    const onDone = vi.fn(() => {
      throw new Error("tracking error in onDone");
    });

    const wrapped = wrapAsyncIterable(source(), onChunk, onDone);

    // Should not throw even though onDone throws
    for await (const _chunk of wrapped) {
      // Consume the stream
    }

    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
