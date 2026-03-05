// ============================================================
// Generic Async Iterable Wrapper — for streaming response tracking
// ============================================================
// Wraps an async iterable to intercept chunks without consuming or
// delaying the original stream. Calls onChunk for each yielded value
// and onDone when the iteration completes (success or error).
// ============================================================

/**
 * Wrap an async iterable to track chunks and completion.
 *
 * @param iterable  The original async iterable (e.g., OpenAI stream)
 * @param onChunk   Called for each chunk yielded (for accumulation)
 * @param onDone    Called when iteration completes or errors
 * @returns         A new async iterable that yields the same chunks
 */
export async function* wrapAsyncIterable<T>(
  iterable: AsyncIterable<T>,
  onChunk: (chunk: T) => void,
  onDone: () => void,
): AsyncIterable<T> {
  try {
    for await (const chunk of iterable) {
      try {
        onChunk(chunk);
      } catch {
        // Swallow tracking errors — never break the stream
      }
      yield chunk;
    }
    // Stream completed successfully
    try {
      onDone();
    } catch {
      // Swallow tracking errors
    }
  } catch (error: unknown) {
    // Stream errored — still call onDone to finalize tracking
    try {
      onDone();
    } catch {
      // Swallow tracking errors
    }
    // Re-throw the stream error to the caller
    throw error;
  }
}
