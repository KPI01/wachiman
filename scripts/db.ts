import { mkdirSync, rmSync, writeFileSync, openSync, closeSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { config as loadEnv } from "dotenv";
import { createLocalDb } from "../db/client";
import { departments, sites, users } from "../db/schema";
import { hashText } from "../app/lib/hash.server";

const options = parseOptions(process.argv.slice(2));
loadEnvironment(options.envPath);

const command = options.command;
const target = options.target;
const mode = options.mode;
const databasePath = resolve(
  (process.env.DATABASE_URL ?? "file:./dev.db").replace(/^file:/, ""),
);

function loadEnvironment(envPath?: string) {
  if (!envPath) return;

  const result = loadEnv({ path: envPath, override: true, quiet: true });
  if (result.error) {
    throw new Error(`No se pudo cargar el archivo de entorno: ${envPath}`);
  }
}

type DbOptions = {
  command: string;
  target: string;
  mode: string;
  envPath?: string;
};

function parseOptions(args: string[]): DbOptions {
  const options: DbOptions = {
    command: args[0] ?? "help",
    target: "sqlite",
    mode: "base",
  };

  for (let index = 1; index < args.length; index += 1) {
    const argument = args[index];

    if (argument === "--") continue;

    const equalIndex = argument.indexOf("=");
    const name = equalIndex === -1 ? argument : argument.slice(0, equalIndex);
    const inlineValue = equalIndex === -1 ? undefined : argument.slice(equalIndex + 1);
    const value = inlineValue ?? args[index + 1];

    if (name === "--target" || name === "--mode" || name === "--env") {
      if (!value) throw new Error(`Falta el valor para ${name}`);
      if (name === "--target") options.target = value;
      if (name === "--mode") options.mode = value;
      if (name === "--env") {
        options.envPath = resolve(value);
      }
      if (inlineValue === undefined) index += 1;
      continue;
    }

    if (argument === "--demo") {
      options.mode = "demo";
      continue;
    }

    if (argument === "--force") continue;
    throw new Error(`Argumento desconocido: ${argument}`);
  }

  return options;
}

function run(commandName: string, args: string[]) {
  const result = spawnSync(commandName, args, { stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function runWrangler(args: string[]) {
  run("pnpm", ["exec", "wrangler", ...args]);
}

async function seedSqlite() {
  const db = await createLocalDb(databasePath);
  const siteName = process.env.SITE_NAME || "Sitio principal";
  const siteSlug = process.env.SITE_SLUG || "PRINCIPAL";
  const departmentName = process.env.DEPARTMENT_NAME || "General";
  const departmentSlug = process.env.DEPARTMENT_SLUG || "GENERAL";
  const adminFullName = process.env.ADMIN_FULL_NAME || "Administrador";
  const adminUsername = process.env.ADMIN_USERNAME || "admin";
  const adminPassword = process.env.ADMIN_PASSWORD || "demo123";
  const password = await hashText(adminPassword);

  await db.insert(sites).values({ id: "site-1", name: siteName, slug: siteSlug })
    .onConflictDoUpdate({ target: sites.id, set: { name: siteName, slug: siteSlug } });
  await db.insert(departments).values({ id: "dept-3", name: departmentName, slug: departmentSlug })
    .onConflictDoUpdate({ target: departments.id, set: { name: departmentName, slug: departmentSlug } });
  await db.insert(users).values({
    id: "user-1",
    fullName: adminFullName,
    username: adminUsername,
    password,
    role: "ADMIN",
    siteId: "site-1",
    departmentId: "dept-3",
  }).onConflictDoUpdate({
    target: users.id,
    set: { fullName: adminFullName, username: adminUsername, password, role: "ADMIN" },
  });
  console.log(`Seed básico completado. Usuario administrador: ${adminUsername}`);
}

function prepareSqlite() {
  mkdirSync(dirname(databasePath), { recursive: true });
  closeSync(openSync(databasePath, "a"));
}

async function seedD1() {
  if (mode === "demo") {
    const result = spawnSync("pnpm", ["exec", "tsx", "scripts/seed-remote.ts"], {
      encoding: "utf8",
    });
    if (result.status !== 0) process.exit(result.status ?? 1);
    const sql = result.stdout;
    const tempFile = "/tmp/wachiman-seed.sql";
    writeFileSync(tempFile, sql);
    runWrangler(["d1", "execute", "wachiman", "--remote", "--file", tempFile]);
    return;
  }

  const password = await hashText(process.env.ADMIN_PASSWORD || "demo123");
  const quote = (value: string) => `'${value.replaceAll("'", "''")}'`;
  const sql = [
    `INSERT INTO sites (id, name, slug) VALUES ('site-1', ${quote(process.env.SITE_NAME || "Sitio principal")}, ${quote(process.env.SITE_SLUG || "PRINCIPAL")}) ON CONFLICT(id) DO UPDATE SET name=excluded.name, slug=excluded.slug;`,
    `INSERT INTO departments (id, name, slug) VALUES ('dept-3', ${quote(process.env.DEPARTMENT_NAME || "General")}, ${quote(process.env.DEPARTMENT_SLUG || "GENERAL")}) ON CONFLICT(id) DO UPDATE SET name=excluded.name, slug=excluded.slug;`,
    `INSERT INTO users (id, full_name, username, password, role, is_active, is_trashed, site_id, department_id) VALUES ('user-1', ${quote(process.env.ADMIN_FULL_NAME || "Administrador")}, ${quote(process.env.ADMIN_USERNAME || "admin")}, ${quote(password)}, 'ADMIN', 1, 0, 'site-1', 'dept-3') ON CONFLICT(id) DO UPDATE SET full_name=excluded.full_name, username=excluded.username, password=excluded.password, role='ADMIN';`,
  ].join("\n");
  const tempFile = "/tmp/wachiman-base-seed.sql";
  writeFileSync(tempFile, sql);
  runWrangler(["d1", "execute", "wachiman", "--remote", "--file", tempFile]);
}

async function main() {
  if (target !== "sqlite" && target !== "d1") {
    throw new Error("El destino debe ser sqlite o d1");
  }

  if (command === "create") {
    if (target === "d1") runWrangler(["d1", "create", "wachiman"]);
    else {
      prepareSqlite();
       console.log(`Base de datos SQLite creada en ${databasePath}`);
    }
    return;
  }

  if (command === "migrate") {
    if (target === "d1") runWrangler(["d1", "migrations", "apply", "wachiman", "--remote"]);
    else run("pnpm", ["exec", "drizzle-kit", "migrate"]);
    return;
  }

  if (command === "setup") {
    if (target !== "sqlite") {
      throw new Error("db:setup solo admite SQLite; usa db:migrate y db:seed para D1");
    }
    if (mode !== "base") {
      throw new Error("db:setup no acepta --mode; ejecuta db:seed --mode=demo por separado");
    }
    prepareSqlite();
    run("pnpm", ["exec", "drizzle-kit", "migrate"]);
    await seedSqlite();
    return;
  }

  if (command === "reset") {
    if (target === "d1") {
      if (!process.argv.includes("--force")) throw new Error("El reset de D1 requiere --force");
      const tables = [
        "access_logs", "access_log_vehicles", "worker_documents",
        "planned_access_persons", "planned_accesses", "external_workers",
        "users", "work_categories", "companies", "departments", "sites",
        "audit_logs", "d1_migrations", "__drizzle_migrations",
      ];
      runWrangler([
        "d1", "execute", "wachiman", "--remote", "--command",
        tables.map((table) => `DROP TABLE IF EXISTS ${table};`).join(" "),
      ]);
      runWrangler(["d1", "migrations", "apply", "wachiman", "--remote"]);
    } else {
      console.log(`Restableciendo la base de datos SQLite: ${databasePath}`);
      rmSync(databasePath, { force: true });
      rmSync(`${databasePath}-wal`, { force: true });
      rmSync(`${databasePath}-shm`, { force: true });
      prepareSqlite();
      run("pnpm", ["exec", "drizzle-kit", "migrate"]);
      console.log(`Base de datos SQLite recreada en ${databasePath}`);
    }
    return;
  }

  if (command === "seed") {
    if (target === "d1") await seedD1();
    else if (mode === "demo") run("pnpm", ["exec", "tsx", "scripts/seed.ts", "--mode=demo"]);
    else await seedSqlite();
    return;
  }

  console.log(`Uso: pnpm db:<comando> [--target=sqlite|d1] [--mode=base|demo]`);
  console.log("Comandos: migrate, setup, reset, seed");
}

main().catch((error) => {
  console.error("Error al ejecutar la operación de base de datos:", error);
  process.exit(1);
});
