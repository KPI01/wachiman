import { createD1Db, createLocalDb, type DbClient } from "./client";

let _db: DbClient | null = null;

function getLocalDb(): DbClient {
  if (!_db) {
    _db = createLocalDb();
  }
  return _db;
}

const handler: ProxyHandler<DbClient> = {
  get(_, prop) {
    const db = getLocalDb();
    const value = (db as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === "function" ? (value as Function).bind(db) : value;
  },
};

export const db = new Proxy({} as DbClient, handler);

export async function initDb(d1: D1Database) {
  _db = (await createD1Db(d1)) as unknown as DbClient;
}
