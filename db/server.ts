import { createLocalDb, type DbClient } from "./client";

let _db: DbClient | null = null;
let _initPromise: Promise<void> | null = null;

export function setDb(db: DbClient) {
  _db = db;
}

export function isDbInitialized() {
  return _db !== null;
}

export async function initLocalDb() {
  if (_db) return;
  if (_initPromise) return _initPromise;
  _initPromise = createLocalDb().then((db) => {
    _db = db as unknown as DbClient;
  });
  return _initPromise;
}

const handler: ProxyHandler<DbClient> = {
  get(_, prop) {
    if (!_db) {
      throw new Error(
        "Database not initialized. Call initLocalDb() first.",
      );
    }
    const value = (_db as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === "function" ? (value as Function).bind(_db) : value;
  },
};

export const db = new Proxy({} as DbClient, handler);
