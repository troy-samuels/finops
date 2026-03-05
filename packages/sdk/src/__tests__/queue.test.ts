import { describe, expect, it } from "vitest";
import { BatchQueue } from "../queue";

describe("BatchQueue", () => {
  it("drops oldest entries when max size is reached", () => {
    const queue = new BatchQueue<number>(3);

    queue.enqueue(1);
    queue.enqueue(2);
    queue.enqueue(3);
    queue.enqueue(4);

    expect(queue.length).toBe(3);
    expect(queue.drainAll()).toEqual([2, 3, 4]);
  });

  it("prepends retry items and enforces max size", () => {
    const queue = new BatchQueue<number>(4);

    queue.enqueue(10);
    queue.enqueue(11);
    queue.prependAll([1, 2, 3]);

    expect(queue.length).toBe(4);
    expect(queue.drainAll()).toEqual([1, 2, 3, 10]);
  });
});
