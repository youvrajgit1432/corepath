import { describe, it, expect, beforeEach } from "vitest";
import { checkStorageHealth, logStorageHealth, isLikelyQuotaError, recordStorageError } from "../storage-health";
import { getSafeStorage } from "../safe-storage";

describe("checkStorageHealth", () => {
  beforeEach(() => {
    // Clear storage between tests
    const storage = getSafeStorage({ silent: true });
    storage.clear();
  });

  it("returns a healthy report when storage is empty", () => {
    const report = checkStorageHealth();
    expect(report.status).toBe("healthy");
    expect(report.usingFallback).toBe(false);
    expect(report.warnings).toHaveLength(0);
  });

  it("reports usage stats correctly", () => {
    const storage = getSafeStorage({ silent: true });
    storage.set("test", { data: "x".repeat(100) });

    const report = checkStorageHealth();
    expect(report.estimatedUsageBytes).toBeGreaterThan(0);
    expect(report.keyCount).toBeGreaterThanOrEqual(1);
    expect(report.timestamp).toBeGreaterThan(0);
  });

  it("returns status and usage fields", () => {
    const report = checkStorageHealth();
    expect(report).toHaveProperty("status");
    expect(report).toHaveProperty("estimatedUsageBytes");
    expect(report).toHaveProperty("usagePercent");
    expect(report).toHaveProperty("keyCount");
    expect(report).toHaveProperty("corruptedKeys");
    expect(report).toHaveProperty("recentErrorCount");
    expect(report).toHaveProperty("warnings");
    expect(report).toHaveProperty("timestamp");
  });
});

describe("logStorageHealth", () => {
  it("does not throw when called", () => {
    expect(() => logStorageHealth()).not.toThrow();
  });
});

describe("isLikelyQuotaError", () => {
  it("returns true for QuotaExceededError", () => {
    const error = new DOMException("Quota exceeded", "QuotaExceededError");
    expect(isLikelyQuotaError(error)).toBe(true);
  });

  it("returns true for code 22", () => {
    const error = new DOMException("Quota exceeded");
    Object.defineProperty(error, "code", { value: 22 });
    expect(isLikelyQuotaError(error)).toBe(true);
  });

  it("returns false for unrelated errors", () => {
    expect(isLikelyQuotaError(new Error("generic"))).toBe(false);
    expect(isLikelyQuotaError(new DOMException("NotAllowed"))).toBe(false);
    expect(isLikelyQuotaError("string error")).toBe(false);
    expect(isLikelyQuotaError(null)).toBe(false);
  });
});

describe("recordStorageError", () => {
  it("does not throw", () => {
    expect(() => recordStorageError("test-key", new Error("test"))).not.toThrow();
  });

  it("tracks errors and they appear in the health report", () => {
    recordStorageError("key1", new Error("err1"));
    const report = checkStorageHealth();
    // Errors in the last 60 seconds should be counted
    expect(report.recentErrorCount).toBeGreaterThanOrEqual(1);
  });
});
