import type { D1Database } from "@cloudflare/workers-types";
import { PrismaD1 } from "@prisma/adapter-d1";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../../prisma/generated/prisma/client";

let _prisma: PrismaClient | null = null;

function getLocalPrisma(): PrismaClient {
  const dbUrl = process.env.DATABASE_URL || "file:./prisma/dev.db";
  const adapter = new PrismaLibSql({ url: dbUrl });
  _prisma = new PrismaClient({ adapter });
  return _prisma;
}

const handler: ProxyHandler<PrismaClient> = {
  get(_, prop) {
    if (!_prisma) {
      getLocalPrisma();
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
