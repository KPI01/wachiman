import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

export type DbClient = ReturnType<typeof createLocalDb>;

export function createLocalDb(
  dbPath = process.env.DATABASE_URL?.replace("file:", "") || "./dev.db",
) {
  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  return drizzle(sqlite, { schema });
}

let _d1Drizzle: ReturnType<typeof createD1Db> | null = null;

export async function createD1Db(d1: D1Database) {
  if (_d1Drizzle) return _d1Drizzle;
  const { drizzle: drizzleD1 } = await import("drizzle-orm/d1");
  _d1Drizzle = drizzleD1(d1, { schema });
  return _d1Drizzle;
}
