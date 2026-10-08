import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { Client } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../db/schema";
import { DatabaseBackupEntity } from "../app/lib/database/backup.server";
import { setDb } from "../db/server";
import { CompanyEntity } from "../app/lib/database/company.server";
import { PlannedAccessEntity } from "../app/lib/database/planned-access.server";
import { AccessLogEntity } from "../app/lib/database/access-log.server";
import { ExternalWorkerEntity } from "../app/lib/database/external-worker.server";
import { reviewPlannedAccessPerson } from "../app/lib/services/planned-access-review.server";

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

  it("busca en todos los catálogos de combobox sin distinguir mayúsculas y minúsculas", async () => {
    await database.insert(schema.companies).values({ id: "search-company", name: "Empresa Mixta", slug: "SEARCH" });
    await database.insert(schema.workCategories).values({ id: "search-category", name: "Pruebas" });
    await database.insert(schema.allowedAreas).values({ id: "search-area", name: "Almacén", slug: "SEARCH" });
    await database.insert(schema.users).values({ id: "search-user", fullName: "Pruebas", username: "search-user",
      password: "test", siteId: "site-target", departmentId: "dept-test" });
    await database.insert(schema.externalWorkers).values({ id: "search-worker", firstName: "Ana", lastName: "García",
      legalId: "X1234567Z", companyId: "search-company", workCategoryId: "search-category" });
    await database.insert(schema.accessLogs).values({ id: "search-access", entryTimestamp: new Date(),
      entrySignatureEnvelope: {}, companyNameSnapshot: "Empresa Mixta", firstNameSnapshot: "Ana", lastNameSnapshot: "García",
      legalIdSnapshot: "X1234567Z", approvedBySnapshot: "María López", visitReason: "Pruebas",
      siteId: "site-target", createdById: "search-user" });
    for (const query of ["alma", "ALMA", "AlMa"]) {
      expect(await AccessLogEntity.searchDistinctAllowedAreas(query)).toContainEqual({ id: "search-area", name: "Almacén" });
    }
    for (const query of ["maría", "MARÍA", "MaRíA"]) {
      expect(await AccessLogEntity.searchDistinctApprovedBy(query)).toContainEqual({ name: "María López" });
    }
    for (const query of ["ana", "ANA", "aNa", "garcía", "GARCÍA", "x1234567z", "X1234567Z"]) {
      expect((await ExternalWorkerEntity.search(query)).map((worker) => worker.id)).toContain("search-worker");
    }
    for (const query of ["empresa mixta", "EMPRESA MIXTA", "EmPrEsA MiXtA"]) {
      expect((await CompanyEntity.searchByName(query)).map((company) => company.id)).toContain("search-company");
    }
  });

  it("mantiene la relación de una empresa validada y evita crearla si la solicitud cambió", async () => {
    await database.insert(schema.companies).values({ id: "company-validation", name: "TÉCNICA   S.L.", slug: "TECNICA" });
    expect(await CompanyEntity.findNameMatches("  tecnica sl ")).toHaveLength(1);
    await database.insert(schema.companies).values({ id: "company-ambiguous", name: "Tecnica SL", slug: "TECNICA-2" });
    expect(await CompanyEntity.findNameMatches("tecnica sl")).toHaveLength(2);
    expect(await CompanyEntity.findNameMatches("tecncia sl")).toHaveLength(0);
    await database.insert(schema.users).values({ id: "validator", fullName: "Validador", username: "validator",
      password: "test", siteId: "site-target", departmentId: "dept-test" });
    await database.insert(schema.plannedAccesses).values({ id: "pending-company", companySnapshot: "Tecnnica SL",
      visitReason: "Prueba de empresa", expectedStartDatetime: new Date(), requestedById: "validator",
      siteId: "site-target", departmentId: "dept-test" });
    const pending = await PlannedAccessEntity.findById("pending-company");
    expect(pending?.companyId).toBeNull();
    const linked = await PlannedAccessEntity.validateCompany({ id: pending!.id, expectedUpdatedAt: pending!.updatedAt,
      companyId: "company-validation" });
    expect(linked?.companyId).toBe("company-validation");
    expect((await PlannedAccessEntity.findById(pending!.id))?.company?.name).toBe("TÉCNICA   S.L.");
    expect(await PlannedAccessEntity.validateCompany({ id: pending!.id, expectedUpdatedAt: pending!.updatedAt,
      newCompany: { name: "No debe crearse", slug: "NO-CREAR" } })).toBeNull();
    expect(await CompanyEntity.findBySlug("NO-CREAR")).toBeNull();
    await database.insert(schema.plannedAccesses).values({ id: "pending-new-company", companySnapshot: "Nueva",
      visitReason: "Nueva empresa", expectedStartDatetime: new Date(), requestedById: "validator",
      siteId: "site-target", departmentId: "dept-test" });
    const newPending = await PlannedAccessEntity.findById("pending-new-company");
    const created = await PlannedAccessEntity.validateCompany({ id: newPending!.id, expectedUpdatedAt: newPending!.updatedAt,
      newCompany: { name: "Empresa Nueva Validada", slug: "NUEVA-VALIDADA", cif: "B87654321" } });
    expect(created?.companyId).toBeTruthy();
    expect((await PlannedAccessEntity.findById(newPending!.id))?.company?.cif).toBe("B87654321");
  });
  it("guarda decisiones directas por persona sin documentos y exige motivo al rechazar", async () => {
    await database.insert(schema.users).values({ id: "review-admin", fullName: "Administrador", username: "review-admin",
      password: "test", role: "ADMIN", siteId: "site-target", departmentId: "dept-test" });
    await database.insert(schema.workCategories).values({ id: "review-category", name: "Trabajo con requisitos",
      requiresTraining: true, requiresSpecialPermission: true, requiresWorkPermit: true });
    const request = await PlannedAccessEntity.create({ companyId: "company-validation", companySnapshot: "Técnica",
      visitReason: "Revisión directa", expectedStartDatetime: new Date(), requestedById: "review-admin",
      siteId: "site-target", departmentId: "dept-test", persons: [
        { firstNameSnapshot: "Ana", lastNameSnapshot: "Prueba", legalIdSnapshot: "REVIEW-A", workCategoryId: "review-category", allowedAreaSnapshot: "Área nueva de revisión" },
        { firstNameSnapshot: "Luis", lastNameSnapshot: "Prueba", legalIdSnapshot: "REVIEW-B", workCategoryId: "review-category", allowedAreaSnapshot: "Almacén", allowedAreaId: "search-area" },
      ] });
    const first = request!.plannedAccessPersons.find((person) => person.legalIdSnapshot === "REVIEW-A")!;
    const second = request!.plannedAccessPersons.find((person) => person.legalIdSnapshot === "REVIEW-B")!;
    const options = { authorUsername: "review-admin" };
    expect(await reviewPlannedAccessPerson({ id: request!.id, personId: first.id, expectedUpdatedAt: request!.updatedAt,
      decision: "APPROVED" }, options)).toMatchObject({ success: true, status: "PENDING_APPROVAL" });
    const current = (await PlannedAccessEntity.findById(request!.id))!;
    const approved = current.plannedAccessPersons.find((person) => person.id === first.id)!;
    expect(approved.decision).toMatchObject({ accessDecision: "APPROVED", workDecision: "NOT_REQUIRED" });
    expect(approved.externalWorkerId).toBeTruthy();
    expect(approved.allowedAreaId).toBeTruthy();
    expect(await reviewPlannedAccessPerson({ id: request!.id, personId: second.id, expectedUpdatedAt: current.updatedAt,
      decision: "DENIED", reason: " " }, options)).toMatchObject({ success: false });
    expect(await reviewPlannedAccessPerson({ id: request!.id, personId: second.id, expectedUpdatedAt: request!.updatedAt,
      decision: "DENIED", reason: "No autorizado" }, options)).toMatchObject({ success: false });
    expect(await reviewPlannedAccessPerson({ id: request!.id, personId: second.id, expectedUpdatedAt: current.updatedAt,
      decision: "DENIED", reason: "No autorizado" }, options)).toMatchObject({ success: true, status: "APPROVED" });
    const final = (await PlannedAccessEntity.findById(request!.id))!;
    expect(final.plannedAccessPersons.find((person) => person.id === second.id)?.decision)
      .toMatchObject({ accessDecision: "DENIED", decisionReason: "No autorizado" });
    expect(await ExternalWorkerEntity.findByLegalId("REVIEW-B")).toBeNull();
    expect(await reviewPlannedAccessPerson({ id: request!.id, personId: second.id, expectedUpdatedAt: final.updatedAt,
      decision: "APPROVED" }, options)).toMatchObject({ success: false });
  });
});
