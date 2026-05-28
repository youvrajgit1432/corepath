/**
 * CorePath — Prisma Client
 *
 * Singleton pattern compatible with Prisma v7.
 * Uses the @prisma/adapter-pg for direct PostgreSQL connections.
 *
 * IMPORTANT: getPrisma() returns null when DATABASE_URL is not configured.
 * All consumers must handle the null case gracefully.
 */

import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | null;
};

let cachedPrisma: PrismaClient | null = null;

function createPrismaClient(): PrismaClient | null {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    if (process.env.NODE_ENV === "production") {
      console.error(
        "[Prisma] DATABASE_URL is not configured. Database queries will fail."
      );
    }
    return null;
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

/**
 * Get the Prisma client instance.
 * Returns null if DATABASE_URL is not configured.
 * Always use this getter instead of importing prisma directly.
 */
export function getPrisma(): PrismaClient | null {
  if (cachedPrisma !== undefined) return cachedPrisma;
  if (globalForPrisma.prisma !== undefined) {
    cachedPrisma = globalForPrisma.prisma;
    return cachedPrisma;
  }

  const client = createPrismaClient();
  globalForPrisma.prisma = client;
  cachedPrisma = client;
  return client;
}

// Direct export for convenience — will be null if unconfigured
export const prisma = getPrisma();

export default prisma;
