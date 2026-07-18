import { createD1Db, createLocalDb, type DbClient } from "./client";

let _db: DbClient | null = null;
let _initPromise: Promise<void> | null = null;

export function setDb(db: DbClient) {
  _db = db;
}

export async function initLocalDb() {
  if (_initPromise) return _initPromise;
  _initPromise = createLocalDb().then((db) => {
    _db = db as unknown as DbClient;
  });
  return _initPromise;
}

export async function initDb(d1: D1Database) {
  _db = (await createD1Db(d1)) as unknown as DbClient;
}

const handler: ProxyHandler<DbClient> = {
  get(_, prop) {
    if (!_db) {
      throw new Error(
        "Database not initialized. Call initLocalDb() or initDb() first.",
      );
    }
    const value = (_db as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === "function" ? (value as Function).bind(_db) : value;
  },
};

export const db = new Proxy({} as DbClient, handler);

// Expose initDb globally for the Worker entry to share the same _db reference
(globalThis as Record<string, unknown>).__WACHIMAN_INIT_DB__ = initDb;
