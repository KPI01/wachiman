import type { DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "./schema";

export type DbClient = ReturnType<typeof createLocalDb> extends Promise<infer T>
  ? T
  : ReturnType<typeof createLocalDb>;

async function importBetterSqlite3() {
  const encoded = "YmV0dGVyLXNxbGl0ZTM="; // base64("better-sqlite3")
  const decoded = atob(encoded);
  return import(decoded) as Promise<typeof import("better-sqlite3")>;
}

async function importDrizzleBetterSqlite3() {
  const encoded = "ZHJpenpsZS1vcm0vYmV0dGVyLXNxbGl0ZTM="; // base64("drizzle-orm/better-sqlite3")
  const decoded = atob(encoded);
  return import(decoded) as Promise<typeof import("drizzle-orm/better-sqlite3")>;
}

export async function createLocalDb(
  dbPath = process.env.DATABASE_URL?.replace("file:", "") || "./dev.db",
) {
  const Database = (await importBetterSqlite3()).default;
  const { drizzle } = await importDrizzleBetterSqlite3();
  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  return drizzle(sqlite, { schema });
}

let _d1Drizzle: DrizzleD1Database<typeof schema> | null = null;

export async function createD1Db(d1: D1Database) {
  if (_d1Drizzle) return _d1Drizzle;
  const { drizzle: drizzleD1 } = await import("drizzle-orm/d1");
  _d1Drizzle = drizzleD1(d1, { schema }) as unknown as DrizzleD1Database<typeof schema>;
  return _d1Drizzle;
}
