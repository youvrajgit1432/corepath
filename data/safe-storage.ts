/**
 * Safe Storage Wrapper
 *
 * Wraps localStorage/sessionStorage with:
 * - try/catch handling (private browsing, quota exceeded)
 * - graceful fallback (in-memory store when storage unavailable)
 * - JSON validation & corruption recovery
 * - Quota tracking
 * - Size estimation
 */

type StorageType = "local" | "session";

// In-memory fallback when Web Storage is unavailable
const memoryStore = new Map<string, string>();

function getWebStorage(type: StorageType): Storage | null {
  try {
    const storage = type === "local" ? window.localStorage : window.sessionStorage;
    // Verify it's actually accessible (may throw in some environments)
    const test = "__safe_storage_test__";
    storage.setItem(test, test);
    storage.removeItem(test);
    return storage;
  } catch {
    return null;
  }
}

function isQuotaError(error: unknown): boolean {
  if (error instanceof DOMException) {
    return (
      error.code === 22 || // Chrome, Firefox
      error.code === 1014 || // Firefox
      error.name === "QuotaExceededError" ||
      error.name === "NS_ERROR_DOM_QUOTA_REACHED"
    );
  }
  return false;
}

/** Estimate the byte size of a string for quota tracking */
function byteSize(str: string): number {
  return new TextEncoder().encode(str).length;
}

export interface SafeStorageOptions {
  /** Maximum estimated bytes before warning (default 4MB — most browsers allow 5-10MB) */
  quotaWarningThreshold?: number;
  /** Whether to log warnings to console */
  silent?: boolean;
}

export class SafeStorage {
  private store: Storage | null;
  private fallback: boolean;
  private options: Required<SafeStorageOptions>;

  constructor(type: StorageType = "local", options: SafeStorageOptions = {}) {
    this.store = getWebStorage(type);
    this.fallback = this.store === null;
    this.options = {
      quotaWarningThreshold: 4_000_000, // 4MB
      silent: false,
      ...options,
    };
  }

  /** Check if using in-memory fallback */
  get isFallback(): boolean {
    return this.fallback;
  }

  /** Get the underlying storage type availability */
  get isAvailable(): boolean {
    return this.store !== null;
  }

  /** Get item — returns null if missing, corrupted, or errored */
  get<T = string>(key: string): T | null {
    try {
      if (this.fallback) {
        const val = memoryStore.get(key);
        if (val === undefined) return null;
        try {
          return JSON.parse(val) as T;
        } catch {
          return val as unknown as T;
        }
      }

      const raw = this.store!.getItem(key);
      if (raw === null) return null;

      // Try to parse as JSON first; if it's not valid JSON, it might be a plain string
      try {
        const parsed = JSON.parse(raw) as T;
        return parsed;
      } catch {
        // Not JSON — return as string if T is string, otherwise null
        return raw as unknown as T;
      }
    } catch (err) {
      if (!this.options.silent) {
        console.warn(`[SafeStorage] get("${key}") failed:`, err);
      }
      return null;
    }
  }

  /** Set item with JSON serialization and quota protection */
  set(key: string, value: unknown): boolean {
    try {
      const serialized = JSON.stringify(value);

      if (this.fallback) {
        memoryStore.set(key, serialized);
        return true;
      }

      // Check quota before writing
      if (this.options.quotaWarningThreshold > 0) {
        const currentUsage = this.estimateUsedBytes();
        const newItemSize = byteSize(key) + byteSize(serialized);
        if (currentUsage + newItemSize > this.options.quotaWarningThreshold) {
          if (!this.options.silent) {
            console.warn(
              `[SafeStorage] Storage usage ~${(currentUsage / 1_000_000).toFixed(1)}MB — approaching quota limit`
            );
          }
        }
      }

      this.store!.setItem(key, serialized);
      return true;
    } catch (err) {
      if (isQuotaError(err)) {
        if (!this.options.silent) {
          console.warn("[SafeStorage] QuotaExceededError — falling back to in-memory store");
        }
        // Store in memory fallback instead
        try {
          memoryStore.set(key, JSON.stringify(value));
        } catch {
          // Even memory store failed — unrecoverable
        }
        this.fallback = true;
        this.store = null;
        return false;
      }

      if (!this.options.silent) {
        console.warn(`[SafeStorage] set("${key}") failed:`, err);
      }
      return false;
    }
  }

