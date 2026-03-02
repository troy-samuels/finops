// ============================================================
// BatchQueue — FIFO queue with max-size and drop-oldest policy
// ============================================================

export class BatchQueue<T> {
  private items: T[] = [];
  private readonly maxSize: number;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  /**
   * Enqueue an item. If at capacity, drop the oldest item first.
   * Fully synchronous — no allocation beyond the array push.
   */
  enqueue(item: T): void {
    if (this.items.length >= this.maxSize) {
      this.items.shift();
    }
    this.items.push(item);
  }

  /**
   * Drain up to `count` items from the front of the queue.
   * Returns the drained items. The queue retains anything beyond `count`.
   */
  drain(count: number): T[] {
    return this.items.splice(0, count);
  }

  /** Drain everything. */
  drainAll(): T[] {
    return this.items.splice(0, this.items.length);
  }

  /** Current number of items in the queue. */
  get length(): number {
    return this.items.length;
  }
}
