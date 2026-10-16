import { eq, sql } from "drizzle-orm";
import { db } from "../../../db/server";
import { allowedAreas, auditLogs, companies, externalWorkers, sites, workCategories } from "../../../db/schema";

export type ImportRecord = { rowNumber: number; company: string; worker: string; legalId: string; area: string; task: string };
export type ImportType = "companies" | "workers" | "workCategories" | "allowedAreas";
export type ImportIssue = { rowNumber: number; label: string; reason: string };
export type WorkCategoryRequirements = {
  requiresTraining: boolean;
  requiresSpecialPermission: boolean;
  requiresWorkPermit: boolean;
};

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

function issue(row: ImportRecord, reason: string, label = row.worker || row.company || row.area || row.task || `Fila ${row.rowNumber}`): ImportIssue {
  return { rowNumber: row.rowNumber, label, reason };
}

export class DataImportEntity {
  public static async getSites() {
    return db.select({ id: sites.id, name: sites.name }).from(sites).orderBy(sites.name);
  }

  public static async previewRecords(input: { type: ImportType; records: ImportRecord[]; siteId?: string }) {
    const issues: ImportIssue[] = [];
    const accepted: ImportRecord[] = [];
    const companyRows = await db.select({ name: companies.name, slug: companies.slug }).from(companies);
    const companyNames = new Set(companyRows.map((row) => normalizeCompany(row.name)));
    const companySlugs = new Set(companyRows.map((row) => row.slug));
    const categoryRows = await db.select({ name: workCategories.name }).from(workCategories);
    const categoryNames = new Set(categoryRows.map((row) => normalize(row.name)));

    if (input.type === "companies") {
      const seenNames = new Set<string>();
      const seenSlugs = new Set<string>();
      for (const row of input.records) {
        const name = row.company.trim();
        const normalizedName = normalizeCompany(name);
        const slug = slugify(name) || "EMPRESA";
        if (companyNames.has(normalizedName)) issues.push(issue(row, "La empresa ya existe; se omitirá."));
        else if (seenNames.has(normalizedName)) issues.push(issue(row, "Empresa repetida en el archivo; se usará la primera fila."));
        else if (companySlugs.has(slug) || seenSlugs.has(slug)) issues.push(issue(row, "El código de empresa entra en conflicto con otro registro; se omitirá."));
        else { accepted.push(row); seenNames.add(normalizedName); seenSlugs.add(slug); }
      }
    } else if (input.type === "workCategories") {
      const seen = new Set<string>();
      for (const row of input.records) {
        const key = normalize(row.task);
        if (categoryNames.has(key)) issues.push(issue(row, "El tipo de trabajo ya existe; se omitirá."));
        else if (seen.has(key)) issues.push(issue(row, "Tarea repetida en el archivo; se usará la primera fila."));
        else { accepted.push(row); seen.add(key); }
      }
    } else if (input.type === "allowedAreas") {
      const [site] = input.siteId ? await db.select({ id: sites.id }).from(sites).where(eq(sites.id, input.siteId)).limit(1) : [];
      if (!site) throw new Error("Selecciona un centro válido para importar áreas autorizadas.");
      const existingAreas = await db.select({ name: allowedAreas.name, slug: allowedAreas.slug })
        .from(allowedAreas).where(eq(allowedAreas.siteId, site.id));
      const names = new Set(existingAreas.map((row) => normalize(row.name)));
      const slugs = new Set(existingAreas.map((row) => row.slug));
      for (const row of input.records) {
        const name = row.area.trim();
        const key = normalize(name);
        const slug = slugify(name) || "AREA";
        if (names.has(key)) issues.push(issue(row, "El área ya existe en este centro; se omitirá."));
        else if (slugs.has(slug)) issues.push(issue(row, "El código del área entra en conflicto con otra del centro; se omitirá."));
        else { accepted.push(row); names.add(key); slugs.add(slug); }
      }
    } else {
      const workers = await db.select({ legalId: externalWorkers.legalId }).from(externalWorkers);
      const legalIds = new Set(workers.map((row) => row.legalId.trim().toUpperCase()));
      const seen = new Set<string>();
      for (const row of input.records) {
        const id = row.legalId.trim().toUpperCase();
        if (legalIds.has(id)) issues.push(issue(row, "Ya existe un trabajador con este DNI; no se modificará."));
        else if (seen.has(id)) issues.push(issue(row, "DNI repetido en el archivo; se usará la primera fila."));
        else if (!categoryNames.has(normalize(row.task))) issues.push(issue(row, `No existe el tipo de trabajo «${row.task}»; impórtalo antes de los trabajadores.`));
        else { accepted.push(row); seen.add(id); }
      }
    }
    return { accepted, issues };
  }

