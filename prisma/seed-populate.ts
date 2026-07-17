import "dotenv/config";

import { randomBytes, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";

import { PrismaClient } from "./generated/prisma/client";
import type { Prisma } from "./generated/prisma/client";
import { createLocalPrismaClient } from "./lib";
import { encryptValue } from "../app/lib/crypt.server";

const scrypt = promisify(scryptCallback);

const SALT_LENGTH = 16;
const KEY_LENGTH = 64;
const HASH_SEPARATOR = ":";
const DEMO_PASSWORD = "demo123";

async function hashText(text: string) {
  const salt = randomBytes(SALT_LENGTH).toString("hex");
  const derivedKey = (await scrypt(text, salt, KEY_LENGTH)) as Buffer;
  return `${salt}${HASH_SEPARATOR}${derivedKey.toString("hex")}`;
}

function randomSignatureEnvelope() {
  const strokesCount = Math.floor(Math.random() * 3) + 2;
  const strokes = [];
  for (let s = 0; s < strokesCount; s++) {
    const points = [];
    let x = 10 + Math.random() * 20;
    let y = Math.random() * 60 + 20;
    for (let p = 0; p < Math.floor(Math.random() * 8) + 5; p++) {
      points.push({ x: Math.round(x), y: Math.round(y) });
      x += Math.random() * 30 + 10;
      y += Math.random() * 30 - 15;
    }
    strokes.push(points);
  }
  return encryptValue(JSON.stringify({ strokes }));
}

function randomLegalId(): string {
  const letter = "XYZ"[Math.floor(Math.random() * 3)];
  const number = Math.floor(1000000 + Math.random() * 9000000);
  const control = "TRWAGMYFPDXBNJZSQVHLCKE"[number % 23];
  return `${letter}${number}${control}`;
}

function randomPhone(): string {
  return `6${Math.floor(10000000 + Math.random() * 90000000)}`;
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysAgo(n: number): Date {
  const d = startOfToday();
  d.setDate(d.getDate() - n);
  return d;
}

function daysFromNow(n: number): Date {
  const d = startOfToday();
  d.setDate(d.getDate() + n);
  return d;
}

function hoursAgo(n: number): Date {
  const d = new Date();
  d.setHours(d.getHours() - n);
  return d;
}

function randomMinutesBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomCif(): string {
  const prefix = "B";
  return `${prefix}${pad(Math.floor(Math.random() * 99999999))}`;
}

function randomEmail(company: string): string {
  const slug = company
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 8);
  return `info@${slug}.com`;
}

const FIRST_NAMES = [
  "Juan", "María", "Carlos", "Ana", "Pedro", "Laura",
  "Javier", "Sofía", "Diego", "Elena", "Andrés", "Carmen",
  "Miguel", "Isabel", "Fernando", "Rosa", "Alberto", "Claudia",
] as const;

const LAST_NAMES = [
  "García", "López", "Martínez", "Rodríguez", "Sánchez",
  "Gómez", "Fernández", "Ruiz", "Díaz", "Moreno",
  "Álvarez", "Romero", "Navarro", "Torres", "Domínguez",
] as const;

const VISIT_REASONS = [
  "Entrega de mercancía",
  "Mantenimiento de equipos de refrigeración",
  "Reunión con proveedor",
  "Inspección de seguridad laboral",
  "Reparación de fontanería",
  "Auditoría interna de calidad",
  "Capacitación del personal",
  "Instalación de software de control",
  "Revisión de maquinaria pesada",
  "Entrega de insumos de limpieza",
  "Supervisión de obra civil",
  "Toma de muestras de laboratorio",
  "Mantenimiento preventivo de calderas",
  "Inspección sanitaria",
  "Reunión de coordinación de turnos",
] as const;

const VEHICLE_TYPES = [
  "Automóvil", "Furgoneta", "Camión", "Motocicleta",
] as const;

const VEHICLE_BRANDS = [
  "Ford", "Mercedes-Benz", "Iveco", "Renault", "Volkswagen",
  "Toyota", "Nissan", "Seat",
] as const;

const VEHICLE_MODELS: Record<string, string[]> = {
  Automóvil: ["Focus", "Golf", "Civic", "Corolla", "Clio"],
  Furgoneta: ["Transit", "Vito", "Daily", "Master", "Transporter"],
  Camión: ["Actros", "Stralis", "TGA", "FH", "XF"],
  Motocicleta: ["CBF 125", "GS 310", "MT-07", "SV 650"],
};

const SITES_DATA = [
  { name: "Planta Principal", slug: "PRINCIPAL", address: "Av. Industrial 1500, Parque Logístico" },
  { name: "Almacén Norte", slug: "ALMACEN-NORTE", address: "Polígono Norte, Nave 8-A" },
  { name: "Centro de Distribución", slug: "CENTRO-DISTRIBUCION", address: "Ruta 5 Sur Km 120, Sector El Bosque" },
] as const;

const DEPARTMENTS_DATA = [
  { name: "Gerencia General", slug: "GERENCIA" },
  { name: "Producción", slug: "PRODUCCION" },
  { name: "Logística", slug: "LOGISTICA" },
  { name: "Mantenimiento", slug: "MANTENIMIENTO" },
  { name: "Administración", slug: "ADMINISTRACION" },
] as const;

type UserRole = "ADMIN" | "ACCESS_OPERATOR" | "ACCESS_MONITOR" | "SECURITY_MANAGER" | "ACCESS_APPROVER" | "ACCESS_REQUESTER";

const USERS_DATA = [
  { fullName: "Admin Principal", username: "admin.principal", role: "ADMIN" as UserRole, siteIdx: 0, deptIdx: 0 },
  { fullName: "Operador Principal", username: "operador.principal", role: "ACCESS_OPERATOR" as UserRole, siteIdx: 0, deptIdx: 1 },
  { fullName: "Operador Almacén", username: "operador.almacen", role: "ACCESS_OPERATOR" as UserRole, siteIdx: 1, deptIdx: 2 },
  { fullName: "Operador CD", username: "operador.cd", role: "ACCESS_OPERATOR" as UserRole, siteIdx: 2, deptIdx: 2 },
  { fullName: "Monitor Accesos", username: "monitor.principal", role: "ACCESS_MONITOR" as UserRole, siteIdx: 0, deptIdx: 3 },
  { fullName: "Director Seguridad", username: "segur.principal", role: "SECURITY_MANAGER" as UserRole, siteIdx: 0, deptIdx: 0 },
  { fullName: "Aprobador Principal", username: "aprobador.principal", role: "ACCESS_APPROVER" as UserRole, siteIdx: 0, deptIdx: 3 },
  { fullName: "Solicitante Principal", username: "solicitante.principal", role: "ACCESS_REQUESTER" as UserRole, siteIdx: 0, deptIdx: 4 },
  { fullName: "Solicitante Norte", username: "solicitante.norte", role: "ACCESS_REQUESTER" as UserRole, siteIdx: 1, deptIdx: 4 },
] as const;

const COMPANIES_DATA = [
  { name: "Fruveco S.A.", address: "Av. Industrial 1500", phone: "600700800", email: "" },
  { name: "Transportes del Sur Ltda.", address: "Calle Los Carrera 234", phone: "600700801", email: "" },
  { name: "Mantenimientos Integrales García", address: "Pasaje Las Rosas 56", phone: "600700802", email: "" },
  { name: "Seguridad Privada Cóndor S.A.", address: "Av. Libertador 890", phone: "600700803", email: "" },
  { name: "Servicios de Limpieza Industrial", address: "Calle Nueva 1234", phone: "600700804", email: "" },
  { name: "Consultoría Técnica Martínez", address: "Av. del Parque 567", phone: "600700805", email: "" },
] as const;

const WORK_CATEGORIES_DATA = [
  { name: "Transportista", description: "Conductor de vehículos de carga", requiresSpecialPermission: false, requiresTraining: true },
  { name: "Técnico de mantenimiento", description: "Mantenimiento de maquinaria industrial", requiresSpecialPermission: true, requiresTraining: true },
  { name: "Supervisor de obra", description: "Supervisión de obras civiles y montajes", requiresSpecialPermission: true, requiresTraining: false },
  { name: "Personal de limpieza", description: "Limpieza de instalaciones", requiresSpecialPermission: false, requiresTraining: false },
  { name: "Guardia de seguridad", description: "Vigilancia y control perimetral", requiresSpecialPermission: true, requiresTraining: true },
  { name: "Consultor externo", description: "Asesorías técnicas y auditorías", requiresSpecialPermission: false, requiresTraining: false },
] as const;

const EXTERNAL_WORKERS_DATA = [
  { firstName: "Ricardo", lastName: "Fuentes", companyIdx: 0, categoryIdx: 0 },
  { firstName: "Luis", lastName: "Carrasco", companyIdx: 0, categoryIdx: 0 },
  { firstName: "Héctor", lastName: "Vargas", companyIdx: 0, categoryIdx: 0 },
  { firstName: "Manuel", lastName: "Paredes", companyIdx: 1, categoryIdx: 1 },
  { firstName: "Felipe", lastName: "Ortiz", companyIdx: 1, categoryIdx: 1 },
  { firstName: "Óscar", lastName: "Rojas", companyIdx: 1, categoryIdx: 1 },
  { firstName: "Patricio", lastName: "Muñoz", companyIdx: 2, categoryIdx: 2 },
  { firstName: "Alejandro", lastName: "Castillo", companyIdx: 2, categoryIdx: 2 },
  { firstName: "Mariana", lastName: "Vera", companyIdx: 3, categoryIdx: 3 },
  { firstName: "Gloria", lastName: "Reyes", companyIdx: 3, categoryIdx: 3 },
  { firstName: "Sandra", lastName: "Flores", companyIdx: 3, categoryIdx: 3 },
  { firstName: "Roberto", lastName: "Silva", companyIdx: 4, categoryIdx: 4 },
  { firstName: "Cristian", lastName: "Herrera", companyIdx: 4, categoryIdx: 4 },
  { firstName: "Jorge", lastName: "Campos", companyIdx: 4, categoryIdx: 4 },
  { firstName: "Víctor", lastName: "Peña", companyIdx: 5, categoryIdx: 5 },
  { firstName: "Cecilia", lastName: "Cruz", companyIdx: 5, categoryIdx: 5 },
  { firstName: "Natalia", lastName: "León", companyIdx: 0, categoryIdx: 0 },
  { firstName: "Eduardo", lastName: "Morales", companyIdx: 1, categoryIdx: 1 },
] as const;

function randomDocumentFileName(workerName: string, type: "IDENTIFICATION" | "TRAINING"): string {
  const clean = workerName.toLowerCase().replace(/\s+/g, "-");
  if (type === "IDENTIFICATION") {
    return `dni-${clean}.pdf`;
  }
  const certNum = Math.floor(Math.random() * 999) + 1;
  return `certificado-${clean}-${String(certNum).padStart(3, "0")}.pdf`;
}

const DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
] as const;

