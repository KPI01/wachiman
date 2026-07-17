import type { D1Database } from "@cloudflare/workers-types";
import { PrismaD1 } from "@prisma/adapter-d1";
import { PrismaClient } from "../../prisma/generated/prisma/client";

let _prisma: PrismaClient | null = null;

const handler: ProxyHandler<PrismaClient> = {
  get(_, prop) {
    if (!_prisma) {
      throw new Error("Prisma Client not initialized. Call initPrisma() first.");
    }
    const value = (_prisma as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === "function" ? (value as Function).bind(_prisma) : value;
  },
};

export const prisma = new Proxy({} as PrismaClient, handler);

export function initPrisma(db: D1Database) {
  const adapter = new PrismaD1(db);
  _prisma = new PrismaClient({ adapter });
}
