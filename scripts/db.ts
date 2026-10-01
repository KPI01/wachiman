import { spawnSync } from "node:child_process";
import { Client } from "pg";

const [command, ...args] = process.argv.slice(2);

function runPnpm(args: string[]) {
  const result = spawnSync("pnpm", args, {
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

async function resetDatabase() {
  if (!args.includes("--force")) {
    throw new Error("El restablecimiento borra toda la base de datos. Añade --force para continuar.");
  }
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL no está definida.");
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await client.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
  } finally {
    await client.end();
  }

  runPnpm(["db:migrate"]);
  runPnpm(["db:seed"]);
  console.log("La base de datos PostgreSQL se ha restablecido.");
}

if (command === "reset") {
  resetDatabase().catch((error: unknown) => {
    console.error("No se pudo restablecer la base de datos:", error);
    process.exitCode = 1;
  });
} else {
  console.log("Uso: pnpm db:reset --force");
}