async function main() {
  const prisma = createLocalPrismaClient();

  const counts: Record<string, number> = {};

  try {
    console.log("🌱 [seed-populate] Iniciando poblado de datos demo...\n");

    const hashedPassword = await hashText(DEMO_PASSWORD);

    // ─── Sites ───
    const sites = [];
    for (const s of SITES_DATA) {
      const site = await prisma.site.upsert({
        where: { slug: s.slug },
        update: { name: s.name, address: s.address },
        create: s,
      });
      sites.push(site);
    }
    counts.Sitios = sites.length;
    console.log(`  ✔ Sitios: ${sites.length}`);

    // ─── Departments ───
    const departments = [];
    for (const d of DEPARTMENTS_DATA) {
      const dept = await prisma.department.upsert({
        where: { slug: d.slug },
        update: { name: d.name },
        create: d,
      });
      departments.push(dept);
    }
    counts.Departamentos = departments.length;

    // ─── Users ───
    const users: Record<string, { id: string; fullName: string; role: UserRole; siteId: string }> = {};
    for (const u of USERS_DATA) {
      const site = sites[u.siteIdx];
      const dept = departments[u.deptIdx];
      const created = await prisma.user.upsert({
        where: { username: u.username },
        update: {
          fullName: u.fullName,
          password: hashedPassword,
          role: u.role,
          isActive: true,
          isTrashed: false,
          siteId: site.id,
          departmentId: dept.id,
        },
        create: {
          fullName: u.fullName,
          username: u.username,
          password: hashedPassword,
          role: u.role,
          isActive: true,
          isTrashed: false,
          siteId: site.id,
          departmentId: dept.id,
        },
      });
      users[u.username] = { id: created.id, fullName: created.fullName, role: u.role, siteId: site.id };
    }
    counts.Usuarios = Object.keys(users).length;

    // ─── Companies ───
    const companies = [];
    for (const c of COMPANIES_DATA) {
      const slug = c.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
        .slice(0, 50);
      const cif = randomCif();
      const email = c.email || randomEmail(c.name);
      const company = await prisma.company.upsert({
        where: { slug },
        update: {
          name: c.name,
          address: c.address,
          phone: c.phone,
          email,
          cif,
        },
        create: {
          name: c.name,
          slug,
          address: c.address,
          phone: c.phone,
          email,
          cif,
        },
      });
      companies.push(company);
    }
    counts.Empresas = companies.length;

    // ─── Work Categories ───
    const workCategories = [];
    for (const w of WORK_CATEGORIES_DATA) {
      const slug = w.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      const existing = await prisma.workCategory.findFirst({ where: { name: w.name } });
      let category;
      if (existing) {
        category = await prisma.workCategory.update({
          where: { id: existing.id },
          data: {
            description: w.description,
            requiresSpecialPermission: w.requiresSpecialPermission,
            requiresTraining: w.requiresTraining,
          },
        });
      } else {
        category = await prisma.workCategory.create({
          data: { ...w },
        });
      }
      workCategories.push(category);
    }
    counts["Categorías de trabajo"] = workCategories.length;

    // ─── External Workers ───
    const externalWorkers = [];
    for (const ew of EXTERNAL_WORKERS_DATA) {
      const company = companies[ew.companyIdx];
      const category = workCategories[ew.categoryIdx];
      let legalId = randomLegalId();
      const existingById = await prisma.externalWorker.findUnique({ where: { legalId } });
      if (existingById) {
        legalId = randomLegalId();
      }
      const worker = await prisma.externalWorker.upsert({
        where: { legalId },
        update: {
          firstName: ew.firstName,
          lastName: ew.lastName,
          phoneNumber: randomPhone(),
          workCategoryId: category.id,
          companyId: company.id,
        },
        create: {
          firstName: ew.firstName,
          lastName: ew.lastName,
          legalId,
          phoneNumber: randomPhone(),
          workCategoryId: category.id,
          companyId: company.id,
        },
      });
      externalWorkers.push(worker);
    }
    counts["Trabajadores externos"] = externalWorkers.length;

    // ─── Worker Documents ───
    let docCount = 0;
    for (const worker of externalWorkers) {
      const workerName = `${worker.firstName} ${worker.lastName}`;

      // Identification document
      await prisma.workerDocument.create({
        data: {
          documentType: "IDENTIFICATION",
          status: "VALIDATED",
          fileName: randomDocumentFileName(workerName, "IDENTIFICATION"),
          filePath: `/uploads/workers/${worker.id}/dni.pdf`,
          fileSize: Math.floor(Math.random() * 500000) + 50000,
          mimeType: pick(DOCUMENT_MIME_TYPES),
          expiryDate: daysFromNow(Math.floor(Math.random() * 365) + 180),
          externalWorkerId: worker.id,
        },
      });
      docCount++;

      // Training certificate for workers in categories that require training
      const category = workCategories.find((c) => c.id === worker.workCategoryId);
      if (category?.requiresTraining) {
        const isExpired = Math.random() < 0.25;
        await prisma.workerDocument.create({
          data: {
            documentType: "TRAINING",
            status: isExpired ? "EXPIRED" : "VALIDATED",
            fileName: randomDocumentFileName(workerName, "TRAINING"),
            filePath: `/uploads/workers/${worker.id}/certificado.pdf`,
            fileSize: Math.floor(Math.random() * 300000) + 30000,
            mimeType: "application/pdf",
            expiryDate: isExpired ? daysAgo(Math.floor(Math.random() * 90) + 1) : daysFromNow(Math.floor(Math.random() * 180) + 30),
            externalWorkerId: worker.id,
            notes: isExpired ? "Requiere renovación urgente" : null,
          },
        });
        docCount++;
      }
    }
    counts.Documentos = docCount;

    // ─── Access Logs ───
    const operatorPrincipal = users["operador.principal"];
    const operatorAlmacen = users["operador.almacen"];
    const operatorCD = users["operador.cd"];

    const accessLogsToCreate = 60;
    const createdAccessLogIds: string[] = [];

    // Pre-create some external worker-linked logs
    const workerLogCount = Math.floor(externalWorkers.length * 0.7);

    for (let i = 0; i < accessLogsToCreate; i++) {
      const site = pick(sites);
      let createdBy;
      if (site.id === sites[1].id) {
        createdBy = operatorAlmacen;
      } else if (site.id === sites[2].id) {
        createdBy = operatorCD;
      } else {
        createdBy = operatorPrincipal;
      }

      const daysBack = Math.abs(Math.floor((Math.random() - 0.15) * 28));
      const isInside = i < 22;
      const entryTimestamp = daysBack === 0
        ? hoursAgo(randomMinutesBetween(1, 480) / 60)
        : daysAgo(daysBack);
      if (entryTimestamp.getTime() > Date.now()) {
        entryTimestamp.setTime(Date.now() - randomMinutesBetween(10, 480) * 60000);
      }

      const exitTimestamp = isInside
        ? null
        : new Date(entryTimestamp.getTime() + randomMinutesBetween(30, 480) * 60000);
      if (exitTimestamp && exitTimestamp.getTime() > Date.now()) {
        exitTimestamp.setTime(Date.now() - randomMinutesBetween(1, 30) * 60000);
      }

      const withVehicle = Math.random() > 0.55;
      const firstName = pick(FIRST_NAMES);
      const lastName = pick(LAST_NAMES);

      let vehicleId: string | null = null;
      if (withVehicle) {
        const vtype = pick(VEHICLE_TYPES);
        const vbrand = pick(VEHICLE_BRANDS);
        const vmodels = VEHICLE_MODELS[vtype] ?? ["Modelo X"];
        const vehicle = await prisma.accessLogVehicle.create({
          data: {
            typeSnapshot: vtype,
            brandSnapshot: vbrand,
            modelSnapshot: pick(vmodels),
            plateSnapshot: `${pick(["A", "B", "C", "D"])}${pick(["A", "B", "C", "D"])}${pad(Math.floor(Math.random() * 999) + 1)}-${Math.floor(Math.random() * 99) + 1}`,
          },
        });
        vehicleId = vehicle.id;
      }

      const exitRecordedById = exitTimestamp ? createdBy.id : null;
      const useExternalWorker = i < workerLogCount && externalWorkers.length > 0;
      const extWorker = useExternalWorker ? pick(externalWorkers) : null;
      const companyName = extWorker
        ? companies.find((c) => c.id === extWorker.companyId)?.name ?? pick(COMPANIES_DATA).name
        : pick(COMPANIES_DATA).name;

      const log = await prisma.accessLog.create({
        data: {
          entryTimestamp,
          entrySignatureEnvelope: randomSignatureEnvelope(),
          exitTimestamp,
          exitSignatureEnvelope: exitTimestamp ? randomSignatureEnvelope() : undefined,
          companyNameSnapshot: companyName,
          firstNameSnapshot: extWorker?.firstName ?? firstName,
          lastNameSnapshot: extWorker?.lastName ?? lastName,
          middleNameSnapshot: Math.random() > 0.7 ? pick(FIRST_NAMES) : null,
          secondLastNameSnapshot: Math.random() > 0.7 ? pick(LAST_NAMES) : null,
          phoneNumber: extWorker?.phoneNumber ?? randomPhone(),
          legalIdSnapshot: extWorker?.legalId ?? randomLegalId(),
          withVehicle,
          visitReason: pick(VISIT_REASONS),
          siteId: site.id,
          createdById: createdBy.id,
          exitRecordedById,
          vehicleAccessLogId: vehicleId,
          externalWorkerId: extWorker?.id ?? null,
        },
      });
      createdAccessLogIds.push(log.id);
    }
    counts["Registros de acceso"] = createdAccessLogIds.length;

    // ─── Planned Accesses ───
    const solicitantePrincipal = users["solicitante.principal"];
    const solicitanteNorte = users["solicitante.norte"];
    const aprobadorPrincipal = users["aprobador.principal"];

    const plannedStatuses = [
      "PENDING_APPROVAL",
      "APPROVED",
      "REJECTED",
      "CANCELED",
      "EXPIRED",
      "USED",
      "PARTIALLY_USED",
    ] as const;

    const plannedAccessesToCreate = 15;
    const createdPlannedIds: string[] = [];

    for (let i = 0; i < plannedAccessesToCreate; i++) {
      const status = plannedStatuses[i % plannedStatuses.length];
      const site = pick(sites);
      const requestor = site.id === sites[1].id ? solicitanteNorte : solicitantePrincipal;

      const isFuture = i < 7;
      const expectedStart = isFuture
        ? daysFromNow(Math.floor(Math.random() * 14) + 1)
        : daysAgo(Math.floor(Math.random() * 14) + 1);
      const expectedEnd = new Date(
        expectedStart.getTime() + randomMinutesBetween(60, 480) * 60000,
      );

      const personCount = Math.floor(Math.random() * 3) + 1;
      const persons: Array<{
        firstNameSnapshot: string;
        lastNameSnapshot: string;
        phoneNumber: string;
        legalIdSnapshot: string;
        externalWorkerId?: string;
      }> = [];
      const usedLegalIds = new Set<string>();

      for (let p = 0; p < personCount; p++) {
        let legalId: string;
        let extWorkerId: string | undefined;
        if (p < externalWorkers.length && Math.random() > 0.4) {
          const ew = pick(externalWorkers);
          legalId = ew.legalId;
          extWorkerId = ew.id;
        } else {
          legalId = randomLegalId();
          while (usedLegalIds.has(legalId)) {
            legalId = randomLegalId();
          }
        }
        usedLegalIds.add(legalId);
        persons.push({
          firstNameSnapshot: extWorkerId
            ? externalWorkers.find((w) => w.id === extWorkerId)?.firstName ?? pick(FIRST_NAMES)
            : pick(FIRST_NAMES),
          lastNameSnapshot: extWorkerId
            ? externalWorkers.find((w) => w.id === extWorkerId)?.lastName ?? pick(LAST_NAMES)
            : pick(LAST_NAMES),
          phoneNumber: randomPhone(),
          legalIdSnapshot: legalId,
          externalWorkerId: extWorkerId,
        });
      }

      const approvedAt =
        status === "APPROVED" || status === "USED" || status === "PARTIALLY_USED"
          ? daysAgo(Math.floor(Math.random() * 7) + 1)
          : status === "REJECTED"
            ? daysAgo(Math.floor(Math.random() * 3) + 1)
            : null;

      const pa = await prisma.plannedAccess.create({
        data: {
          expectedStartDatetime: expectedStart,
          expectedEndDatetime: expectedEnd,
          status,
          companySnapshot: pick(COMPANIES_DATA).name,
          visitReason: pick(VISIT_REASONS),
          approvedAt,
          approvedById: aprobadorPrincipal.id,
          requestedById: requestor.id,
          siteId: site.id,
          plannedAccessPersons: {
            create: persons,
          },
        },
      });
      createdPlannedIds.push(pa.id);
    }
    counts["Accesos planificados"] = createdPlannedIds.length;

    // ─── Link some AccessLogs to PlannedAccesses ───
    const approvedOrUsed = createdPlannedIds.filter((_, idx) => {
      const status = plannedStatuses[idx % plannedStatuses.length];
      return status === "USED" || status === "PARTIALLY_USED" || status === "APPROVED";
    });
    let linkedCount = 0;
    for (let i = 0; i < Math.min(approvedOrUsed.length, 10); i++) {
      const log = createdAccessLogIds[i * 2];
      if (log) {
        const plannedAccess = await prisma.plannedAccess.findUnique({
          where: { id: approvedOrUsed[i] },
          include: { plannedAccessPersons: { take: 1 } },
        });
        if (plannedAccess && plannedAccess.plannedAccessPersons.length > 0) {
          await prisma.accessLog.update({
            where: { id: log },
            data: {
              plannedAccessId: plannedAccess.id,
              plannedAccessPersonId: plannedAccess.plannedAccessPersons[0].id,
            },
          });
          linkedCount++;
        }
      }
    }
    counts["Accesos vinculados a planificados"] = linkedCount;

    // ─── Audit Logs ───
    const adminUser = users["admin.principal"];
    const auditActions: Array<{
      entityType: string;
      action: string;
      summary: string;
      metadata?: Record<string, unknown>;
      daysBack: number;
    }> = [
      { entityType: "User", action: "LOGIN", summary: "Inicio de sesión exitoso", daysBack: 0 },
      { entityType: "User", action: "CREATE", summary: "Usuario creado: operador.almacen", daysBack: 12 },
      { entityType: "User", action: "UPDATE", summary: "Usuario admin.principal actualizado", daysBack: 10 },
      { entityType: "Site", action: "CREATE", summary: "Sitio creado: Almacén Norte", daysBack: 14 },
      { entityType: "Site", action: "UPDATE", summary: "Dirección de Planta Principal actualizada", daysBack: 8 },
      { entityType: "Department", action: "CREATE", summary: "Departamento creado: Logística", daysBack: 13 },
      { entityType: "Company", action: "CREATE", summary: "Empresa creada: Seguridad Privada Cóndor", daysBack: 11 },
      { entityType: "Company", action: "UPDATE", summary: "Teléfono de Transportes del Sur actualizado", daysBack: 7 },
      { entityType: "WorkCategory", action: "CREATE", summary: "Categoría creada: Guardia de seguridad", daysBack: 10 },
      { entityType: "ExternalWorker", action: "CREATE", summary: "Trabajador externo registrado: Ricardo Fuentes", daysBack: 9 },
      { entityType: "ExternalWorker", action: "UPDATE", summary: "Documento de Luis Carrasco actualizado", daysBack: 5 },
      { entityType: "WorkerDocument", action: "CREATE", summary: "DNI cargado para Manuel Paredes", daysBack: 8 },
      { entityType: "WorkerDocument", action: "ARCHIVE", summary: "Certificado expirado archivado", daysBack: 3 },
      { entityType: "AccessLog", action: "CREATE", summary: "Registro de entrada creado", daysBack: 1, metadata: { site: "PRINCIPAL" } },
      { entityType: "AccessLog", action: "UPDATE", summary: "Salida registrada para acceso #A-1023", daysBack: 0 },
      { entityType: "AccessLog", action: "UPDATE", summary: "Salida registrada para acceso #A-1024", daysBack: 0 },
      { entityType: "PlannedAccess", action: "CREATE", summary: "Acceso planificado solicitado", daysBack: 6, metadata: { status: "PENDING_APPROVAL" } },
      { entityType: "PlannedAccess", action: "APPROVE", summary: "Acceso planificado aprobado", daysBack: 4, metadata: { status: "APPROVED" } },
      { entityType: "PlannedAccess", action: "REJECT", summary: "Acceso planificado rechazado por falta de documentación", daysBack: 3, metadata: { reason: "Documentación incompleta" } },
      { entityType: "PlannedAccess", action: "CANCEL", summary: "Acceso planificado cancelado por el solicitante", daysBack: 2 },
      { entityType: "User", action: "PASSWORD_RESET", summary: "Contraseña restablecida para solicitante.norte", daysBack: 5 },
      { entityType: "ExternalWorker", action: "CREATE", summary: "Trabajador externo registrado: Sandra Flores", daysBack: 7 },
      { entityType: "Company", action: "UPDATE", summary: "CIF de Consultoría Técnica Martínez actualizado", daysBack: 6 },
      { entityType: "WorkerDocument", action: "EXPIRE", summary: "Certificado de Roberto Silva marcado como expirado", daysBack: 2 },
      { entityType: "AccessLog", action: "CREATE", summary: "Registro de entrada con vehículo", daysBack: 1, metadata: { withVehicle: true } },
    ];

    for (const entry of auditActions) {
      const createdAt = entry.daysBack === 0
        ? hoursAgo(randomMinutesBetween(1, 480) / 60)
        : daysAgo(entry.daysBack);
      if (createdAt.getTime() > Date.now()) {
        createdAt.setTime(Date.now() - 60000);
      }

      await prisma.auditLog.create({
        data: {
          entityType: entry.entityType,
          entityId: `seed-demo-${Math.random().toString(36).slice(2, 10)}`,
          action: entry.action,
          changedBy: adminUser.fullName,
          summary: entry.summary,
          metadata: entry.metadata as Prisma.InputJsonValue | undefined,
          createdAt,
        },
      });
    }
    counts["Registros de auditoría"] = auditActions.length;

    // ─── Summary ───
    console.log("");
    console.log("─────────────────────────────────────────");
    console.log("  ✅ seed-populate completado");
    console.log("─────────────────────────────────────────");
    console.log("");
    for (const [key, value] of Object.entries(counts)) {
      console.log(`  ${key.padEnd(35)} ${value}`);
    }
    console.log("");
    console.log("  Credenciales de prueba (contraseña: demo123):");
    console.log("  ─────────────────────────────────────────────");
    for (const u of USERS_DATA) {
      console.log(`    ${u.username.padEnd(28)} → ${u.role}`);
    }
    console.log("");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("[seed-populate] Error:", error);
  process.exit(1);
});