  /** Remove item from storage */
  remove(key: string): boolean {
    try {
      if (this.fallback) {
        memoryStore.delete(key);
        return true;
      }
      this.store!.removeItem(key);
      return true;
    } catch (err) {
      if (!this.options.silent) {
        console.warn(`[SafeStorage] remove("${key}") failed:`, err);
      }
      return false;
    }
  }

  /** Clear all items from storage */
  clear(): boolean {
    try {
      if (this.fallback) {
        memoryStore.clear();
        return true;
      }
      this.store!.clear();
      return true;
    } catch (err) {
      if (!this.options.silent) {
        console.warn("[SafeStorage] clear() failed:", err);
      }
      return false;
    }
  }

  /** Get all keys */
  keys(): string[] {
    try {
      if (this.fallback) {
        return Array.from(memoryStore.keys());
      }
      return Object.keys(this.store!);
    } catch {
      return [];
    }
  }

  /** Get number of stored items */
  get length(): number {
    try {
      if (this.fallback) return memoryStore.size;
      return this.store!.length;
    } catch {
      return 0;
    }
  }

  /** Estimate the total bytes used in storage */
  estimateUsedBytes(): number {
    try {
      if (this.fallback) {
        let total = 0;
        for (const [key, val] of memoryStore) {
          total += byteSize(key) + byteSize(val);
        }
        return total;
      }

      let total = 0;
      for (let i = 0; i < this.store!.length; i++) {
        const key = this.store!.key(i);
        if (key !== null) {
          total += byteSize(key);
          const val = this.store!.getItem(key);
          if (val !== null) total += byteSize(val);
        }
      }
      return total;
    } catch {
      return 0;
    }
  }

  /** Check if a given key has valid JSON data */
  validateJSON(key: string): { valid: boolean; error?: string } {
    try {
      const raw = this.fallback
        ? (memoryStore.get(key) ?? null)
        : this.store?.getItem(key) ?? null;

      if (raw === null) {
        return { valid: false, error: "Key not found" };
      }

      JSON.parse(raw);
      return { valid: true };
    } catch (err) {
      return { valid: false, error: String(err) };
    }
  }

  /** Attempt to recover corrupted JSON data by finding valid parseable portion */
  recoverJSON<T>(key: string): T | null {
    try {
      const raw = this.fallback
        ? (memoryStore.get(key) ?? null)
        : this.store?.getItem(key) ?? null;

      if (raw === null) return null;

      try {
        return JSON.parse(raw) as T;
      } catch {
        // Try to find the valid JSON portion (avoid /s flag, use [\s\S] instead)
        const match = raw.match(/\{[\s\S]*\}/);
        if (match) {
          return JSON.parse(match[0]) as T;
        }
        return null;
      }
    } catch {
      return null;
    }
  }

  /**
   * Atomically update a JSON value: read, apply updater, write.
   * If the read fails or the data is corrupted, returns null.
   */
  update<T>(key: string, updater: (prev: T | null) => T): T | null {
    const prev = this.get<T>(key);
    const next = updater(prev);
    const success = this.set(key, next);
    return success ? next : null;
  }
}

// Singleton instances for convenience
let defaultLocal: SafeStorage | null = null;
let defaultSession: SafeStorage | null = null;

/** Get or create the default localStorage-backed SafeStorage instance */
export function getSafeStorage(options?: SafeStorageOptions): SafeStorage {
  if (!defaultLocal || options) {
    defaultLocal = new SafeStorage("local", options);
  }
  return defaultLocal;
}

/** Get or create the default sessionStorage-backed SafeStorage instance */
export function getSessionSafeStorage(options?: SafeStorageOptions): SafeStorage {
  if (!defaultSession || options) {
    defaultSession = new SafeStorage("session", options);
  }
  return defaultSession;
}
