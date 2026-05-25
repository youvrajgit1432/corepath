/**
 * SHARED CONTEXT — centralized data store
 *
 * Provides a shared data store and cycle protection for the intelligence
 * computation pipeline. This module has ZERO imports from other data
 * modules to prevent circular dependency chains.
 *
 * Modules read their dependencies from this store instead of calling
 * each other's compute functions directly.
 *
 * Usage:
 *   import { getStored, storeResult, protectExecution } from "./shared-context";
 *
 * No backend. No auth. Pure client-side computation.
 */

// ============================================================================
// CYCLE PROTECTION
// ============================================================================

/** Tracks the current call stack to detect recursive cycles */
const callStack: string[] = [];

/**
 * Protect a computation from recursive cycles.
 *
 * If `key` is already being computed on the current call stack,
 * returns `null` instead of recursing further.
 *
 * @example
 *   export function computeX(): XData {
 *     return protectExecution('module-x', () => {
 *       // ... computation that might call computeY which calls back ...
 *     }) ?? DEFAULT_X_DATA;
 *   }
 */
export function protectExecution<T>(key: string, fn: () => T): T | null {
  if (callStack.includes(key)) {
    console.warn(
      `[CycleGuard] Recursive cycle detected: "${key}" — breaking cycle, returning null`
    );
    return null;
  }
  callStack.push(key);
  try {
    return fn();
  } finally {
    callStack.pop();
  }
}

// ============================================================================
// DATA STORE
// ============================================================================

/** Internal key-value store for all computed module results */
const contextStore = new Map<string, unknown>();

/**
 * Read a previously stored value from the shared context.
 *
 * @param key — The module key (e.g. "decision-intelligence", "intelligence-synthesis")
 * @returns The stored value, or `undefined` if not yet computed
 */
export function getStored<T>(key: string): T | undefined {
  return contextStore.get(key) as T | undefined;
}

/**
 * Store a computed value in the shared context.
 *
 * @param key — The module key
 * @param value — The computed result to cache
 */
export function storeResult(key: string, value: unknown): void {
  contextStore.set(key, value);
}

/**
 * Clear all stored data and reset cycle guards.
 * Useful for testing or when the user's data has been reset.
 */
export function clearSharedContext(): void {
  contextStore.clear();
  callStack.length = 0;
}
