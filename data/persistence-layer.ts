/**
 * CorePath — Persistence Abstraction Layer
 *
 * Purpose:
 *   Switches between localStorage (client-side) and server persistence
 *   without changing any intelligence engines.
 *
 * The layer provides a unified interface that intelligence engines
 * (journey-memory, career-workspace, analytics-events, etc.) already
 * use via SafeStorage. When server persistence is configured, data
 * is synced to the database via the Prisma client.
 *
 * Usage:
 *   import { persistence } from '@/data/persistence-layer'
 *   persistence.get('some-key')
 *   persistence.set('some-key', { data: 'value' })
 */

import { SafeStorage, getSafeStorage } from "./safe-storage";

// ============================================
// Types
// ============================================

export type PersistenceTarget = "local" | "server";

export interface PersistenceConfig {
  /** Which storage backend to use */
  target: PersistenceTarget;
  /** Sync strategy when server is enabled */
  syncMode?: "immediate" | "debounced" | "manual";
}

export interface PersistenceAdapter {
  get<T = unknown>(key: string): Promise<T | null> | T | null;
  set(key: string, value: unknown): Promise<boolean> | boolean;
  remove(key: string): Promise<boolean> | boolean;
  clear(): Promise<boolean> | boolean;
  keys(): Promise<string[]> | string[];
}

// ============================================
// LocalStorage Adapter (existing SafeStorage)
// ============================================

class LocalAdapter implements PersistenceAdapter {
  private storage: SafeStorage;

  constructor() {
    this.storage = getSafeStorage();
  }

  get<T = unknown>(key: string): T | null {
    return this.storage.get<T>(key);
  }

  set(key: string, value: unknown): boolean {
    return this.storage.set(key, value);
  }

  remove(key: string): boolean {
    return this.storage.remove(key);
  }

  clear(): boolean {
    return this.storage.clear();
  }

  keys(): string[] {
    return this.storage.keys();
  }
}

// ============================================
// Server Adapter (PostgreSQL via Prisma)
// ============================================

/**
 * Server-side persistence using Prisma + PostgreSQL.
 *
 * Data is stored as JSON blobs in a generic `KeyValueStore` model,
 * keyed by a user-specific namespace. This allows existing intelligence
 * engines to store and retrieve their data without schema changes.
 *
 * The adapter requires a userId to namespace data per user.
 */
class ServerAdapter implements PersistenceAdapter {
  private userId: string | null = null;
  private prismaPromise: ReturnType<typeof importPrisma> | null = null;

  private async getPrisma() {
    if (!this.prismaPromise) {
      this.prismaPromise = importPrisma();
    }
    return this.prismaPromise;
  }

  setUser(id: string): void {
    this.userId = id;
  }

  private get namespace(): string {
    if (!this.userId) {
      throw new Error(
        "[PersistenceLayer] Server adapter requires a userId to be set. " +
          "Call `persistence.setUser(id)` after authentication."
      );
    }
    return `user:${this.userId}`;
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    try {
      const { prisma } = await this.getPrisma();
      const record = await prisma.keyValueStore.findUnique({
        where: {
          namespace_key: {
            namespace: this.namespace,
            key,
          },
        },
      });
      if (!record) return null;
      return JSON.parse(record.value) as T;
    } catch (err) {
      console.error(`[PersistenceLayer] Server get("${key}") failed:`, err);
      return null;
    }
  }

  async set(key: string, value: unknown): Promise<boolean> {
    try {
      const { prisma } = await this.getPrisma();
      const serialized = JSON.stringify(value);
      await prisma.keyValueStore.upsert({
        where: {
          namespace_key: {
            namespace: this.namespace,
            key,
          },
        },
        update: { value: serialized, updatedAt: new Date() },
        create: {
          namespace: this.namespace,
          key,
          value: serialized,
        },
      });
      return true;
    } catch (err) {
      console.error(`[PersistenceLayer] Server set("${key}") failed:`, err);
      return false;
    }
  }

  async remove(key: string): Promise<boolean> {
    try {
      const { prisma } = await this.getPrisma();
      await prisma.keyValueStore.delete({
        where: {
          namespace_key: {
            namespace: this.namespace,
            key,
          },
        },
      });
      return true;
    } catch (err) {
      console.error(`[PersistenceLayer] Server remove("${key}") failed:`, err);
      return false;
    }
  }

  async clear(): Promise<boolean> {
    try {
      const { prisma } = await this.getPrisma();
      await prisma.keyValueStore.deleteMany({
        where: { namespace: this.namespace },
      });
      return true;
    } catch (err) {
      console.error(`[PersistenceLayer] Server clear() failed:`, err);
      return false;
    }
  }

