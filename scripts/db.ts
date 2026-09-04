import { mkdirSync, rmSync, openSync, closeSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { config as loadEnv } from "dotenv";
import { createLocalDb } from "../db/client";
import { allowedAreas, appSettings, companies, departments, sites, users } from "../db/schema";
import { hashText } from "../app/lib/hash.server";
import { normalizeUsername } from "../app/lib/username";

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

async function seedSqlite() {
  const db = await createLocalDb(databasePath);
  const siteName = process.env.SITE_NAME || "Sitio principal";
  const siteSlug = process.env.SITE_SLUG || "PRINCIPAL";
  const departmentName = process.env.DEPARTMENT_NAME || "General";
  const departmentSlug = process.env.DEPARTMENT_SLUG || "GENERAL";
  const adminFullName = process.env.ADMIN_FULL_NAME || "Administrador";
   const adminUsername = normalizeUsername(process.env.ADMIN_USERNAME || "admin");
  const adminPassword = process.env.ADMIN_PASSWORD || "demo123";
  const holderLegalName = process.env.HOLDER_LEGAL_NAME || "Empresa titular de demostración S.A.";
  const holderTaxId = process.env.HOLDER_TAX_ID || "A00000000";
  const holderFiscalAddress = process.env.HOLDER_FISCAL_ADDRESS || "Calle de demostración, 1";
  const riskInformation = process.env.SITE_RISK_INFORMATION || "Respeta la señalización, utiliza los equipos de protección indicados y sigue las instrucciones del personal responsable del centro.";
  const demoCompanyName = process.env.DEMO_COMPANY_NAME || "Contratista de demostración S.L.";
  const demoCompanyCif = process.env.DEMO_COMPANY_CIF || "B00000000";
  const demoCompanyAddress = process.env.DEMO_COMPANY_ADDRESS || "Avenida de demostración, 2";
  const password = await hashText(adminPassword);

  await db.insert(sites).values({ id: "site-1", name: siteName, slug: siteSlug, riskInformation, riskInformationVersion: 1 })
    .onConflictDoUpdate({ target: sites.id, set: { name: siteName, slug: siteSlug, riskInformation } });
  await db.insert(departments).values({ id: "dept-3", name: departmentName, slug: departmentSlug })
    .onConflictDoUpdate({ target: departments.id, set: { name: departmentName, slug: departmentSlug } });
  await db.insert(allowedAreas).values({
    id: "area-office-basic",
    name: "Oficina",
    slug: "OFICINA",
  }).onConflictDoNothing();
  await db.insert(companies).values({
    id: "company-demo",
    name: demoCompanyName,
    slug: "CONTRATISTA-DEMO",
    cif: demoCompanyCif,
    address: demoCompanyAddress,
  }).onConflictDoUpdate({
    target: companies.id,
    set: { name: demoCompanyName, cif: demoCompanyCif, address: demoCompanyAddress },
  });
  await db.insert(appSettings).values({
    id: "global",
    holderLegalName,
    holderTaxId,
    holderFiscalAddress,
  }).onConflictDoUpdate({
    target: appSettings.id,
    set: { holderLegalName, holderTaxId, holderFiscalAddress },
  });
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

async function main() {
  if (target !== "sqlite") {
    throw new Error("El destino debe ser sqlite");
  }

  if (command === "create") {
    prepareSqlite();
    console.log(`Base de datos SQLite creada en ${databasePath}`);
    return;
  }

  if (command === "migrate") {
    run("pnpm", ["exec", "drizzle-kit", "migrate"]);
    return;
  }

  if (command === "setup") {
    if (mode !== "base") {
      throw new Error("db:setup no acepta --mode; ejecuta db:seed --mode=demo por separado");
    }
    prepareSqlite();
    run("pnpm", ["exec", "drizzle-kit", "migrate"]);
    await seedSqlite();
    return;
  }

  if (command === "reset") {
      console.log(`Restableciendo la base de datos SQLite: ${databasePath}`);
      rmSync(databasePath, { force: true });
      rmSync(`${databasePath}-wal`, { force: true });
      rmSync(`${databasePath}-shm`, { force: true });
      prepareSqlite();
      run("pnpm", ["exec", "drizzle-kit", "migrate"]);
      console.log(`Base de datos SQLite recreada en ${databasePath}`);
    return;
  }

  if (command === "seed") {
    if (mode === "demo") run("pnpm", ["exec", "tsx", "scripts/seed.ts", "--mode=demo"]);
    else await seedSqlite();
    return;
  }

  console.log(`Uso: pnpm db:<comando> [--mode=base|demo]`);
  console.log("Comandos: migrate, setup, reset, seed");
}

main().catch((error) => {
  console.error("Error al ejecutar la operación de base de datos:", error);
  process.exit(1);
});
