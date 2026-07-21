import { config as loadEnv } from "dotenv";

loadEnv({ quiet: true });
import { createLocalDb } from "../db/client";
import {
  accessLogs,
  accessLogVehicles,
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

async function main() {
  const db = await createLocalDb();

  const mode = process.argv.includes("--mode=demo") ? "demo" : "base";
  const adminFullName = process.env.ADMIN_FULL_NAME || "Administrador";
  const adminUsername = process.env.ADMIN_USERNAME || "admin";
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
  }).onConflictDoUpdate({
    target: sites.id,
    set: { name: siteName, slug: siteSlug },
  });
  await db.insert(departments).values({
    id: "dept-3",
    name: departmentName,
    slug: departmentSlug,
  }).onConflictDoUpdate({
    target: departments.id,
    set: { name: departmentName, slug: departmentSlug },
  });
  await db.insert(users).values({
    id: "user-1",
    fullName: adminFullName,
    username: adminUsername,
    password: adminPwd,
    role: "ADMIN",
    siteId: "site-1",
    departmentId: "dept-3",
  }).onConflictDoUpdate({
    target: users.id,
    set: {
      fullName: adminFullName,
      username: adminUsername,
      password: adminPwd,
      role: "ADMIN",
      siteId: "site-1",
      departmentId: "dept-3",
    },
  });

  if (mode === "base") {
    console.log(`Seed básico completado. Usuario administrador: ${adminUsername}`);
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
    { id: "wc-1", name: "Electricista", description: "Instalacion y mantenimiento electrico", requiresSpecialPermission: true, requiresTraining: true },
    { id: "wc-2", name: "Albanil", description: "Obra y reformas", requiresSpecialPermission: false, requiresTraining: false },
    { id: "wc-3", name: "Soldador", description: "Trabajos de soldadura", requiresSpecialPermission: true, requiresTraining: true },
    { id: "wc-4", name: "Transportista", description: "Carga y descarga de mercancias", requiresSpecialPermission: false, requiresTraining: false },
    { id: "wc-5", name: "Tecnico de climatizacion", description: "Mantenimiento de climatizacion", requiresSpecialPermission: true, requiresTraining: true },
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
    { id: "doc-1", documentType: "IDENTIFICATION", status: "VALIDATED", fileName: "DNI_Antonio.pdf", filePath: "/var/uploads/workers/worker-1/DNI_Antonio.pdf", fileSize: 245760, mimeType: "application/pdf", expiryDate: "2028-06-15T00:00:00.000Z", externalWorkerId: "worker-1" },
    { id: "doc-2", documentType: "TRAINING", status: "VALIDATED", fileName: "Curso_electricidad_2026.pdf", filePath: "/var/uploads/workers/worker-1/Curso_electricidad.pdf", fileSize: 512000, mimeType: "application/pdf", expiryDate: "2027-03-20T00:00:00.000Z", externalWorkerId: "worker-1" },
    { id: "doc-3", documentType: "IDENTIFICATION", status: "VALIDATED", fileName: "DNI_MariaR.pdf", filePath: "/var/uploads/workers/worker-2/DNI_MariaR.pdf", fileSize: 250000, mimeType: "application/pdf", expiryDate: "2029-11-30T00:00:00.000Z", externalWorkerId: "worker-2" },
    { id: "doc-4", documentType: "IDENTIFICATION", status: "VALIDATED", fileName: "DNI_Francisco.pdf", filePath: "/var/uploads/workers/worker-3/DNI_Francisco.pdf", fileSize: 240000, mimeType: "application/pdf", expiryDate: "2027-08-15T00:00:00.000Z", externalWorkerId: "worker-3" },
    { id: "doc-5", documentType: "TRAINING", status: "EXPIRED", fileName: "Curso_soldadura_2024.pdf", filePath: "/var/uploads/workers/worker-3/Curso_soldadura_2024.pdf", fileSize: 480000, mimeType: "application/pdf", expiryDate: "2025-01-10T00:00:00.000Z", notes: "Curso caducado", externalWorkerId: "worker-3" },
    { id: "doc-6", documentType: "IDENTIFICATION", status: "VALIDATED", fileName: "DNI_Pedro.pdf", filePath: "/var/uploads/workers/worker-5/DNI_Pedro.pdf", fileSize: 235000, mimeType: "application/pdf", expiryDate: "2028-05-20T00:00:00.000Z", externalWorkerId: "worker-5" },
  ]).onConflictDoNothing();

  await db.insert(plannedAccesses).values([
    { id: "pa-1", expectedStartDatetime: tomorrowMidnight.toISOString().replace("T00:00:00.000Z", "T08:00:00.000Z"), expectedEndDatetime: tomorrowMidnight.toISOString().replace("T00:00:00.000Z", "T18:00:00.000Z"), status: "APPROVED", companySnapshot: "Construcciones Murcianas SL", visitReason: "Reparacion de instalacion electrica en nave 3", approvedById: "user-1", requestedById: "user-4", siteId: "site-1" },
    { id: "pa-2", expectedStartDatetime: tomorrowMidnight.toISOString().replace("T00:00:00.000Z", "T09:00:00.000Z"), status: "PENDING_APPROVAL", companySnapshot: "Grupo Electrica Levante SA", visitReason: "Mantenimiento climatizacion oficinas", approvedById: "user-1", requestedById: "user-4", siteId: "site-2" },
    { id: "pa-3", expectedStartDatetime: lastWeek.toISOString().replace("T00:00:00.000Z", "T08:00:00.000Z"), expectedEndDatetime: lastWeek.toISOString().replace("T00:00:00.000Z", "T15:00:00.000Z"), status: "USED", companySnapshot: "Transportes Martinez SL", visitReason: "Carga de mercancia en almacen", approvedById: "user-1", requestedById: "user-4", siteId: "site-1" },
  ]).onConflictDoNothing();

  await db.insert(plannedAccessPersons).values([
    { id: "pap-1", firstNameSnapshot: "Antonio", middleNameSnapshot: "Jose", lastNameSnapshot: "Lopez", secondLastNameSnapshot: "Garcia", phoneNumber: "600111222", legalIdSnapshot: "12345678A", plannedAccessId: "pa-1", externalWorkerId: "worker-1" },
    { id: "pap-2", firstNameSnapshot: "Maria", lastNameSnapshot: "Rodriguez", secondLastNameSnapshot: "Perez", phoneNumber: "600222333", legalIdSnapshot: "87654321B", plannedAccessId: "pa-1", externalWorkerId: "worker-2" },
    { id: "pap-3", firstNameSnapshot: "Francisco", middleNameSnapshot: "Javier", lastNameSnapshot: "Martinez", secondLastNameSnapshot: "Lopez", phoneNumber: "600333444", legalIdSnapshot: "11223344C", plannedAccessId: "pa-2", externalWorkerId: "worker-3" },
    { id: "pap-4", firstNameSnapshot: "Laura", lastNameSnapshot: "Sanchez", secondLastNameSnapshot: "Garcia", phoneNumber: "600444555", legalIdSnapshot: "44332211D", plannedAccessId: "pa-2", externalWorkerId: "worker-4" },
    { id: "pap-5", firstNameSnapshot: "Pedro", lastNameSnapshot: "Fernandez", secondLastNameSnapshot: "Martinez", phoneNumber: "600555666", legalIdSnapshot: "55667788E", plannedAccessId: "pa-3", externalWorkerId: "worker-5" },
    { id: "pap-6", firstNameSnapshot: "Sofia", middleNameSnapshot: "Maria", lastNameSnapshot: "Gonzalez", secondLastNameSnapshot: "Ramos", phoneNumber: "600666777", legalIdSnapshot: "99887766F", plannedAccessId: "pa-3", externalWorkerId: "worker-6" },
  ]).onConflictDoNothing();

  await db.insert(accessLogVehicles).values([
    { id: "vehicle-1", typeSnapshot: "Camion", brandSnapshot: "Iveco", modelSnapshot: "Eurocargo", plateSnapshot: "1234ABC" },
  ]).onConflictDoNothing();

  const log1entry = yesterdayMidnight.toISOString().replace("T00:00:00.000Z", "T07:30:00.000Z");
  const log1exit = yesterdayMidnight.toISOString().replace("T00:00:00.000Z", "T16:00:00.000Z");
  const log2entry = yesterdayMidnight.toISOString().replace("T00:00:00.000Z", "T08:00:00.000Z");
  const log2exit = yesterdayMidnight.toISOString().replace("T00:00:00.000Z", "T17:30:00.000Z");
  const log3entry = now.toISOString();
  const log4entry = now.toISOString();

  const demoEnvelope = '{"v":1,"alg":"aes-256-gcm","iv":"dGVzdA==","tag":"dGVzdA==","ct":"dGVzdA=="}';

  await db.insert(accessLogs).values([
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
      withVehicle: false,
      visitReason: "Visita programada",
      siteId: "site-1",
      createdById: "user-2",
      plannedAccessId: "pa-1",
      plannedAccessPersonId: "pap-2",
    },
  ]).onConflictDoNothing();

  console.log("Seed demo completado. Los usuarios demo usan la contraseña demo123.");
}

main().catch((error) => {
  console.error("Error al ejecutar el seed:", error);
  process.exit(1);
});
