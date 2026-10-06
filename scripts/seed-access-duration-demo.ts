import { config as loadEnv } from "dotenv";

loadEnv({ quiet: true });

import { and, desc, eq, inArray, isNull, lt } from "drizzle-orm";
import { closeDatabasePool, createPostgresDb } from "../db/client";
import {
  accessLogs,
  plannedAccesses,
  plannedAccessPersons,
  sites,
  users,
} from "../db/schema";
import { encryptValue } from "../app/lib/crypt.server";

const TEST_VISITOR_COUNT = 50;

async function main() {
  const db = createPostgresDb();
  const now = new Date();
  const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  try {
    const candidates = await db
      .select({
        personId: plannedAccessPersons.id,
        firstName: plannedAccessPersons.firstNameSnapshot,
        middleName: plannedAccessPersons.middleNameSnapshot,
        lastName: plannedAccessPersons.lastNameSnapshot,
        secondLastName: plannedAccessPersons.secondLastNameSnapshot,
        phoneNumber: plannedAccessPersons.phoneNumber,
        legalId: plannedAccessPersons.legalIdSnapshot,
        areaName: plannedAccessPersons.allowedAreaSnapshot,
        areaId: plannedAccessPersons.allowedAreaId,
        externalWorkerId: plannedAccessPersons.externalWorkerId,
        planId: plannedAccesses.id,
        plannedStart: plannedAccesses.expectedStartDatetime,
        plannedEnd: plannedAccesses.expectedEndDatetime,
        companyName: plannedAccesses.companySnapshot,
        companyId: plannedAccesses.companyId,
        visitReason: plannedAccesses.visitReason,
        requestedById: plannedAccesses.requestedById,
        approvedById: plannedAccesses.approvedById,
        approvedByName: users.fullName,
        siteId: plannedAccesses.siteId,
        siteName: sites.name,
        siteAddress: sites.address,
        siteRiskInformation: sites.riskInformation,
      })
      .from(plannedAccessPersons)
      .innerJoin(
        plannedAccesses,
        eq(plannedAccessPersons.plannedAccessId, plannedAccesses.id),
      )
      .innerJoin(sites, eq(plannedAccesses.siteId, sites.id))
      .leftJoin(users, eq(plannedAccesses.approvedById, users.id))
      .leftJoin(
        accessLogs,
        eq(accessLogs.plannedAccessPersonId, plannedAccessPersons.id),
      )
      .where(and(
        inArray(plannedAccesses.status, ["APPROVED", "USED", "PARTIALLY_USED"]),
        lt(plannedAccesses.expectedStartDatetime, cutoff),
        isNull(accessLogs.id),
      ))
      .orderBy(desc(plannedAccesses.expectedStartDatetime))
      .limit(TEST_VISITOR_COUNT);

    if (candidates.length === 0) {
      console.log("No hay visitantes de solicitudes aprobadas sin registros de acceso para añadir pruebas.");
      return;
    }

    const siteOperators = await db
      .select({ id: users.id, siteId: users.siteId })
      .from(users)
      .where(and(
        eq(users.role, "ACCESS_OPERATOR"),
        eq(users.isActive, true),
        eq(users.isTrashed, false),
      ));
    const operatorBySite = new Map(siteOperators.map((operator) => [operator.siteId, operator.id]));
    const signature = await encryptValue(JSON.stringify({
      strokes: [[[0.08, 0.62], [0.24, 0.28], [0.41, 0.7], [0.63, 0.34], [0.92, 0.55]]],
    }));

    const rows = candidates.flatMap((candidate, index) => {
      const operatorId = operatorBySite.get(candidate.siteId) ?? candidate.requestedById;
      const plannedWindowMinutes = candidate.plannedEnd
        ? Math.floor((candidate.plannedEnd.getTime() - candidate.plannedStart.getTime()) / 60_000)
        : 240;
      const maxIntervalMinutes = Math.max(1, Math.floor((plannedWindowMinutes - 20) / 2));
      const firstDuration = Math.min(15 + (index % 5) * 10, maxIntervalMinutes);
      const secondDuration = Math.min(20 + (index % 6) * 15, maxIntervalMinutes);
      const firstEntry = new Date(candidate.plannedStart.getTime() + 5 * 60_000);
      const firstExit = new Date(firstEntry.getTime() + firstDuration * 60_000);
      const secondEntry = new Date(firstExit.getTime() + 15 * 60_000);
      const secondExit = new Date(secondEntry.getTime() + secondDuration * 60_000);
      const visitorName = [candidate.firstName, candidate.middleName, candidate.lastName, candidate.secondLastName]
        .filter(Boolean)
        .join(" ");
      const base = {
        entrySignatureEnvelope: signature,
        riskAcknowledgementSnapshot: {
          siteName: candidate.siteName,
          siteAddress: candidate.siteAddress,
          riskInformation: candidate.siteRiskInformation,
          acknowledgedAt: firstEntry.toISOString(),
          pruebaDuracion: true,
        },
        companyNameSnapshot: candidate.companyName,
        companyId: candidate.companyId,
        firstNameSnapshot: candidate.firstName,
        middleNameSnapshot: candidate.middleName,
        lastNameSnapshot: candidate.lastName,
        secondLastNameSnapshot: candidate.secondLastName,
        phoneNumber: candidate.phoneNumber,
        legalIdSnapshot: candidate.legalId,
        allowedAreaSnapshot: candidate.areaName,
        allowedAreaId: candidate.areaId,
        approvedBySnapshot: candidate.approvedByName ?? "Responsable de pruebas",
        withVehicle: false,
        visitReason: `[PRUEBA DURACIÓN] ${visitorName} · solicitud ${candidate.planId}`,
        siteId: candidate.siteId,
        createdById: operatorId,
        exitSignatureEnvelope: signature,
        exitClosureMethod: "SIGNED" as const,
        exitRecordedById: operatorId,
        planId: candidate.planId,
        personId: candidate.personId,
        externalWorkerId: candidate.externalWorkerId,
      };

      return [firstDuration, secondDuration].map((durationMinutes, intervalIndex) => {
        const entryTimestamp = intervalIndex === 0 ? firstEntry : secondEntry;
        const exitTimestamp = intervalIndex === 0 ? firstExit : secondExit;
        return {
          id: `duration-test-${candidate.personId}-${intervalIndex + 1}`,
          entryTimestamp,
          entrySignatureEnvelope: base.entrySignatureEnvelope,
          riskAcknowledgedAt: entryTimestamp,
          riskAcknowledgementSnapshot: {
            ...base.riskAcknowledgementSnapshot,
            acknowledgedAt: entryTimestamp.toISOString(),
          },
          exitTimestamp,
          exitSignatureEnvelope: base.exitSignatureEnvelope,
          exitClosureMethod: base.exitClosureMethod,
          companyNameSnapshot: base.companyNameSnapshot,
          companyId: base.companyId,
          firstNameSnapshot: base.firstNameSnapshot,
          middleNameSnapshot: base.middleNameSnapshot,
          lastNameSnapshot: base.lastNameSnapshot,
          secondLastNameSnapshot: base.secondLastNameSnapshot,
          phoneNumber: base.phoneNumber,
          legalIdSnapshot: base.legalIdSnapshot,
          allowedAreaSnapshot: base.allowedAreaSnapshot,
          allowedAreaId: base.allowedAreaId,
          approvedBySnapshot: base.approvedBySnapshot,
          withVehicle: base.withVehicle,
          visitReason: `${base.visitReason} · intervalo ${intervalIndex + 1}: ${durationMinutes} min`,
          siteId: base.siteId,
          createdById: base.createdById,
          exitRecordedById: base.exitRecordedById,
          plannedAccessId: base.planId,
          plannedAccessPersonId: base.personId,
          externalWorkerId: base.externalWorkerId,
        };
      });
    });

    await db.insert(accessLogs).values(rows).onConflictDoNothing();
    console.log(`Registros de prueba añadidos: ${rows.length} en ${candidates.length} visitantes y solicitudes.`);
    console.log("Identificador visible en el motivo: [PRUEBA DURACIÓN]. Cada visitante tiene 2 intervalos cerrados sumables.");
  } finally {
    await closeDatabasePool();
  }
}

main().catch((error) => {
  console.error("No se pudieron crear los registros de prueba:", error);
  process.exitCode = 1;
});
