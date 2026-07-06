import "dotenv/config";

import { randomBytes, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";
import { encryptValue } from "../app/lib/crypt.server";

const scrypt = promisify(scryptCallback);

const SALT_LENGTH = 16;
const KEY_LENGTH = 64;
const HASH_SEPARATOR = ":";

async function hashText(text: string) {
  const salt = randomBytes(SALT_LENGTH).toString("hex");
  const derivedKey = (await scrypt(text, salt, KEY_LENGTH)) as Buffer;
  return `${salt}${HASH_SEPARATOR}${derivedKey.toString("hex")}`;
}

function randomSignatureEnvelope() {
  return encryptValue(
    JSON.stringify({
      strokes: [
        [
          { x: 10, y: 10 },
          { x: 50, y: 50 },
          { x: 90, y: 10 },
        ],
      ],
    }),
  );
}

function randomLegalId() {
  const letter = "XYZ"[Math.floor(Math.random() * 3)];
  const number = Math.floor(1000000 + Math.random() * 9000000);
  const control = "TRWAGMYFPDXBNJZSQVHLCKE"[number % 23];
  return `${letter}${number}${control}`;
}

function randomPhone() {
  return `6${Math.floor(10000000 + Math.random() * 90000000)}`;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysAgo(n: number) {
  const d = startOfToday();
  d.setDate(d.getDate() - n);
  return d;
}

function hoursAgo(n: number) {
  const d = new Date();
  d.setHours(d.getHours() - n);
  return d;
}

function hoursFromNow(n: number) {
  const d = new Date();
  d.setHours(d.getHours() + n);
  return d;
}

const FIRST_NAMES = [
  "Juan",
  "Maria",
  "Carlos",
  "Ana",
  "Pedro",
  "Laura",
  "Javier",
  "Sofia",
  "Diego",
  "Elena",
];
const LAST_NAMES = [
  "Garcia",
  "Lopez",
  "Martinez",
  "Rodriguez",
  "Sanchez",
  "Gomez",
  "Fernandez",
  "Ruiz",
  "Diaz",
  "Moreno",
];
const COMPANIES = [
  "Fruveco S.A.",
  "Logistica del Norte",
  "Servicios Generales Iberia",
  "Construcciones Hermanos Torres",
  "Tecnologia Aplicada S.L.",
  "Mantenimiento Integral",
];
const VISIT_REASONS = [
  "Entrega de mercancia",
  "Mantenimiento de equipos",
  "Reunion con proveedor",
  "Inspeccion de seguridad",
  "Reparacion de fontaneria",
  "Auditoria interna",
  "Capacitacion del personal",
  "Instalacion de software",
];

const VEHICLE_TYPES = ["Automovil", "Furgoneta", "Camion", "Motocicleta"];
const VEHICLE_BRANDS = ["Ford", "Mercedes", "Iveco", "Renault", "Volkswagen"];

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL no esta definido");
  }

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    console.log("[seed-access-logs] Iniciando seeder de access-logs y planned-access...");

    // --- Sites ---
    const defaultSite = await prisma.site.findFirst({
      where: { slug: process.env.SITE_SLUG ?? "PRINCIPAL" },
    });

    if (!defaultSite) {
      throw new Error(
        "No se encontro el sitio principal. Ejecuta primero `pnpm db:seed`.",
      );
    }

    const extraSitesData = [
      { name: "Almacen Central", slug: "ALMACEN-CENTRAL", address: "Poligono Industrial Norte, Nave 5" },
      { name: "Planta de Envasado", slug: "PLANTA-ENVASADO", address: "Calle Industrial 42" },
    ];

    const extraSites = [];
    for (const s of extraSitesData) {
      const site = await prisma.site.upsert({
        where: { slug: s.slug },
        update: { name: s.name, address: s.address },
        create: s,
      });
      extraSites.push(site);
    }

    const allSites = [defaultSite, ...extraSites];
    console.log(`[seed-access-logs] Sitios disponibles: ${allSites.map((s) => s.slug).join(", ")}`);

    // --- Department ---
    const defaultDept = await prisma.department.findFirst({
      where: { slug: process.env.DEPARTMENT_SLUG ?? "GENERAL" },
    });
    if (!defaultDept) {
      throw new Error(
        "No se encontro el departamento general. Ejecuta primero `pnpm db:seed`.",
      );
    }

    // --- Users: crear operadores y otros roles por sitio ---
    const hashedPassword = await hashText("seed-password-123");

    const usersToCreate = [
      { fullName: "Operador Principal", username: "operador.principal", role: "ACCESS_OPERATOR" as const, siteIdx: 0 },
      { fullName: "Operador Almacen", username: "operador.almacen", role: "ACCESS_OPERATOR" as const, siteIdx: 1 },
      { fullName: "Solicitante Principal", username: "solicitante.principal", role: "ACCESS_REQUESTER" as const, siteIdx: 0 },
      { fullName: "Aprobador Principal", username: "aprobador.principal", role: "ACCESS_APPROVER" as const, siteIdx: 0 },
      { fullName: "Director Seguridad", username: "director.seguridad", role: "SECURITY_MANAGER" as const, siteIdx: 0 },
      { fullName: "Monitor Accesos", username: "monitor.accesos", role: "ACCESS_MONITOR" as const, siteIdx: 0 },
    ];

    const users: Record<string, { id: string; fullName: string }> = {};
    for (const u of usersToCreate) {
      const site = allSites[u.siteIdx];
      const created = await prisma.user.upsert({
        where: { username: u.username },
        update: {
          fullName: u.fullName,
          password: hashedPassword,
          role: u.role,
          isActive: true,
          isTrashed: false,
          siteId: site.id,
          departmentId: defaultDept.id,
        },
        create: {
          fullName: u.fullName,
          username: u.username,
          password: hashedPassword,
          role: u.role,
          isActive: true,
          isTrashed: false,
          siteId: site.id,
          departmentId: defaultDept.id,
        },
      });
      users[u.username] = { id: created.id, fullName: created.fullName };
    }
    console.log(`[seed-access-logs] Usuarios creados: ${Object.keys(users).join(", ")}`);

    const operator = users["operador.principal"];
    const operatorAlmacen = users["operador.almacen"];
    const solicitante = users["solicitante.principal"];
    const aprobador = users["aprobador.principal"];

    // --- AccessLogs ---
    const accessLogsToCreate = 40;
    let created = 0;

    for (let i = 0; i < accessLogsToCreate; i++) {
      const site = pick(allSites);
      const createdBy =
        site.id === allSites[1].id ? operatorAlmacen : operator;
      const isToday = i < 20;
      const isInside = isToday && i % 3 === 0;

      const entryTimestamp = isToday
        ? hoursAgo(Math.floor(Math.random() * 8) + 1)
        : daysAgo(Math.floor(Math.random() * 7) + 1);

      const exitTimestamp = isInside ? null : new Date(entryTimestamp.getTime() + (Math.random() * 4 + 1) * 3600000);

      const withVehicle = Math.random() > 0.6;
      const firstName = pick(FIRST_NAMES);
      const lastName = pick(LAST_NAMES);

      let vehicleId: string | null = null;
      if (withVehicle) {
        const vehicle = await prisma.accessLogVehicle.create({
          data: {
            typeSnapshot: pick(VEHICLE_TYPES),
            brandSnapshot: pick(VEHICLE_BRANDS),
            modelSnapshot: `Modelo ${Math.floor(Math.random() * 10) + 1}`,
            plateSnapshot: `${Math.floor(1000 + Math.random() * 9000)}${pick(["ABC", "DEF", "GHJ"])}`,
          },
        });
        vehicleId = vehicle.id;
      }

      const exitRecordedById = exitTimestamp ? createdBy.id : null;

      await prisma.accessLog.create({
        data: {
          entryTimestamp,
          entrySignatureEnvelope: randomSignatureEnvelope(),
          exitTimestamp,
          exitSignatureEnvelope: exitTimestamp
            ? randomSignatureEnvelope()
            : undefined,
          companyNameSnapshot: pick(COMPANIES),
          firstNameSnapshot: firstName,
          lastNameSnapshot: lastName,
          phoneNumber: randomPhone(),
          legalIdSnapshot: randomLegalId(),
          withVehicle,
          visitReason: pick(VISIT_REASONS),
          siteId: site.id,
          createdById: createdBy.id,
          exitRecordedById,
          vehicleAccessLogId: vehicleId,
        },
      });
      created++;
    }
    console.log(`[seed-access-logs] ${created} access-logs creados.`);

    // --- PlannedAccess ---
    const plannedAccessesToCreate = 12;
    let plannedCreated = 0;

    const plannedStatuses = [
      "PENDING_APPROVAL",
      "APPROVED",
      "PARTIALLY_USED",
    ] as const;

    for (let i = 0; i < plannedAccessesToCreate; i++) {
      const site = pick(allSites);
      const status = plannedStatuses[i % plannedStatuses.length];
      const expectedStart = i < 6 ? hoursFromNow(Math.floor(Math.random() * 24) + 1) : hoursAgo(Math.floor(Math.random() * 48) + 1);
      const expectedEnd = new Date(expectedStart.getTime() + (Math.random() * 4 + 2) * 3600000);

      const personCount = Math.floor(Math.random() * 3) + 1;
      const persons = [];
      const usedLegalIds = new Set<string>();
      for (let p = 0; p < personCount; p++) {
        let legalId = randomLegalId();
        while (usedLegalIds.has(legalId)) {
          legalId = randomLegalId();
        }
        usedLegalIds.add(legalId);
        persons.push({
          firstNameSnapshot: pick(FIRST_NAMES),
          lastNameSnapshot: pick(LAST_NAMES),
          phoneNumber: randomPhone(),
          legalIdSnapshot: legalId,
        });
      }

      const approvedAt = status === "APPROVED" || status === "PARTIALLY_USED" ? hoursAgo(Math.floor(Math.random() * 24) + 1) : null;

      await prisma.plannedAccess.create({
        data: {
          expectedStartDatetime: expectedStart,
          expectedEndDatetime: expectedEnd,
          status,
          companySnapshot: pick(COMPANIES),
          visitReason: pick(VISIT_REASONS),
          approvedAt,
          approvedById: aprobador.id,
          requestedById: solicitante.id,
          siteId: site.id,
          plannedAccessPersons: {
            create: persons,
          },
        },
      });
      plannedCreated++;
    }
    console.log(`[seed-access-logs] ${plannedCreated} planned-access creados.`);

    console.log("[seed-access-logs] Seeder completado exitosamente.");
    console.log("[seed-access-logs] Resumen:");
    console.log(`  - Sitios: ${allSites.length}`);
    console.log(`  - Usuarios: ${usersToCreate.length}`);
    console.log(`  - Access logs: ${accessLogsToCreate}`);
    console.log(`  - Planned accesses: ${plannedAccessesToCreate}`);
    console.log("");
    console.log("[seed-access-logs] Usuarios de prueba (password: seed-password-123):");
    for (const u of usersToCreate) {
      console.log(`  - ${u.username} (${u.role})`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("[seed-access-logs] Error:", error);
  process.exit(1);
});
