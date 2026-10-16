import { and, eq, gte, inArray, isNull, lte, or, sql } from "drizzle-orm";
import { db } from "../../../db/server";
import {
  allowedAreas,
  appSettings,
  auditLogs,
  companies,
  externalWorkers,
  plannedAccessPersons,
  plannedAccesses,
  sites,
  workCategories,
} from "../../../db/schema";

export type ImportRecord = {
  rowNumber: number;
  company: string;
  worker: string;
  legalId: string;
  area: string;
  task: string;
};
export type ImportIssue = { rowNumber: number; label: string; reason: string };

type CompanyRow = typeof companies.$inferSelect;
type CategoryRow = typeof workCategories.$inferSelect;
type AreaRow = typeof allowedAreas.$inferSelect;
type WorkerRow = typeof externalWorkers.$inferSelect;
type PlannedAccessRow = typeof plannedAccesses.$inferSelect;
type PlannedAccessPersonRow = typeof plannedAccessPersons.$inferSelect;

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .trim().replace(/\s+/g, " ").toLocaleLowerCase("es");
}

function normalizeCompany(value: string) {
  return normalize(value).replace(/\./g, "");
}

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toUpperCase();
}

function splitWorkerName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return { firstName: parts[0] ?? name.trim(), lastName: "SIN APELLIDO" };
  if (parts.length === 2) return { firstName: parts[0], lastName: parts[1] };
  if (parts.length === 3) return { firstName: parts[0], lastName: parts[1], secondLastName: parts[2] };
  return { firstName: parts[0], middleName: parts.slice(1, -2).join(" "), lastName: parts.at(-2)!, secondLastName: parts.at(-1)! };
}

function issue(row: ImportRecord, reason: string, label = row.worker || row.company || `Fila ${row.rowNumber}`): ImportIssue {
  return { rowNumber: row.rowNumber, label, reason };
}

function getDateRange(date: string, earlyArrivalToleranceMinutes: number) {
  const [year, month, day] = date.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, day, 0, earlyArrivalToleranceMinutes, 0, 0));
  const end = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
  return { start, end };
}

function sameWorker(worker: WorkerRow, row: ImportRecord, company: CompanyRow, category: CategoryRow) {
  const names = splitWorkerName(row.worker);
  return normalize(worker.firstName) === normalize(names.firstName)
    && normalize(worker.middleName ?? "") === normalize(names.middleName ?? "")
    && normalize(worker.lastName) === normalize(names.lastName)
    && normalize(worker.secondLastName ?? "") === normalize(names.secondLastName ?? "")
    && worker.companyId === company.id
    && worker.workCategoryId === category.id;
}

function analyzeRows(input: {
  records: ImportRecord[];
  siteId: string;
  date: string;
  companies: CompanyRow[];
  categories: CategoryRow[];
  areas: AreaRow[];
  workers: WorkerRow[];
  accesses: PlannedAccessRow[];
  accessPeople: PlannedAccessPersonRow[];
}) {
  const issues: ImportIssue[] = [];
  const accepted: ImportRecord[] = [];
  const companiesByName = new Map(input.companies.map((company) => [normalizeCompany(company.name), company]));
  const categoriesByName = new Map(input.categories.map((category) => [normalize(category.name), category]));
  const areasByName = new Map(input.areas.map((area) => [normalize(area.name), area]));
  const workersByLegalId = new Map(input.workers.map((worker) => [worker.legalId.trim().toUpperCase(), worker]));
  const slugs = new Set(input.companies.map((company) => company.slug));
  const areaSlugs = new Set(input.areas.map((area) => area.slug));
  const accessIds = new Set(input.accesses.map((access) => access.id));
  const peopleByAccess = input.accessPeople.filter((person) => accessIds.has(person.plannedAccessId));
  const idsInOverlappingAccesses = new Set(peopleByAccess.map((person) => person.legalIdSnapshot.trim().toUpperCase()));
  const sameCompanyDate = new Set(input.accesses.map((access) => normalizeCompany(access.companySnapshot)));
  const seenIds = new Set<string>();
  const newCompanySlugs = new Set<string>();
  const newAreaSlugs = new Set<string>();

  for (const row of input.records) {
    const legalId = row.legalId.trim().toUpperCase();
    const companyKey = normalizeCompany(row.company);
    const company = companiesByName.get(companyKey);
    const companySlug = slugify(row.company) || "EMPRESA";
    const categoryKey = normalize(row.task);
    const category = categoriesByName.get(categoryKey);
    const areaKey = normalize(row.area);
    const area = areasByName.get(areaKey);
    const areaSlug = slugify(row.area) || "AREA";
    const worker = workersByLegalId.get(legalId);

    if (seenIds.has(legalId)) {
      issues.push(issue(row, "DNI repetido en el archivo; se omitirá esta fila."));
      continue;
    }
    seenIds.add(legalId);

    if (sameCompanyDate.has(companyKey)) {
      issues.push(issue(row, "Ya existe un acceso planificado para esta empresa y fecha; se omitirá esta fila."));
      continue;
    }
    if (idsInOverlappingAccesses.has(legalId)) {
      issues.push(issue(row, "La persona ya figura en otro acceso planificado con fechas coincidentes; se omitirá."));
      continue;
    }
    if (worker && (!company || !category || !sameWorker(worker, row, company, category))) {
      issues.push(issue(row, "El DNI ya existe con datos de trabajador, empresa o tarea diferentes; se omitirá para evitar conflictos."));
      continue;
    }
    if (!company && (slugs.has(companySlug) || newCompanySlugs.has(companySlug))) {
      issues.push(issue(row, "El código generado para la empresa entra en conflicto; se omitirá esta fila."));
      continue;
    }
    if (!area && (areaSlugs.has(areaSlug) || newAreaSlugs.has(areaSlug))) {
      issues.push(issue(row, "El código generado para el área entra en conflicto en este centro; se omitirá esta fila."));
      continue;
    }

    if (!company) newCompanySlugs.add(companySlug);
    if (!area) newAreaSlugs.add(areaSlug);
    // Reservamos dependencias al aceptar la fila para reutilizarlas en las siguientes.
    if (!company) companiesByName.set(companyKey, { name: row.company, slug: companySlug } as CompanyRow);
    if (!category) categoriesByName.set(categoryKey, { name: row.task } as CategoryRow);
    if (!area) areasByName.set(areaKey, { name: row.area, slug: areaSlug, siteId: input.siteId } as AreaRow);
    accepted.push(row);
  }

  return { accepted, issues };
}

