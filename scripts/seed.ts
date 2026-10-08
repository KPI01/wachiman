import { config as loadEnv } from "dotenv";

loadEnv({ quiet: true });
import { closeDatabasePool, createPostgresDb } from "../db/client";
import {
  accessLogs,
  accessLogVehicles,
  allowedAreas,
  appSettings,
  auditLogs,
  companies,
  departments,
  externalWorkers,
  plannedAccessPersons,
  plannedAccesses,
  sites,
  users,
  workCategories,
  workerDocuments,
} from "../db/schema";
import { hashText } from "../app/lib/hash.server";
import { normalizeUsername } from "../app/lib/username";
import { encryptValue } from "../app/lib/crypt.server";

const now = new Date();
const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
const tomorrowMidnight = new Date(todayMidnight);
tomorrowMidnight.setDate(tomorrowMidnight.getDate() + 1);
const yesterdayMidnight = new Date(todayMidnight);
yesterdayMidnight.setDate(yesterdayMidnight.getDate() - 1);
const twoDaysAgo = new Date(todayMidnight);
twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
const lastWeek = new Date(todayMidnight);
lastWeek.setDate(lastWeek.getDate() - 7);

function at(date: Date, hours: number, minutes = 0) {
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

function demoLegalId(index: number) {
  const number = String(80_000_000 + index).padStart(8, "0");
  const letters = "TRWAGMYFPDXBNJZSQVHLCKE";
  return `${number}${letters[Number(number) % letters.length]}`;
}

function demoId(prefix: string, index: number, width = 4) {
  return `${prefix}${String(index).padStart(width, "0")}`;
}

async function main() {
  const db = createPostgresDb();

  const mode = process.argv.includes("--mode=demo") ? "demo" : "base";
  const adminFullName = process.env.ADMIN_FULL_NAME || "Administrador";
  const adminUsername = normalizeUsername(process.env.ADMIN_USERNAME || "admin");
  const adminPassword = process.env.ADMIN_PASSWORD || "demo123";
  const siteName = process.env.SITE_NAME || "Sitio principal";
  const siteSlug = process.env.SITE_SLUG || "PRINCIPAL";
  const departmentName = process.env.DEPARTMENT_NAME || "General";
  const departmentSlug = process.env.DEPARTMENT_SLUG || "GENERAL";

  const adminPwd = await hashText(adminPassword);

  await db.insert(sites).values({
    id: "site-1",
    name: siteName,
    slug: siteSlug,
  }).onConflictDoNothing();
  await db.insert(departments).values({
    id: "dept-3",
    name: departmentName,
    slug: departmentSlug,
  }).onConflictDoNothing();
  await db.insert(users).values({
    id: "user-1",
    fullName: adminFullName,
    username: adminUsername,
    password: adminPwd,
    role: "ADMIN",
    siteId: "site-1",
    departmentId: "dept-3",
  }).onConflictDoNothing();

  await db.insert(allowedAreas).values({
    id: "area-office-basic",
    name: "Oficina",
    slug: "OFICINA",
  }).onConflictDoNothing();
  await db.insert(appSettings).values({ id: "global" }).onConflictDoNothing();

  if (mode === "base") {
    console.log(`Seed básico completado. Usuario administrador: ${adminUsername}`);
    await closeDatabasePool();
    return;
  }

  const operPwd = await hashText("demo123");
  const monPwd = await hashText("demo123");
  const reqPwd = await hashText("demo123");

  await db.insert(sites).values([
    { id: "site-1", name: "Fabrica 1", slug: "FAB1", address: "Pol. Ind. Oeste, Murcia" },
    { id: "site-2", name: "Oficinas Centrales", slug: "OFC", address: "Avda. General 42, Murcia" },
  ]).onConflictDoNothing();

  await db.insert(departments).values([
    { id: "dept-1", name: "Seguridad", slug: "SEG" },
    { id: "dept-2", name: "Mantenimiento", slug: "MANT" },
    { id: "dept-3", name: "Administracion", slug: "ADMIN" },
    { id: "dept-4", name: "Produccion", slug: "PROD" },
  ]).onConflictDoNothing();

  await db.insert(companies).values([
    { id: "company-1", name: "Construcciones Murcianas SL", slug: "CONSMUR", cif: "B-12345678", address: "Pol. Ind. San Gines, Murcia", phone: "968123456", email: "info@consmur.com" },
    { id: "company-2", name: "Grupo Electrica Levante SA", slug: "GELSA", cif: "A-87654321", address: "Avda. Libertad 23, Murcia", phone: "968654321", email: "admin@grupoelectrica.es" },
    { id: "company-3", name: "Transportes Martinez SL", slug: "TRAMAR", cif: "B-55667788", address: "C/ Comercio 15, Murcia", phone: "968112233", email: "tfno@tramar.com" },
  ]).onConflictDoNothing();

  await db.insert(workCategories).values([
    { id: "wc-0", name: "General", description: "Tipo de trabajo por defecto", requiresSpecialPermission: false, requiresTraining: false },
    { id: "wc-1", name: "Electricista", description: "Instalacion y mantenimiento electrico", requiresSpecialPermission: true, requiresTraining: true },
    { id: "wc-2", name: "Albanil", description: "Obra y reformas", requiresSpecialPermission: false, requiresTraining: false },
    { id: "wc-3", name: "Soldador", description: "Trabajos de soldadura", requiresSpecialPermission: true, requiresTraining: true },
    { id: "wc-4", name: "Transportista", description: "Carga y descarga de mercancias", requiresSpecialPermission: false, requiresTraining: false },
    { id: "wc-5", name: "Tecnico de climatizacion", description: "Mantenimiento de climatizacion", requiresSpecialPermission: true, requiresTraining: true },
  ]).onConflictDoNothing();

  await db.insert(allowedAreas).values([
    { id: "area-plant", name: "Planta de producción", slug: "PLANTA-PRODUCCION" },
    { id: "area-warehouse", name: "Almacén", slug: "ALMACEN" },
    { id: "area-office", name: "Oficinas", slug: "OFICINAS" },
    { id: "area-loading", name: "Zona de carga", slug: "ZONA-CARGA" },
  ]).onConflictDoNothing();

  await db.insert(users).values([
    { id: "user-1", fullName: "Administrador", username: "admin", password: adminPwd, role: "ADMIN", isActive: true, isTrashed: false, siteId: "site-1", departmentId: "dept-3" },
    { id: "user-2", fullName: "Carlos Segura", username: "operador", password: operPwd, role: "ACCESS_OPERATOR", isActive: true, isTrashed: false, siteId: "site-1", departmentId: "dept-1" },
    { id: "user-3", fullName: "Maria Vigilancia", username: "monitor", password: monPwd, role: "ACCESS_MONITOR", isActive: true, isTrashed: false, siteId: "site-2", departmentId: "dept-1" },
    { id: "user-4", fullName: "Juan Proveedores", username: "proveedores", password: reqPwd, role: "ACCESS_REQUESTER", isActive: true, isTrashed: false, siteId: "site-1", departmentId: "dept-4" },
  ]).onConflictDoNothing();

  await db.insert(externalWorkers).values([
    { id: "worker-1", firstName: "Antonio", middleName: "Jose", lastName: "Lopez", secondLastName: "Garcia", phoneNumber: "600111222", legalId: "12345678A", companyId: "company-1", workCategoryId: "wc-1" },
    { id: "worker-2", firstName: "Maria", lastName: "Rodriguez", secondLastName: "Perez", phoneNumber: "600222333", legalId: "87654321B", companyId: "company-1", workCategoryId: "wc-2" },
    { id: "worker-3", firstName: "Francisco", middleName: "Javier", lastName: "Martinez", secondLastName: "Lopez", phoneNumber: "600333444", legalId: "11223344C", companyId: "company-2", workCategoryId: "wc-3" },
    { id: "worker-4", firstName: "Laura", lastName: "Sanchez", secondLastName: "Garcia", phoneNumber: "600444555", legalId: "44332211D", companyId: "company-2", workCategoryId: "wc-5" },
    { id: "worker-5", firstName: "Pedro", lastName: "Fernandez", secondLastName: "Martinez", phoneNumber: "600555666", legalId: "55667788E", companyId: "company-3", workCategoryId: "wc-4" },
    { id: "worker-6", firstName: "Sofia", middleName: "Maria", lastName: "Gonzalez", secondLastName: "Ramos", phoneNumber: "600666777", legalId: "99887766F", companyId: "company-3", workCategoryId: "wc-1" },
  ]).onConflictDoNothing();

  await db.insert(workerDocuments).values([
    { id: "doc-1", documentType: "IDENTIFICATION", recordType: "IDENTITY_CREDENTIAL", status: "VALIDATED", fileName: "DNI_Antonio.pdf", filePath: "workers/worker-1/doc-1-DNI_Antonio.pdf", fileSize: 245760, mimeType: "application/pdf", validUntil: new Date("2028-06-15T00:00:00.000Z"), expiryBasis: "LAW", externalWorkerId: "worker-1" },
    { id: "doc-2", documentType: "TRAINING", recordType: "TRAINING_EVIDENCE", status: "VALIDATED", fileName: "Curso_electricidad_2026.pdf", filePath: "workers/worker-1/doc-2-Curso_electricidad_2026.pdf", fileSize: 512000, mimeType: "application/pdf", validUntil: null, expiryBasis: "NOT_APPLICABLE", externalWorkerId: "worker-1" },
    { id: "doc-3", documentType: "IDENTIFICATION", recordType: "IDENTITY_CREDENTIAL", status: "VALIDATED", fileName: "DNI_MariaR.pdf", filePath: "workers/worker-2/doc-3-DNI_MariaR.pdf", fileSize: 250000, mimeType: "application/pdf", validUntil: new Date("2029-11-30T00:00:00.000Z"), expiryBasis: "LAW", externalWorkerId: "worker-2" },
    { id: "doc-4", documentType: "IDENTIFICATION", recordType: "IDENTITY_CREDENTIAL", status: "VALIDATED", fileName: "DNI_Francisco.pdf", filePath: "workers/worker-3/doc-4-DNI_Francisco.pdf", fileSize: 240000, mimeType: "application/pdf", validUntil: new Date("2027-08-15T00:00:00.000Z"), expiryBasis: "LAW", externalWorkerId: "worker-3" },
    { id: "doc-5", documentType: "TRAINING", recordType: "TRAINING_EVIDENCE", status: "EXPIRED", fileName: "Curso_soldadura_2024.pdf", filePath: "workers/worker-3/doc-5-Curso_soldadura_2024.pdf", fileSize: 480000, mimeType: "application/pdf", validUntil: new Date("2025-01-10T00:00:00.000Z"), expiryBasis: "ISSUER", notes: "Curso caducado", externalWorkerId: "worker-3" },
    { id: "doc-6", documentType: "IDENTIFICATION", recordType: "IDENTITY_CREDENTIAL", status: "VALIDATED", fileName: "DNI_Pedro.pdf", filePath: "workers/worker-5/doc-6-DNI_Pedro.pdf", fileSize: 235000, mimeType: "application/pdf", validUntil: new Date("2028-05-20T00:00:00.000Z"), expiryBasis: "LAW", externalWorkerId: "worker-5" },
  ]).onConflictDoNothing();

  await db.insert(plannedAccesses).values([
    { id: "pa-1", expectedStartDatetime: at(tomorrowMidnight, 8), expectedEndDatetime: at(tomorrowMidnight, 18), status: "APPROVED", companySnapshot: "Construcciones Murcianas SL", visitReason: "Reparacion de instalacion electrica en nave 3", approvedById: "user-1", requestedById: "user-4", departmentId: "dept-4", siteId: "site-1" },
    { id: "pa-2", expectedStartDatetime: at(tomorrowMidnight, 9), status: "PENDING_APPROVAL", companySnapshot: "Grupo Electrica Levante SA", visitReason: "Mantenimiento climatizacion oficinas", approvedById: "user-1", requestedById: "user-4", departmentId: "dept-4", siteId: "site-2" },
    { id: "pa-3", expectedStartDatetime: at(lastWeek, 8), expectedEndDatetime: at(lastWeek, 15), status: "USED", companySnapshot: "Transportes Martinez SL", visitReason: "Carga de mercancia en almacen", approvedById: "user-1", requestedById: "user-4", departmentId: "dept-4", siteId: "site-1" },
  ]).onConflictDoNothing();

  await db.insert(plannedAccessPersons).values([
    { id: "pap-1", firstNameSnapshot: "Antonio", middleNameSnapshot: "Jose", lastNameSnapshot: "Lopez", secondLastNameSnapshot: "Garcia", phoneNumber: "600111222", legalIdSnapshot: "12345678A", plannedAccessId: "pa-1", workCategoryId: "wc-1", allowedAreaId: "area-plant", externalWorkerId: "worker-1" },
    { id: "pap-2", firstNameSnapshot: "Maria", lastNameSnapshot: "Rodriguez", secondLastNameSnapshot: "Perez", phoneNumber: "600222333", legalIdSnapshot: "87654321B", plannedAccessId: "pa-1", workCategoryId: "wc-2", allowedAreaId: "area-warehouse", externalWorkerId: "worker-2" },
    { id: "pap-3", firstNameSnapshot: "Francisco", middleNameSnapshot: "Javier", lastNameSnapshot: "Martinez", secondLastNameSnapshot: "Lopez", phoneNumber: "600333444", legalIdSnapshot: "11223344C", plannedAccessId: "pa-2", workCategoryId: "wc-3", allowedAreaId: "area-office", externalWorkerId: "worker-3" },
    { id: "pap-4", firstNameSnapshot: "Laura", lastNameSnapshot: "Sanchez", secondLastNameSnapshot: "Garcia", phoneNumber: "600444555", legalIdSnapshot: "44332211D", plannedAccessId: "pa-2", workCategoryId: "wc-5", allowedAreaId: "area-office", externalWorkerId: "worker-4" },
    { id: "pap-5", firstNameSnapshot: "Pedro", lastNameSnapshot: "Fernandez", secondLastNameSnapshot: "Martinez", phoneNumber: "600555666", legalIdSnapshot: "55667788E", plannedAccessId: "pa-3", workCategoryId: "wc-4", allowedAreaId: "area-loading", externalWorkerId: "worker-5" },
    { id: "pap-6", firstNameSnapshot: "Sofia", middleNameSnapshot: "Maria", lastNameSnapshot: "Gonzalez", secondLastNameSnapshot: "Ramos", phoneNumber: "600666777", legalIdSnapshot: "99887766F", plannedAccessId: "pa-3", workCategoryId: "wc-1", allowedAreaId: "area-plant", externalWorkerId: "worker-6" },
  ]).onConflictDoNothing();

  await db.insert(accessLogVehicles).values([
    { id: "vehicle-1", typeSnapshot: "Camion", brandSnapshot: "Iveco", modelSnapshot: "Eurocargo", plateSnapshot: "1234ABC" },
  ]).onConflictDoNothing();

  const log1entry = at(yesterdayMidnight, 7, 30);
  const log1exit = at(yesterdayMidnight, 16);
  const log2entry = at(yesterdayMidnight, 8);
  const log2exit = at(yesterdayMidnight, 17, 30);
  const log3entry = now;
  const log4entry = now;

  const demoEnvelope = await encryptValue(
    JSON.stringify({
      strokes: [[[0.08, 0.62], [0.24, 0.28], [0.41, 0.7], [0.63, 0.34], [0.92, 0.55]]],
    }),
  );

  const demoLogs: Array<typeof accessLogs.$inferInsert> = [
    {
      id: "log-1",
      entryTimestamp: log1entry,
      entrySignatureEnvelope: demoEnvelope,
      exitTimestamp: log1exit,
      exitSignatureEnvelope: demoEnvelope,
      companyNameSnapshot: "Construcciones Murcianas SL",
      firstNameSnapshot: "Antonio",
      middleNameSnapshot: "Jose",
      lastNameSnapshot: "Lopez",
      secondLastNameSnapshot: "Garcia",
      phoneNumber: "600111222",
      legalIdSnapshot: "12345678A",
      allowedAreaSnapshot: "Zona de carga",
      allowedAreaId: "area-loading",
      approvedBySnapshot: "Administrador",
      withVehicle: false,
      visitReason: "Trabajos electricos",
      siteId: "site-1",
      createdById: "user-2",
      externalWorkerId: "worker-1",
      plannedAccessId: "pa-3",
      plannedAccessPersonId: "pap-5",
    },
    {
      id: "log-2",
      entryTimestamp: log2entry,
      entrySignatureEnvelope: demoEnvelope,
      exitTimestamp: log2exit,
      exitSignatureEnvelope: demoEnvelope,
      companyNameSnapshot: "Transportes Martinez SL",
      firstNameSnapshot: "Pedro",
      lastNameSnapshot: "Fernandez",
      secondLastNameSnapshot: "Martinez",
      phoneNumber: "600555666",
      legalIdSnapshot: "55667788E",
      allowedAreaSnapshot: "Planta de producción",
      allowedAreaId: "area-plant",
      approvedBySnapshot: "Administrador",
      withVehicle: true,
      visitReason: "Transporte de materiales",
      siteId: "site-1",
      createdById: "user-2",
      vehicleAccessLogId: "vehicle-1",
      externalWorkerId: "worker-5",
      plannedAccessId: "pa-3",
      plannedAccessPersonId: "pap-6",
    },
    {
      id: "log-3",
      entryTimestamp: log3entry,
      entrySignatureEnvelope: demoEnvelope,
      companyNameSnapshot: "Grupo Electrica Levante SA",
      firstNameSnapshot: "Francisco",
      middleNameSnapshot: "Javier",
      lastNameSnapshot: "Martinez",
      secondLastNameSnapshot: "Lopez",
      legalIdSnapshot: "11223344C",
      allowedAreaSnapshot: "Oficinas",
      allowedAreaId: "area-office",
      approvedBySnapshot: "Carlos Segura",
      withVehicle: false,
      visitReason: "Trabajos de soldadura",
      siteId: "site-1",
      createdById: "user-2",
    },
    {
      id: "log-4",
      entryTimestamp: log4entry,
      entrySignatureEnvelope: demoEnvelope,
      companyNameSnapshot: "Construcciones Murcianas SL",
      firstNameSnapshot: "Maria",
      lastNameSnapshot: "Rodriguez",
      secondLastNameSnapshot: "Perez",
      legalIdSnapshot: "87654321B",
      allowedAreaSnapshot: "Almacén",
      allowedAreaId: "area-warehouse",
      approvedBySnapshot: "Administrador",
      withVehicle: false,
      visitReason: "Visita programada",
      siteId: "site-1",
      createdById: "user-2",
      plannedAccessId: "pa-1",
      plannedAccessPersonId: "pap-2",
    },
  ];
  await db.insert(accessLogs).values(demoLogs).onConflictDoNothing();

  const demoFirstNames = [
    "Lucía", "Hugo", "Martina", "Mateo", "Sofía", "Leo", "Valeria", "Daniel",
    "Carmen", "Pablo", "Alba", "Mario", "Paula", "Álvaro", "Nora", "Diego",
    "Irene", "Adrián", "Claudia", "Marcos", "Elena", "Gabriel", "Aitana", "Bruno",
  ];
  const demoLastNames = [
    "García", "Martín", "López", "Sánchez", "Pérez", "Gómez", "Fernández", "Ruiz",
    "Díaz", "Moreno", "Muñoz", "Álvarez", "Romero", "Alonso", "Gutiérrez", "Navarro",
    "Torres", "Domínguez", "Vázquez", "Ramos", "Gil", "Ramírez", "Serrano", "Molina",
  ];

  const demoSiteRows = Array.from({ length: 4 }, (_, index) => ({
    id: demoId("demo-site-", index + 3),
    name: ["Centro Logístico Norte", "Planta de Envasado", "Almacén Central", "Sede Técnica"][index],
    slug: `DEMO-SITE-${String(index + 3).padStart(2, "0")}`,
    address: [
      "Polígono Industrial Norte, Murcia",
      "Carretera de Alicante, km 12",
      "Avenida del Transporte, 18",
      "Calle de la Innovación, 6",
    ][index],
  }));
  await db.insert(sites).values(demoSiteRows).onConflictDoNothing();
  const siteIds = ["site-1", "site-2", ...demoSiteRows.map((site) => site.id)];

  const demoDepartmentNames = [
    "Logística", "Calidad", "Ingeniería", "Servicios Generales", "Expediciones", "Prevención",
  ];
  const demoDepartmentRows = demoDepartmentNames.map((name, index) => ({
    id: demoId("demo-dept-", index + 1),
    name,
    slug: `DEMO-DEPT-${String(index + 1).padStart(2, "0")}`,
  }));
  await db.insert(departments).values(demoDepartmentRows).onConflictDoNothing();
  const departmentIds = [
    "dept-1", "dept-2", "dept-3", "dept-4",
    ...demoDepartmentRows.map((department) => department.id),
  ];

  const demoCompanyNames = [
    "Servicios Industriales del Sureste SL",
    "Mantenimientos Vega SA",
    "Logística del Mediterráneo SL",
    "Montajes y Calderería Levante SL",
    "Limpiezas Profesionales del Sur SL",
    "Clima y Energía Murcia SL",
    "Obras Técnicas del Segura SL",
    "Suministros La Huerta SA",
    "Elevación Segura SL",
    "Transportes Costa Cálida SL",
    "Instalaciones Eléctricas del Este SL",
    "Control Ambiental Iberia SL",
  ];
  const demoCompanyRows = demoCompanyNames.map((name, index) => ({
    id: demoId("demo-company-", index + 1),
    name,
    cif: `B${String(70_000_000 + index * 137).padStart(8, "0")}`,
    address: `Polígono Industrial ${["Oeste", "Este", "Norte", "Sur"][index % 4]}, Murcia`,
    phone: `968${String(100_000 + index * 137).padStart(6, "0")}`,
    email: `pruebas${index + 1}@empresas-demo.test`,
    slug: `DEMO-COMPANY-${String(index + 1).padStart(2, "0")}`,
  }));
  await db.insert(companies).values(demoCompanyRows).onConflictDoNothing();
  const companyIds = [
    "company-1", "company-2", "company-3",
    ...demoCompanyRows.map((company) => company.id),
  ];
  const companyNameById: Record<string, string> = {
    "company-1": "Construcciones Murcianas SL",
    "company-2": "Grupo Electrica Levante SA",
    "company-3": "Transportes Martinez SL",
  };
  for (const company of demoCompanyRows) companyNameById[company.id] = company.name;

  const demoCategoryNames = [
    "Carretillero", "Mecánica industrial", "Fontanería", "Pintura industrial",
    "Limpieza técnica", "Montaje de estructuras", "Control de calidad", "Jardinería",
  ];
  const demoCategoryRows = demoCategoryNames.map((name, index) => ({
    id: demoId("demo-category-", index + 1),
    name,
    description: `Categoría de prueba: ${name.toLowerCase()}`,
    requiresSpecialPermission: index === 1 || index === 5,
    requiresTraining: index !== 7,
    requiresWorkPermit: index === 1 || index === 5,
  }));
  await db.insert(workCategories).values(demoCategoryRows).onConflictDoNothing();
  const categoryIds = ["wc-0", "wc-1", "wc-2", "wc-3", "wc-4", "wc-5", ...demoCategoryRows.map((category) => category.id)];

  const demoAreaNames = ["Taller mecánico", "Laboratorio", "Muelles de carga", "Sala de máquinas", "Aparcamiento", "Zona de obras"];
  const demoAreaRows = demoAreaNames.map((name, index) => ({
    id: demoId("demo-area-", index + 1),
    name,
    slug: `DEMO-AREA-${String(index + 1).padStart(2, "0")}`,
  }));
  await db.insert(allowedAreas).values(demoAreaRows).onConflictDoNothing();
  const areaIds = [
    "area-office-basic", "area-plant", "area-warehouse", "area-office", "area-loading",
    ...demoAreaRows.map((area) => area.id),
  ];
  const areaNameById: Record<string, string> = {
    "area-office-basic": "Oficina",
    "area-plant": "Planta de producción",
    "area-warehouse": "Almacén",
    "area-office": "Oficinas",
    "area-loading": "Zona de carga",
  };
  for (const area of demoAreaRows) areaNameById[area.id] = area.name;

  const demoRoles = [
    "ACCESS_OPERATOR", "ACCESS_MONITOR", "SECURITY_MANAGER",
    "ACCESS_APPROVER", "ACCESS_REQUESTER", "ADMIN",
  ] as const;
  const demoUserRows = Array.from({ length: 24 }, (_, index) => ({
    id: demoId("demo-user-", index + 1),
    fullName: `${demoFirstNames[index % demoFirstNames.length]} ${demoLastNames[(index * 7) % demoLastNames.length]}`,
    username: `demo${String(index + 1).padStart(2, "0")}`,
    password: operPwd,
    role: demoRoles[index % demoRoles.length],
    isActive: index % 11 !== 0,
    isTrashed: index > 0 && index % 19 === 0,
    siteId: siteIds[index % siteIds.length],
    departmentId: departmentIds[(index * 3) % departmentIds.length],
  }));
  await db.insert(users).values(demoUserRows).onConflictDoNothing();
  const operatorIds = ["user-2", ...demoUserRows.filter((user) => user.role === "ACCESS_OPERATOR").map((user) => user.id)];
  const requesterIds = ["user-4", ...demoUserRows.filter((user) => user.role === "ACCESS_REQUESTER").map((user) => user.id)];
  const approverIds = ["user-1", ...demoUserRows.filter((user) => user.role === "ACCESS_APPROVER").map((user) => user.id)];
  const securityIds = demoUserRows.filter((user) => user.role === "SECURITY_MANAGER").map((user) => user.id);
  const fullNameByUserId: Record<string, string> = {
    "user-1": "Administrador",
    "user-2": "Carlos Segura",
    "user-3": "Maria Vigilancia",
    "user-4": "Juan Proveedores",
  };
  for (const user of demoUserRows) fullNameByUserId[user.id] = user.fullName;

  const demoVehicleTypes = ["Furgoneta", "Camión", "Turismo", "Camioneta", "Motocicleta"];
  const demoVehicleRows = Array.from({ length: 240 }, (_, index) => ({
    id: demoId("demo-vehicle-", index + 1),
    typeSnapshot: demoVehicleTypes[index % demoVehicleTypes.length],
    brandSnapshot: ["Ford", "Renault", "Toyota", "Iveco", "Peugeot", "Volkswagen"][index % 6],
    modelSnapshot: ["Transit", "Master", "Proace", "Daily", "Partner", "Caddy"][index % 6],
    plateSnapshot: `${String(1000 + index).slice(-4)}${["BCD", "FGH", "JKL", "MNP", "RST"][index % 5]}`,
  }));
  await db.insert(accessLogVehicles).values(demoVehicleRows).onConflictDoNothing();

  const demoWorkerRows = Array.from({ length: 300 }, (_, index) => {
    const personNumber = index + 1;
    const createdAt = new Date(todayMidnight);
    createdAt.setDate(createdAt.getDate() - ((index * 11) % 400));
    return {
      id: demoId("demo-worker-", personNumber),
      firstName: demoFirstNames[(index * 5) % demoFirstNames.length],
      middleName: index % 3 === 0 ? demoFirstNames[(index * 5 + 7) % demoFirstNames.length] : null,
      lastName: demoLastNames[(index * 7) % demoLastNames.length],
      secondLastName: demoLastNames[(index * 13 + 3) % demoLastNames.length],
      phoneNumber: String(600_100_000 + index),
      legalId: demoLegalId(personNumber),
      companyId: companyIds[(index * 7) % companyIds.length],
      workCategoryId: categoryIds[(index * 5) % categoryIds.length],
      createdAt,
      updatedAt: createdAt,
    };
  });
  await db.insert(externalWorkers).values(demoWorkerRows).onConflictDoNothing();
  const workerById = new Map(demoWorkerRows.map((worker) => [worker.id, worker]));
  const workersByCompany = new Map<string, typeof demoWorkerRows>();
  for (const worker of demoWorkerRows) {
    const workers = workersByCompany.get(worker.companyId) ?? [];
    workers.push(worker);
    workersByCompany.set(worker.companyId, workers);
  }

  const plannedStatuses = [
    "APPROVED", "PENDING_APPROVAL", "USED", "REJECTED", "PARTIALLY_USED", "CANCELED", "EXPIRED",
  ] as const;
  const demoPlannedAccessRows = Array.from({ length: 360 }, (_, index) => {
    const expectedStartDatetime = new Date(todayMidnight);
    expectedStartDatetime.setDate(expectedStartDatetime.getDate() + ((index * 17) % 76) - 35);
    expectedStartDatetime.setHours(7 + ((index * 7) % 11), (index * 13) % 60, 0, 0);
    const expectedEndDatetime = new Date(expectedStartDatetime);
    expectedEndDatetime.setHours(expectedEndDatetime.getHours() + 2 + (index % 6));
    const createdAt = new Date(expectedStartDatetime);
    createdAt.setDate(createdAt.getDate() - 1 - (index % 12));
    // Una visita futura ya debe estar creada; no adelantar la creación de datos demo.
    if (createdAt > now) createdAt.setTime(yesterdayMidnight.getTime());
    const status = plannedStatuses[index % plannedStatuses.length];
    const companyId = companyIds[(index * 7) % companyIds.length];
    const decisionReason = status === "REJECTED"
      ? "La documentación necesita una revisión adicional."
      : status === "CANCELED"
        ? "La empresa ha comunicado un cambio de planificación."
        : null;
    const isApproved = status === "APPROVED" || status === "USED" || status === "PARTIALLY_USED";
    const hasDecision = status !== "PENDING_APPROVAL";
    return {
      id: demoId("demo-plan-", index + 1),
      expectedStartDatetime,
      expectedEndDatetime,
      status,
      companySnapshot: companyNameById[companyId],
      companyId,
      visitReason: [
        "Mantenimiento preventivo de equipos",
        "Revisión de instalación eléctrica",
        "Entrega de material y repuestos",
        "Inspección de seguridad en planta",
        "Reparación de climatización",
        "Trabajos de limpieza técnica",
      ][index % 6],
      approvedAt: isApproved ? new Date(createdAt.getTime() + 60 * 60 * 1000) : null,
      approvedById: isApproved ? approverIds[index % approverIds.length] : null,
      decisionReason,
      decisionAt: hasDecision ? new Date(createdAt.getTime() + 90 * 60 * 1000) : null,
      decisionById: hasDecision ? approverIds[(index + 2) % approverIds.length] : null,
      requestedById: requesterIds[index % requesterIds.length],
      departmentId: departmentIds[(index * 3) % departmentIds.length],
      siteId: siteIds[(index * 5) % siteIds.length],
      createdAt,
      updatedAt: createdAt,
    };
  });
  await db.insert(plannedAccesses).values(demoPlannedAccessRows).onConflictDoNothing();

  const demoPlannedPersonRows: Array<typeof plannedAccessPersons.$inferInsert> = [];
  const plannedPeopleByPlan = new Map<string, Array<typeof plannedAccessPersons.$inferInsert>>();
  for (let index = 0; index < demoPlannedAccessRows.length; index += 1) {
    const plan = demoPlannedAccessRows[index];
    const availableWorkers = workersByCompany.get(plan.companyId!) ?? demoWorkerRows;
    const personCount = 1 + (index % 3);
    const people: Array<typeof plannedAccessPersons.$inferInsert> = [];
    for (let personIndex = 0; personIndex < personCount; personIndex += 1) {
      const worker = availableWorkers[(index + personIndex * 7) % availableWorkers.length];
      const areaId = areaIds[(index * 3 + personIndex) % areaIds.length];
      const person = {
        id: `${demoId("demo-plan-person-", index + 1)}-${personIndex + 1}`,
        firstNameSnapshot: worker.firstName,
        middleNameSnapshot: worker.middleName,
        lastNameSnapshot: worker.lastName,
        secondLastNameSnapshot: worker.secondLastName,
        phoneNumber: worker.phoneNumber,
        legalIdSnapshot: worker.legalId,
        workCategoryId: worker.workCategoryId,
        allowedAreaSnapshot: areaNameById[areaId],
        allowedAreaId: areaId,
        plannedAccessId: plan.id,
        externalWorkerId: worker.id,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt,
      };
      people.push(person);
      demoPlannedPersonRows.push(person);
    }
    plannedPeopleByPlan.set(plan.id, people);
  }
  for (let index = 0; index < demoPlannedPersonRows.length; index += 500) {
    await db.insert(plannedAccessPersons)
      .values(demoPlannedPersonRows.slice(index, index + 500))
      .onConflictDoNothing();
  }

  const demoExitEnvelope = await encryptValue(
    JSON.stringify({
      strokes: [[[0.1, 0.55], [0.3, 0.35], [0.55, 0.65], [0.78, 0.25], [0.9, 0.48]]],
    }),
  );
  const eligiblePlans = demoPlannedAccessRows.filter((plan) =>
    (plan.status === "APPROVED" || plan.status === "USED" || plan.status === "PARTIALLY_USED") &&
    plan.expectedStartDatetime <= now,
  );
  const eligibleVisitors = eligiblePlans.flatMap((plan) =>
    (plannedPeopleByPlan.get(plan.id) ?? []).map((person) => ({ plan, person })),
  );
  const availableMinutesToday = Math.max(0, Math.floor((now.getTime() - todayMidnight.getTime()) / 60_000));
  const demoAccessLogRows = Array.from({ length: 1_500 }, (_, index) => {
    const isToday = index < 80;
    const daysAgo = isToday ? 0 : 1 + ((index * 11) % 90);
    const isOpen = isToday && (index % 4 === 0 || availableMinutesToday < 2);
    let entryTimestamp: Date;
    let ageMinutes = 0;
    if (isToday) {
      const ageRange = Math.max(1, Math.min(720, availableMinutesToday + 1));
      ageMinutes = Math.min(availableMinutesToday, 15 + ((index * 37) % ageRange));
      if (!isOpen) ageMinutes = Math.min(availableMinutesToday, 45 + ((index * 29) % ageRange));
      entryTimestamp = new Date(now.getTime() - ageMinutes * 60_000);
    } else {
      entryTimestamp = new Date(todayMidnight);
      entryTimestamp.setDate(entryTimestamp.getDate() - daysAgo);
      entryTimestamp.setHours(6 + ((index * 7) % 13), (index * 19) % 60, 0, 0);
    }
    const visitIsOpen = isOpen || (isToday && ageMinutes < 2);
    const durationMinutes = isToday
      ? Math.min(30 + ((index * 13) % 180), Math.max(1, ageMinutes - 1))
      : 45 + ((index * 17) % 300);
    const exitTimestamp = visitIsOpen ? null : new Date(entryTimestamp.getTime() + durationMinutes * 60_000);

    const linkedVisitor = index % 4 === 0
      ? eligibleVisitors[Math.floor(index / 4)] ?? null
      : null;
    const linkedPlan = linkedVisitor?.plan ?? null;
    const linkedPerson = linkedVisitor?.person ?? null;
    const worker = linkedPerson?.externalWorkerId
      ? workerById.get(linkedPerson.externalWorkerId)!
      : demoWorkerRows[(index * 13) % demoWorkerRows.length];
    const companyId = linkedPlan?.companyId ?? worker.companyId;
    const companyName = companyNameById[companyId] ?? "Empresa de pruebas";
    const siteId = linkedPlan?.siteId ?? siteIds[(index * 5) % siteIds.length];
    const areaId = linkedPerson?.allowedAreaId ?? areaIds[(index * 7) % areaIds.length];
    const withVehicle = index % 5 === 0;
    const createdById = operatorIds[index % operatorIds.length];
    const exitRecordedById = exitTimestamp
      ? (securityIds[index % securityIds.length] ?? createdById)
      : null;
    return {
      id: demoId("demo-access-", index + 1),
      entryTimestamp,
      entrySignatureEnvelope: demoEnvelope,
      riskAcknowledgedAt: entryTimestamp,
      riskAcknowledgementSnapshot: {
        holderLegalName: "Empresa Demo SL",
        siteName: `Centro de pruebas ${siteId}`,
        riskInformation: "Registro ficticio generado para pruebas de interfaz.",
        acknowledgedAt: entryTimestamp.toISOString(),
      },
      exitTimestamp,
      exitSignatureEnvelope: exitTimestamp ? demoExitEnvelope : null,
      companyNameSnapshot: companyName,
      companyId,
      firstNameSnapshot: worker.firstName,
      middleNameSnapshot: worker.middleName,
      lastNameSnapshot: worker.lastName,
      secondLastNameSnapshot: worker.secondLastName,
      phoneNumber: worker.phoneNumber,
      legalIdSnapshot: worker.legalId,
      allowedAreaSnapshot: areaNameById[areaId],
      allowedAreaId: areaId,
      approvedBySnapshot: fullNameByUserId[approverIds[index % approverIds.length]] ?? "Responsable de seguridad",
      withVehicle,
      visitReason: [
        "Mantenimiento programado",
        "Entrega de suministros",
        "Revisión de equipos",
        "Trabajos de instalación",
        "Visita técnica",
        "Inspección de zona",
      ][index % 6],
      siteId,
      createdById,
      exitRecordedById,
      vehicleAccessLogId: withVehicle ? demoVehicleRows[index % demoVehicleRows.length].id : null,
      plannedAccessId: linkedPlan?.id ?? null,
      plannedAccessPersonId: linkedPerson?.id ?? null,
      externalWorkerId: worker.id,
    };
  });
  for (let index = 0; index < demoAccessLogRows.length; index += 400) {
    await db.insert(accessLogs)
      .values(demoAccessLogRows.slice(index, index + 400))
      .onConflictDoNothing();
  }

  const auditActions = ["CREATE", "UPDATE", "APPROVE", "REJECT", "REGISTER_EXIT", "CANCEL"];
  const auditEntityTypes = ["access-log", "planned-access", "external-worker", "company", "user"];
  const demoAuditRows = Array.from({ length: 1_200 }, (_, index) => {
    const createdAt = new Date(now);
    createdAt.setDate(createdAt.getDate() - (index % 180));
    createdAt.setHours(6 + ((index * 5) % 15), (index * 17) % 60, 0, 0);
    const entityType = auditEntityTypes[index % auditEntityTypes.length];
    const entityId = entityType === "access-log"
      ? demoId("demo-access-", (index % demoAccessLogRows.length) + 1)
      : entityType === "planned-access"
        ? demoId("demo-plan-", (index % demoPlannedAccessRows.length) + 1)
        : entityType === "external-worker"
          ? demoId("demo-worker-", (index % demoWorkerRows.length) + 1)
          : entityType === "company"
            ? companyIds[index % companyIds.length]
            : demoUserRows[index % demoUserRows.length].id;
    const action = auditActions[index % auditActions.length];
    const actor = demoUserRows[index % demoUserRows.length];
    return {
      id: demoId("demo-audit-", index + 1),
      entityType,
      entityId,
      action,
      changedBy: actor.username,
      summary: `${actor.fullName} realizó la acción ${action.toLowerCase()} sobre ${entityType}.`,
      metadata: { demo: true, sequence: index + 1, actorName: actor.fullName },
      createdAt,
    };
  });
  for (let index = 0; index < demoAuditRows.length; index += 500) {
    await db.insert(auditLogs)
      .values(demoAuditRows.slice(index, index + 500))
      .onConflictDoNothing();
  }

  console.log(
    `Seed demo ampliado: ${demoWorkerRows.length} trabajadores, ${demoPlannedAccessRows.length} accesos planificados, ${demoPlannedPersonRows.length} personas planificadas, ${demoAccessLogRows.length} registros de acceso y ${demoAuditRows.length} eventos de auditoría. Usuarios demo: contraseña demo123.`,
  );
  await closeDatabasePool();
}

main().catch((error) => {
  console.error("Error al ejecutar el seed:", error);
  void closeDatabasePool();
  process.exitCode = 1;
});
