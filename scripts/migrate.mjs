import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL no está definida.");
}

const pool = new Pool({ connectionString });

try {
  await migrate(drizzle({ client: pool }), {
    migrationsFolder: "./db/migrations-postgres",
  });
  console.log("Migraciones PostgreSQL aplicadas.");
} finally {
  await pool.end();
}