export class DataImportEntity {
  public static async getSites() {
    return db.select({ id: sites.id, name: sites.name }).from(sites).orderBy(sites.name);
  }

  public static async previewPlannedAccessRecords(input: { records: ImportRecord[]; siteId: string; date: string }) {
    const [settings] = await db.select({ earlyArrivalToleranceMinutes: appSettings.earlyArrivalToleranceMinutes }).from(appSettings).limit(1);
    const { start, end } = getDateRange(input.date, settings?.earlyArrivalToleranceMinutes ?? 60);
    const snapshot = await this.loadSnapshot(db, input.siteId, start, end);
    return analyzeRows({ ...snapshot, ...input });
  }

  private static async loadSnapshot(client: typeof db, siteId: string, start: Date, end: Date) {
    const [companyRows, categoryRows, areaRows, workerRows, accessRows] = await Promise.all([
      client.select().from(companies),
      client.select().from(workCategories),
      client.select().from(allowedAreas).where(eq(allowedAreas.siteId, siteId)),
      client.select().from(externalWorkers),
      client.select().from(plannedAccesses).where(and(
        eq(plannedAccesses.siteId, siteId),
        lte(plannedAccesses.expectedStartDatetime, end),
        or(isNull(plannedAccesses.expectedEndDatetime), gte(plannedAccesses.expectedEndDatetime, start)),
      )),
    ]);
    const accessIds = accessRows.map((access) => access.id);
    const accessPeople = accessIds.length
      ? await client.select().from(plannedAccessPersons).where(inArray(plannedAccessPersons.plannedAccessId, accessIds))
      : [];
    return { companies: companyRows, categories: categoryRows, areas: areaRows, workers: workerRows, accesses: accessRows, accessPeople };
  }