  public static async importRecords(input: {
    type: ImportType;
    records: ImportRecord[];
    siteId?: string;
    changedBy: string;
    workCategoryRequirements?: Record<string, WorkCategoryRequirements>;
  }) {
    return db.transaction(async (tx) => {
      // Serializa importaciones simultáneas para que el segundo proceso vuelva a evaluar duplicados.
      await tx.execute(sql`select pg_advisory_xact_lock(731944205)`);
      const issues: ImportIssue[] = [];
      let imported = 0;
      let skipped = 0;
      let createdDependencies = 0;
      const companyRows = await tx.select().from(companies);
      const companyByName = new Map(companyRows.map((row) => [normalizeCompany(row.name), row]));
      const companySlugs = new Set(companyRows.map((row) => row.slug));
      const categoryRows = await tx.select().from(workCategories);
      const categoryByName = new Map(categoryRows.map((row) => [normalize(row.name), row]));

      if (input.type === "companies") {
        for (const row of input.records) {
          const name = row.company.trim();
          const key = normalizeCompany(name);
          const slug = slugify(name) || "EMPRESA";
          if (companyByName.has(key) || companySlugs.has(slug)) {
            skipped += 1;
            issues.push(issue(row, companyByName.has(key) ? "La empresa ya existe; se omitió." : "El código de empresa está ocupado; se omitió."));
            continue;
          }
          const [created] = await tx.insert(companies).values({ name, slug }).onConflictDoNothing().returning();
          if (!created) {
            skipped += 1;
            issues.push(issue(row, "Conflicto con una empresa existente; se omitió."));
            continue;
          }
          companyByName.set(key, created);
          companySlugs.add(slug);
          imported += 1;
        }
      }

      if (input.type === "workCategories") {
        for (const row of input.records) {
          const key = normalize(row.task);
          if (categoryByName.has(key)) {
            skipped += 1;
            issues.push(issue(row, "El tipo de trabajo ya existe; se omitió."));
            continue;
          }
          const requirements = input.workCategoryRequirements?.[key] ?? {
            requiresTraining: true, requiresSpecialPermission: true, requiresWorkPermit: true,
          };
          const [created] = await tx.insert(workCategories).values({ name: row.task.trim(), ...requirements }).returning();
          if (!created) {
            skipped += 1;
            issues.push(issue(row, "No se pudo crear el tipo de trabajo; se omitió."));
            continue;
          }
          categoryByName.set(key, created);
          imported += 1;
        }
      }

      if (input.type === "allowedAreas") {
        const [site] = input.siteId ? await tx.select().from(sites).where(eq(sites.id, input.siteId)).limit(1) : [];
        if (!site) throw new Error("Selecciona un centro válido para importar áreas autorizadas.");
        const areaRows = await tx.select().from(allowedAreas).where(eq(allowedAreas.siteId, site.id));
        const names = new Set(areaRows.map((row) => normalize(row.name)));
        const slugs = new Set(areaRows.map((row) => row.slug));
        for (const row of input.records) {
          const name = row.area.trim();
          const key = normalize(name);
          const slug = slugify(name) || "AREA";
          if (names.has(key) || slugs.has(slug)) {
            skipped += 1;
            issues.push(issue(row, names.has(key) ? "El área ya existe en este centro; se omitió." : "El código del área está ocupado; se omitió."));
            continue;
          }
          const [created] = await tx.insert(allowedAreas).values({ siteId: site.id, name, slug }).onConflictDoNothing().returning();
          if (!created) {
            skipped += 1;
            issues.push(issue(row, "Conflicto con un área existente; se omitió."));
            continue;
          }
          names.add(key);
          slugs.add(slug);
          imported += 1;
        }
      }

      if (input.type === "workers") {
        const existingWorkers = await tx.select({ legalId: externalWorkers.legalId }).from(externalWorkers);
        const legalIds = new Set(existingWorkers.map((row) => row.legalId.trim().toUpperCase()));
        for (const row of input.records) {
          const legalId = row.legalId.trim().toUpperCase();
          if (legalIds.has(legalId)) {
            skipped += 1;
            issues.push(issue(row, "Ya existe un trabajador con este DNI; no se modificó."));
            continue;
          }
          const task = categoryByName.get(normalize(row.task));
          if (!task) {
            skipped += 1;
            issues.push(issue(row, `No existe el tipo de trabajo «${row.task}»; se omitió.`));
            continue;
          }
          const companyName = row.company.trim();
          let company = companyByName.get(normalizeCompany(companyName));
          if (!company) {
            const slug = slugify(companyName) || "EMPRESA";
            if (companySlugs.has(slug)) {
              skipped += 1;
              issues.push(issue(row, `El código de empresa para «${companyName}» está ocupado; se omitió el trabajador.`));
              continue;
            }
            const [createdCompany] = await tx.insert(companies).values({ name: companyName, slug }).onConflictDoNothing().returning();
            if (!createdCompany) {
              skipped += 1;
              issues.push(issue(row, `Conflicto al crear la empresa «${companyName}»; se omitió el trabajador.`));
              continue;
            }
            company = createdCompany;
            companyByName.set(normalizeCompany(company.name), company);
            companySlugs.add(slug);
            createdDependencies += 1;
          }
          const [createdWorker] = await tx.insert(externalWorkers).values({
            ...splitWorkerName(row.worker), legalId, companyId: company.id, workCategoryId: task.id,
          }).onConflictDoNothing().returning();
          if (!createdWorker) {
            skipped += 1;
            issues.push(issue(row, "Conflicto con un trabajador existente; se omitió."));
            continue;
          }
          legalIds.add(legalId);
          imported += 1;
        }
      }

      await tx.insert(auditLogs).values({
        entityType: "DataImport", entityId: crypto.randomUUID(), action: "DATA_IMPORTED",
        changedBy: input.changedBy,
        summary: `Importación de ${input.type}: ${imported} registros creados`,
        metadata: { type: input.type, imported, skipped, createdDependencies, issueCount: issues.length },
      });
      return { imported, skipped, createdDependencies, issues };
    });
  }
}
