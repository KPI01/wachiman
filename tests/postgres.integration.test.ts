import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { Client } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../db/schema";
import { DatabaseBackupEntity } from "../app/lib/database/backup.server";
import { setDb } from "../db/server";

const databaseUrl = process.env.DATABASE_URL_TEST;
const enabled = Boolean(databaseUrl && new URL(databaseUrl).pathname.endsWith("_test"));
const integration = describe.skipIf(!enabled);

integration("persistencia y restauración PostgreSQL", () => {
  const client = new Client({ connectionString: databaseUrl });
  const database = drizzle({ client, schema });

  beforeAll(async () => {
    if (!databaseUrl || !new URL(databaseUrl).pathname.endsWith("_test")) {
      throw new Error("DATABASE_URL_TEST debe apuntar a una base de datos desechable cuyo nombre termine en _test.");
    }
    await client.connect();
    setDb(database as never);
    await client.query("DROP SCHEMA IF EXISTS drizzle CASCADE; DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
    const { migrate } = await import("drizzle-orm/node-postgres/migrator");
    await migrate(database, { migrationsFolder: "db/migrations-postgres" });
  });

  afterAll(async () => {
    await client.end();
  });

  it("aplica la migración inicial y crea las relaciones PostgreSQL", async () => {
    const result = await client.query<{ table_name: string }>(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users'",
    );
    expect(result.rows).toHaveLength(1);
    const foreignKeys = await client.query<{ constraint_name: string }>(
      "SELECT constraint_name FROM information_schema.table_constraints WHERE constraint_type = 'FOREIGN KEY' AND table_name = 'users'",
    );
    expect(foreignKeys.rows.map((row) => row.constraint_name)).toEqual(
      expect.arrayContaining(["users_site_id_sites_id_fk", "users_department_id_departments_id_fk"]),
    );
  });

  it("actualiza por ID, mantiene registros exclusivos del destino y revierte colisiones únicas", async () => {
    await database.insert(schema.sites).values([
      { id: "site-target", name: "Solo destino", slug: "DESTINO" },
      { id: "site-collision", name: "Existente", slug: "COLISION" },
    ]);
    await database.insert(schema.departments).values({ id: "dept-test", name: "Pruebas", slug: "PRUEBAS" });

    const base = await DatabaseBackupEntity.exportAll();
    const backup = Object.fromEntries(Object.keys(base).map((table) => [table, []])) as typeof base;
    backup.sites = [
      { id: "site-target", name: "Actualizado desde respaldo", slug: "DESTINO" },
      { id: "site-import-first", name: "Primera importación", slug: "IMPORTADO" },
    ];
    await DatabaseBackupEntity.importAll(backup, "integration-test", async () => 0);

    const merged = await database.select().from(schema.sites).where(eq(schema.sites.id, "site-target"));
    expect(merged[0]?.name).toBe("Actualizado desde respaldo");
    await expect(database.select().from(schema.sites).where(eq(schema.sites.id, "site-import-first")))
      .resolves.toHaveLength(1);
    await expect(database.select().from(schema.sites).where(eq(schema.sites.id, "site-collision")))
      .resolves.toHaveLength(1);

    const conflicting = Object.fromEntries(Object.keys(base).map((table) => [table, []])) as typeof base;
    conflicting.sites = [
      { id: "site-rollback-check", name: "Debe revertirse", slug: "NO-COLISION" },
      { id: "site-other-id", name: "Colisión", slug: "COLISION" },
    ];
    await expect(DatabaseBackupEntity.importAll(conflicting, "integration-test", async () => 0)).rejects.toMatchObject({
      cause: { code: "23505" },
    });
    await expect(database.select().from(schema.sites).where(eq(schema.sites.id, "site-rollback-check")))
      .resolves.toHaveLength(0);
  });
});
