/**
 * Storage Health Monitor
 *
 * Detects:
 * - Storage nearing quota limits
 * - Data corruption in stored entries
 * - Quota failures on writes
 * - Private browsing mode (where storage is available but may be cleared)
 *
 * Logs local warnings and returns health status.
 */

import { getSafeStorage, getSessionSafeStorage } from "./safe-storage";

export interface StorageHealthReport {
  /** Overall health status */
  status: "healthy" | "warning" | "critical";
  /** Whether in-memory fallback is active (storage unavailable) */
  usingFallback: boolean;
  /** Estimated bytes used across local and session storage */
  estimatedUsageBytes: number;
  /** Estimated usage as a percentage of typical quota (~5MB) */
  usagePercent: number;
  /** Total number of keys stored */
  keyCount: number;
  /** List of corrupted keys found */
  corruptedKeys: string[];
  /** Number of recent storage errors recorded */
  recentErrorCount: number;
  /** Messages describing issues found */
  warnings: string[];
  /** Timestamp of the report */
  timestamp: number;
}

const TYPICAL_QUOTA_BYTES = 5_000_000; // 5MB conservative estimate
const WARNING_THRESHOLD = 0.7; // 70% of quota
const CRITICAL_THRESHOLD = 0.9; // 90% of quota

// Track recent errors in memory (not persisted to avoid storage loops)
const recentErrors: { key: string; error: string; time: number }[] = [];
const MAX_TRACKED_ERRORS = 20;

export function recordStorageError(key: string, error: unknown): void {
  recentErrors.push({
    key,
    error: String(error),
    time: Date.now(),
  });
  if (recentErrors.length > MAX_TRACKED_ERRORS) {
    recentErrors.shift();
  }
}

/** Check keys for JSON corruption */
function findCorruptedKeys(storage: Storage, keysToCheck: string[]): string[] {
  const corrupted: string[] = [];
  for (const key of keysToCheck) {
    try {
      const raw = storage.getItem(key);
      if (raw !== null) {
        JSON.parse(raw);
      }
    } catch {
      corrupted.push(key);
    }
  }
  return corrupted;
}

/** Build a health report for the current state of storage */
export function checkStorageHealth(): StorageHealthReport {
  const warnings: string[] = [];
  let totalUsage = 0;
  let totalKeys = 0;
  let corruptedKeys: string[] = [];

  const local = getSafeStorage({ silent: true });
  const session = getSessionSafeStorage({ silent: true });

  totalUsage = local.estimateUsedBytes() + session.estimateUsedBytes();
  totalKeys = local.length + session.length;
  const usagePercent = Math.min(100, (totalUsage / TYPICAL_QUOTA_BYTES) * 100);

  // Check for fallback mode
  if (local.isFallback) {
    warnings.push("localStorage is unavailable — using in-memory fallback. Data will not persist across sessions.");
  }
  if (session.isFallback) {
    warnings.push("sessionStorage is unavailable — using in-memory fallback.");
  }

  // Check quota levels
  if (usagePercent > CRITICAL_THRESHOLD * 100) {
    warnings.push(
      `Storage usage at ${usagePercent.toFixed(0)}% — critically near quota limit. Consider clearing old data.`
    );
  } else if (usagePercent > WARNING_THRESHOLD * 100) {
    warnings.push(
      `Storage usage at ${usagePercent.toFixed(0)}% — approaching quota limit.`
    );
  }

  // Check for corrupted data in known keys
  const knownKeys = [
    "corepath-journey-memory",
    "corepath_events",
    "corepath_feedback",
  ];

  try {
    corruptedKeys = findCorruptedKeys(window.localStorage, knownKeys);
    if (corruptedKeys.length > 0) {
      warnings.push(`Corrupted data found in: ${corruptedKeys.join(", ")}. Recovery may be needed.`);
    }
  } catch {
    // Storage not available — skip corruption check
  }

  // Check recent errors
  const recentErrorCount = recentErrors.filter(
    (e) => Date.now() - e.time < 60_000 // last 60 seconds
  ).length;

  if (recentErrorCount > 0) {
    warnings.push(`${recentErrorCount} storage error(s) in the last 60 seconds.`);
  }

  // Determine overall status
  let status: "healthy" | "warning" | "critical" = "healthy";
  if (usagePercent > CRITICAL_THRESHOLD * 100 || corruptedKeys.length > 0 || local.isFallback) {
    status = "critical";
  } else if (usagePercent > WARNING_THRESHOLD * 100 || recentErrorCount > 0) {
    status = "warning";
  }

  return {
    status,
    usingFallback: local.isFallback || session.isFallback,
    estimatedUsageBytes: totalUsage,
    usagePercent,
    keyCount: totalKeys,
    corruptedKeys,
    recentErrorCount,
    warnings,
    timestamp: Date.now(),
  };
}

/** Log health warnings to console if issues are found */
export function logStorageHealth(): void {
  const report = checkStorageHealth();

  if (report.status === "healthy") return;

  const prefix = "[StorageHealth]";
  if (report.status === "critical") {
    console.warn(`${prefix} CRITICAL: Storage health issues detected`);
  } else {
    console.warn(`${prefix} Warning: Storage nearing limits`);
  }

  for (const warning of report.warnings) {
    console.warn(`${prefix} ${warning}`);
  }
}

/** Check if a storage write failure was likely a quota issue */
export function isLikelyQuotaError(error: unknown): boolean {
  if (error instanceof DOMException) {
    return (
      error.name === "QuotaExceededError" ||
      error.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
      error.code === 22 ||
      error.code === 1014
    );
  }
  return false;
}
