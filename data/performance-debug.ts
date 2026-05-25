/**
 * DEVELOPMENT-ONLY PERFORMANCE DIAGNOSTICS
 *
 * Tracks render counts, expensive calculations, and repeated recomputations.
 * All code is stripped from production builds via tree-shaking
 * (guarded by process.env.NODE_ENV checks).
 *
 * Usage:
 *   import { useRenderCount, traceComputation } from "../data/performance-debug";
 *
 *   // Track renders of a component
 *   useRenderCount("ResultScreen");
 *
 *   // Trace expensive computations
 *   const data = traceComputation("calculateTraits", () => expensiveWork());
 */

let renderRegistry: Record<string, number> = {};
const LOG_THRESHOLD_MS = 16; // ~60fps frame budget

/** Log each render of a named component. Call at top of component body. */
export function useRenderCount(name: string): void {
  if (process.env.NODE_ENV !== "production") {
    renderRegistry[name] = (renderRegistry[name] ?? 0) + 1;
    const count = renderRegistry[name];

    if (count === 1 || count % 10 === 0) {
      console.log(`[perf] ${name} rendered ×${count}`);
    }
  }
}

/** Get total render counts for all tracked components. */
export function getRenderCounts(): Record<string, number> {
  if (process.env.NODE_ENV !== "production") {
    return { ...renderRegistry };
  }
  return {};
}

/** Reset all render counters. */
export function resetRenderCounts(): void {
  if (process.env.NODE_ENV !== "production") {
    renderRegistry = {};
  }
}

/**
 * Wrap an expensive computation to log execution time.
 * Returns the computed value directly.
 */
export function traceComputation<T>(label: string, fn: () => T): T {
  if (process.env.NODE_ENV !== "production") {
    const start = performance.now();
    const result = fn();
    const elapsed = performance.now() - start;

    if (elapsed > LOG_THRESHOLD_MS) {
      console.warn(`[perf] ⚠️ "${label}" took ${elapsed.toFixed(2)}ms (exceeds ${LOG_THRESHOLD_MS}ms threshold)`);
    }
    return result;
  }

  return fn();
}

/**
 * Log when a re-computation occurs.
 * Useful inside useMemo dependencies to verify memoization effectiveness.
 */
export function logRecomputation(label: string, ...deps: unknown[]): void {
  if (process.env.NODE_ENV !== "production") {
    console.log(`[perf] recompute "${label}"`, ...deps);
  }
}

/**
 * Wrap a function to count how many times it's called.
 * Useful for verifying that callbacks aren't recreated unnecessarily.
 */
export function createCallCounter<T extends (...args: unknown[]) => unknown>(
  fn: T,
  name: string,
): T & { callCount: number } {
  const wrapped = ((...args: unknown[]) => {
    if (process.env.NODE_ENV !== "production") {
      wrapped.callCount++;
      if (wrapped.callCount % 10 === 0) {
        console.log(`[perf] "${name}" called ×${wrapped.callCount}`);
      }
    }
    return fn(...args);
  }) as T & { callCount: number };

  wrapped.callCount = 0;
  return wrapped;
}
