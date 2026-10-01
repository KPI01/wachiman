import { createPostgresDb, type DbClient } from "./client";

let database: DbClient | null = null;
let initPromise: Promise<void> | null = null;

export function setDb(client: DbClient) {
  database = client;
}

export function isDbInitialized() {
  return database !== null;
}

export async function initDb() {
  if (database) return;
  if (initPromise) return initPromise;

  initPromise = Promise.resolve().then(() => {
    database = createPostgresDb();
  });

  try {
    await initPromise;
  } catch (error) {
    initPromise = null;
    throw error;
  }
}

const handler: ProxyHandler<DbClient> = {
  get(_, prop) {
    if (!database) {
      throw new Error("Database not initialized. Call initDb() first.");
    }
    const value = (database as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === "function" ? (value as Function).bind(database) : value;
  },
};

export const db = new Proxy({} as DbClient, handler);
