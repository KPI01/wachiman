import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

let pool: Pool | null = null;

export function createPostgresDb(connectionString = process.env.DATABASE_URL) {
  if (!connectionString) {
    throw new Error("DATABASE_URL no está definida.");
  }

  pool ??= new Pool({
    connectionString,
    max: Number(process.env.DATABASE_POOL_MAX ?? 10),
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 30_000,
  });

  return drizzle({ client: pool, schema });
}

export type DbClient = ReturnType<typeof createPostgresDb>;

export async function closeDatabasePool() {
  if (!pool) return;
  const currentPool = pool;
  pool = null;
  await currentPool.end();
}
