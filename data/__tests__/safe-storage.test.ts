import { describe, it, expect, beforeEach } from "vitest";
import { SafeStorage, getSafeStorage, getSessionSafeStorage } from "../safe-storage";

describe("SafeStorage", () => {
  let storage: SafeStorage;

  beforeEach(() => {
    storage = new SafeStorage("local", { silent: true, quotaWarningThreshold: 0 });
    storage.clear();
  });

  describe("basic operations", () => {
    it("stores and retrieves a string value", () => {
      storage.set("key1", "hello");
      expect(storage.get<string>("key1")).toBe("hello");
    });

    it("stores and retrieves a number", () => {
      storage.set("age", 42);
      expect(storage.get<number>("age")).toBe(42);
    });

    it("stores and retrieves an object", () => {
      const obj = { name: "test", values: [1, 2, 3] };
      storage.set("obj", obj);
      expect(storage.get<typeof obj>("obj")).toEqual(obj);
    });

    it("stores and retrieves an array", () => {
      const arr = [1, "two", { three: 3 }];
      storage.set("arr", arr);
      expect(storage.get<typeof arr>("arr")).toEqual(arr);
    });

    it("stores and retrieves null", () => {
      storage.set("nullval", null);
      expect(storage.get("nullval")).toBeNull();
    });

    it("stores and retrieves a boolean", () => {
      storage.set("bool", true);
      expect(storage.get<boolean>("bool")).toBe(true);
    });

    it("returns null for missing keys", () => {
      expect(storage.get("nonexistent")).toBeNull();
    });

    it("removes a key", () => {
      storage.set("temp", "value");
      expect(storage.get<string>("temp")).toBe("value");
      storage.remove("temp");
      expect(storage.get("temp")).toBeNull();
    });

    it("clears all keys", () => {
      storage.set("a", 1);
      storage.set("b", 2);
      storage.clear();
      expect(storage.get("a")).toBeNull();
      expect(storage.get("b")).toBeNull();
    });

    it("tracks length", () => {
      expect(storage.length).toBe(0);
      storage.set("k1", "v1");
      expect(storage.length).toBe(1);
      storage.set("k2", "v2");
      expect(storage.length).toBe(2);
      storage.clear();
      expect(storage.length).toBe(0);
    });

    it("returns keys", () => {
      storage.set("x", 1);
      storage.set("y", 2);
      const keys = storage.keys();
      expect(keys.sort()).toEqual(["x", "y"]);
    });
  });

  describe("JSON validation", () => {
    it("validates valid JSON", () => {
      storage.set("valid", { a: 1 });
      const result = storage.validateJSON("valid");
      expect(result.valid).toBe(true);
    });

    it("reports invalid JSON", () => {
      // Directly write invalid JSON by accessing the underlying store
      const rawKey = "corrupted";
      try {
        window.localStorage.setItem(rawKey, "{invalid json}");
      } catch {
        // In some environments this might throw
      }
      const result = storage.validateJSON(rawKey);
      expect(result.valid).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it("reports missing key as invalid", () => {
      const result = storage.validateJSON("missing");
      expect(result.valid).toBe(false);
    });
  });

  describe("corruption recovery", () => {
    it("recovers valid data", () => {
      storage.set("ok", { data: "good" });
      const recovered = storage.recoverJSON<{ data: string }>("ok");
      expect(recovered).toEqual({ data: "good" });
    });

    it("returns null for missing keys", () => {
      expect(storage.recoverJSON("missing")).toBeNull();
    });

    it("tries to recover from partially corrupted JSON", () => {
      try {
        window.localStorage.setItem(
          "partial",
          '{"good": 1, "corrupted" true "extra": 2}'
        );
      } catch {
        // Some browsers might reject invalid JSON
      }
      // At minimum should not throw
      expect(() => storage.recoverJSON("partial")).not.toThrow();
    });
  });

  describe("atomic update", () => {
    it("sets initial value when key is missing", () => {
      const result = storage.update<number>("counter", (prev) => (prev ?? 0) + 1);
      expect(result).toBe(1);
    });

    it("increments existing value", () => {
      storage.set("counter", 5);
      const result = storage.update<number>("counter", (prev) => (prev ?? 0) + 1);
      expect(result).toBe(6);
    });

    it("works with objects", () => {
      storage.set("profile", { name: "Alice" });
      const updated = storage.update<{ name: string; age?: number }>("profile", (prev) => ({
        ...(prev ?? { name: "Unknown" }),
        age: 30,
      }));
      expect(updated).toEqual({ name: "Alice", age: 30 });
    });
  });

  describe("fallback mode", () => {
    it("starts not in fallback mode when localStorage is available", () => {
      expect(storage.isFallback).toBe(false);
    });

    it("isAvailable returns true when localStorage works", () => {
      expect(storage.isAvailable).toBe(true);
    });

    it("estimates used bytes", () => {
      storage.set("testkey", "testvalue");
      const bytes = storage.estimateUsedBytes();
      expect(bytes).toBeGreaterThan(0);
    });
  });

  describe("session storage", () => {
    it("stores and retrieves from session storage", () => {
      const session = new SafeStorage("session", { silent: true });
      session.set("sess_key", "sess_val");
      expect(session.get<string>("sess_key")).toBe("sess_val");
      session.clear();
    });

    it("session storage is isolated from local", () => {
      const local = new SafeStorage("local", { silent: true });
      const session = new SafeStorage("session", { silent: true });
      local.set("shared", "local_val");
      session.set("shared", "session_val");
      expect(local.get<string>("shared")).toBe("local_val");
      expect(session.get<string>("shared")).toBe("session_val");
      local.clear();
      session.clear();
    });
  });

  describe("singleton instances", () => {
    it("getSafeStorage returns a SafeStorage instance", () => {
      const s = getSafeStorage({ silent: true });
      expect(s).toBeInstanceOf(SafeStorage);
    });

    it("getSessionSafeStorage returns a SafeStorage instance", () => {
      const s = getSessionSafeStorage({ silent: true });
      expect(s).toBeInstanceOf(SafeStorage);
    });
  });
});