  public static async importPlannedAccessRecords(input: {
    records: ImportRecord[];
    siteId: string;
    date: string;
    changedBy: string;
    departmentId: string;
    fileName: string;
  }) {
    return db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(731944205)`);
      const [settings] = await tx.select({ earlyArrivalToleranceMinutes: appSettings.earlyArrivalToleranceMinutes }).from(appSettings).limit(1);
      const { start, end } = getDateRange(input.date, settings?.earlyArrivalToleranceMinutes ?? 60);
      const snapshot = await this.loadSnapshot(tx as unknown as typeof db, input.siteId, start, end);
      const analysis = analyzeRows({ ...snapshot, records: input.records, siteId: input.siteId, date: input.date });
      const companyByName = new Map(snapshot.companies.map((company) => [normalizeCompany(company.name), company]));
      const companySlugs = new Set(snapshot.companies.map((company) => company.slug));
      const categoryByName = new Map(snapshot.categories.map((category) => [normalize(category.name), category]));
      const areaByName = new Map(snapshot.areas.map((area) => [normalize(area.name), area]));
      const areaSlugs = new Set(snapshot.areas.map((area) => area.slug));
      const workerByLegalId = new Map(snapshot.workers.map((worker) => [worker.legalId.trim().toUpperCase(), worker]));
      const imported: Array<ImportRecord & { companyId: string; categoryId: string; areaId: string; workerId: string }> = [];
      const issues = [...analysis.issues];
      let companiesCreated = 0;
      let categoriesCreated = 0;
      let areasCreated = 0;
      let workersCreated = 0;

      for (const row of analysis.accepted) {
        const companyKey = normalizeCompany(row.company);
        let company = companyByName.get(companyKey);
        if (!company) {
          const slug = slugify(row.company) || "EMPRESA";
          if (companySlugs.has(slug)) {
            issues.push(issue(row, "El código generado para la empresa entra en conflicto; se omitió esta fila."));
            continue;
          }
          const [created] = await tx.insert(companies).values({ name: row.company.trim(), slug }).onConflictDoNothing().returning();
          if (!created) {
            issues.push(issue(row, "Conflicto al crear la empresa; se omitió esta fila."));
            continue;
          }
          company = created;
          companiesCreated += 1;
          companyByName.set(companyKey, company);
          companySlugs.add(slug);
        }

        const categoryKey = normalize(row.task);
        let category = categoryByName.get(categoryKey);
        if (!category) {
          const [created] = await tx.insert(workCategories).values({ name: row.task.trim() }).onConflictDoNothing().returning();
          if (!created) {
            issues.push(issue(row, "Conflicto al crear la categoría de trabajo; se omitió esta fila."));
            continue;
          }
          category = created;
          categoriesCreated += 1;
          categoryByName.set(categoryKey, category);
        }

        const areaKey = normalize(row.area);
        let area = areaByName.get(areaKey);
        if (!area) {
          const slug = slugify(row.area) || "AREA";
          if (areaSlugs.has(slug)) {
            issues.push(issue(row, "El código generado para el área entra en conflicto; se omitió esta fila."));
            continue;
          }
          const [created] = await tx.insert(allowedAreas).values({ siteId: input.siteId, name: row.area.trim(), slug }).onConflictDoNothing().returning();
          if (!created) {
            issues.push(issue(row, "Conflicto al crear el área autorizada; se omitió esta fila."));
            continue;
          }
          area = created;
          areasCreated += 1;
          areaByName.set(areaKey, area);
          areaSlugs.add(slug);
        }

        const legalId = row.legalId.trim().toUpperCase();
        let worker = workerByLegalId.get(legalId);
        if (worker && !sameWorker(worker, row, company, category)) {
          issues.push(issue(row, "El DNI ya existe con datos diferentes; se omitió para evitar conflictos."));
          continue;
        }
        if (!worker) {
          const [created] = await tx.insert(externalWorkers).values({
            ...splitWorkerName(row.worker), legalId, companyId: company.id, workCategoryId: category.id,
          }).onConflictDoNothing().returning();
          if (!created) {
            issues.push(issue(row, "Conflicto al crear el trabajador; se omitió esta fila."));
            continue;
          }
          worker = created;
          workersCreated += 1;
          workerByLegalId.set(legalId, worker);
        }
        imported.push({ ...row, companyId: company.id, categoryId: category.id, areaId: area.id, workerId: worker.id });
      }

      const grouped = new Map<string, typeof imported>();
      for (const row of imported) {
        const key = normalizeCompany(row.company);
        const group = grouped.get(key) ?? [];
        group.push(row);
        grouped.set(key, group);
      }

      for (const group of grouped.values()) {
        const first = group[0];
        const [access] = await tx.insert(plannedAccesses).values({
          expectedStartDatetime: start,
          expectedEndDatetime: end,
          companySnapshot: first.company.trim(),
          companyId: first.companyId,
          visitReason: "Acceso de trabajadores externos importado desde Excel",
          requestedById: input.changedBy,
          departmentId: input.departmentId,
          siteId: input.siteId,
          status: "PENDING_APPROVAL",
        }).returning();
        await tx.insert(plannedAccessPersons).values(group.map((row) => ({
          firstNameSnapshot: splitWorkerName(row.worker).firstName,
          middleNameSnapshot: splitWorkerName(row.worker).middleName,
          lastNameSnapshot: splitWorkerName(row.worker).lastName,
          secondLastNameSnapshot: splitWorkerName(row.worker).secondLastName,
          legalIdSnapshot: row.legalId.trim().toUpperCase(),
          externalWorkerId: row.workerId,
          workCategoryId: row.categoryId,
          allowedAreaSnapshot: row.area.trim(),
          allowedAreaId: row.areaId,
          plannedAccessId: access.id,
        })));
        await tx.insert(auditLogs).values({
          entityType: "PlannedAccess",
          entityId: access.id,
          action: "PLANNED_ACCESS_CREATED",
          changedBy: input.changedBy,
          summary: "Acceso planificado creado mediante importación Excel",
          metadata: { sourceFile: input.fileName, importedAt: new Date().toISOString(), personCount: group.length },
        });
      }

      const plannedAccessesCreated = grouped.size;
      const peopleImported = imported.length;
      await tx.insert(auditLogs).values({
        entityType: "DataImport", entityId: crypto.randomUUID(), action: "DATA_IMPORTED",
        changedBy: input.changedBy,
        summary: `Importación de accesos planificados: ${plannedAccessesCreated} accesos, ${peopleImported} personas`,
        metadata: { type: "plannedAccesses", fileName: input.fileName, date: input.date, plannedAccessesCreated,
          peopleImported, companiesCreated, categoriesCreated, areasCreated, workersCreated, skipped: issues.length },
      });
      return { plannedAccessesCreated, peopleImported, companiesCreated, categoriesCreated, areasCreated, workersCreated,
        skipped: issues.length, issues };
    });
  }
}