  async keys(): Promise<string[]> {
    try {
      const { prisma } = await this.getPrisma();
      const records = await prisma.keyValueStore.findMany({
        where: { namespace: this.namespace },
        select: { key: true },
      });
      return records.map((r: { key: string }) => r.key);
    } catch (err) {
      console.error(`[PersistenceLayer] Server keys() failed:`, err);
      return [];
    }
  }
}

/** Get the Prisma singleton (cached, null-safe) */
async function importPrisma() {
  const mod = await import("@/lib/prisma");
  // getPrisma() returns null when DATABASE_URL is unset
  const client = mod.getPrisma ? mod.getPrisma() : mod.prisma;
  return { prisma: client };
}

// ============================================
// Persistence Manager
// ============================================

class PersistenceManager {
  private config: PersistenceConfig;
  private localAdapter: LocalAdapter;
  private serverAdapter: ServerAdapter;
  private syncQueue: Map<string, unknown> = new Map();
  private syncTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(config: PersistenceConfig = { target: "local" }) {
    this.config = config;
    this.localAdapter = new LocalAdapter();
    this.serverAdapter = new ServerAdapter();
  }

  /** Switch the persistence target at runtime */
  setTarget(target: PersistenceTarget): void {
    this.config.target = target;
  }

  /** Set the user ID for server-side namespacing */
  setUser(userId: string): void {
    this.serverAdapter.setUser(userId);
  }

  /** Get the current config */
  getConfig(): PersistenceConfig {
    return { ...this.config };
  }

  /** Read data from the active persistence target */
  async get<T = unknown>(key: string): Promise<T | null> {
    if (this.config.target === "server") {
      return this.serverAdapter.get<T>(key);
    }
    return this.localAdapter.get<T>(key);
  }

  /** Write data to the active persistence target */
  async set(key: string, value: unknown, syncToServer?: boolean): Promise<boolean> {
    if (this.config.target === "server") {
      return this.serverAdapter.set(key, value);
    }

    // Local write
    const result = this.localAdapter.set(key, value);

    // Optionally sync to server
    if (syncToServer && this.config.syncMode === "immediate") {
      await this.serverAdapter.set(key, value);
    } else if (syncToServer && this.config.syncMode === "debounced") {
      this.enqueueSync(key, value);
    }

    return result;
  }

  /** Remove data from the active persistence target */
  async remove(key: string): Promise<boolean> {
    if (this.config.target === "server") {
      return this.serverAdapter.remove(key);
    }
    return this.localAdapter.remove(key);
  }

  /** Clear all data from the active persistence target */
  async clear(): Promise<boolean> {
    if (this.config.target === "server") {
      return this.serverAdapter.clear();
    }
    return this.localAdapter.clear();
  }

  /** Get all keys from the active persistence target */
  async keys(): Promise<string[]> {
    if (this.config.target === "server") {
      return this.serverAdapter.keys();
    }
    return this.localAdapter.keys();
  }

  /**
   * Migrate all data from localStorage to the server.
   * Useful when a user first authenticates.
   */
  async migrateLocalToServer(): Promise<{ migrated: number; failed: number }> {
    const keys = this.localAdapter.keys();
    let migrated = 0;
    let failed = 0;

    for (const key of keys) {
      const value = this.localAdapter.get(key);
      if (value !== null) {
        try {
          await this.serverAdapter.set(key, value);
          migrated++;
        } catch {
          failed++;
        }
      }
    }

    return { migrated, failed };
  }

  /** Sync a single key to the server immediately */
  async syncToServer(key: string): Promise<boolean> {
    const value = this.localAdapter.get(key);
    if (value === null) return true; // nothing to sync
    return this.serverAdapter.set(key, value);
  }

  // ── Debounced sync ───────────────────────

  private enqueueSync(key: string, value: unknown): void {
    this.syncQueue.set(key, value);

    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
    }

    this.syncTimer = setTimeout(() => {
      this.flushSyncQueue();
    }, 2000); // 2-second debounce
  }

  private async flushSyncQueue(): Promise<void> {
    for (const [key, value] of this.syncQueue) {
      await this.serverAdapter.set(key, value);
    }
    this.syncQueue.clear();
    this.syncTimer = null;
  }
}

// ============================================
// Singleton Export
// ============================================

/**
 * Global persistence instance.
 *
 * Defaults to localStorage. Switch to server after auth:
 *
 *   persistence.setTarget("server")
 *   persistence.setUser(clerkUser.id)
 *
 * To sync existing local data to server:
 *
 *   const result = await persistence.migrateLocalToServer()
 */
export const persistence = new PersistenceManager({ target: "local" });

// Convenience re-exports for backward compatibility
export { SafeStorage, getSafeStorage } from "./safe-storage";
export type { SafeStorageOptions } from "./safe-storage";
