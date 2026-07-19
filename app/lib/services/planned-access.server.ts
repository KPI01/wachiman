import z from "zod";
import type { PlannedAccessStatus } from "../../../db/enums";
import { encryptValue } from "../crypt.server";
import { DOCUMENT_TYPE_LABELS } from "../models/worker-document";
import { validateWorkerDocumentsForApproval } from "./worker-document.server";
import { ExternalWorkerEntity } from "../database/external-worker.server";
import { AccessLogEntity } from "../database/access-log.server";
import { PlannedAccessEntity } from "../database/planned-access.server";
import { UserEntity } from "../database/user.server";
import {
  createAccessLogFromPlannedAccessSchema,
  createPlannedAccessSchema,
  updatePlannedAccessStatusSchema,
} from "../schemas/planned-access";

const PLANNED_ACCESS_PERSON_FIELD = /^persons\[(\d+)]\.(.+)$/;

export function getPlannedAccessFormInput(formData: FormData) {
  const data: Record<string, unknown> = {};
  const persons = new Map<number, Record<string, string>>();

  for (const [name, value] of formData.entries()) {
    const personField = PLANNED_ACCESS_PERSON_FIELD.exec(name);

    if (!personField) {
      data[name] = String(value);
      continue;
    }

    const [, rawIndex, fieldName] = personField;
    const index = Number(rawIndex);
    const person = persons.get(index) ?? {};

    person[fieldName] = String(value);
    persons.set(index, person);
  }

  data.persons = Array.from(persons.entries())
    .sort(([leftIndex], [rightIndex]) => leftIndex - rightIndex)
    .map(([, person]) => person);

  return data;
}

export async function getManyPlannedAccesses(input?: {
  status?: PlannedAccessStatus | PlannedAccessStatus[];
  siteId?: string;
  requestedById?: string;
  departmentId?: string;
  expectedDate?: Date;
}) {
  return await PlannedAccessEntity.findMany(input);
}

function isPlannedForToday(expectedStart: Date, expectedEnd?: Date | null) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  if (!expectedEnd) {
    return expectedStart >= start && expectedStart < end;
  }

  return expectedStart < end && expectedEnd >= start;
}

type PlannedAccessAuthorOptions = {
  authorUsername: string;
  lockedSiteId?: string;
};

export async function createPlannedAccess(
  input: Record<string, unknown>,
  options: PlannedAccessAuthorOptions,
) {
  const parsed = await createPlannedAccessSchema.safeParseAsync(input);

  if (!parsed.success) {
    return { success: false, errors: z.treeifyError(parsed.error) };
  }

  const author = await UserEntity.getByUsername(options.authorUsername);

  if (!author) {
    return { success: false, errors: "unauthorized" };
  }

  const siteId = options.lockedSiteId ?? parsed.data.siteId;
  const newLegalIds = parsed.data.persons.map((p) => p.legalIdSnapshot);

  const overlappingSameSite = await PlannedAccessEntity.findOverlappingPlannedAccess(
    siteId,
    parsed.data.expectedStartDatetime,
    parsed.data.expectedEndDatetime ?? null,
  );

  for (const existing of overlappingSameSite) {
    const existingLegalIds = existing.plannedAccessPersons.map(
      (p) => p.legalIdSnapshot,
    );
    const sharedLegalId = newLegalIds.find((id) =>
      existingLegalIds.includes(id),
    );

    if (sharedLegalId) {
      const startStr = formatPlannedDate(existing.expectedStartDatetime);
      const endStr = existing.expectedEndDatetime
        ? formatPlannedDate(existing.expectedEndDatetime)
        : "sin fecha de fin definida";

      return {
        success: false,
        errors: `Ya existe una solicitud planificada para "${existing.companySnapshot}" con las mismas personas en el rango ${startStr} - ${endStr}.`,
      };
    }
  }

  const personErrors: string[] = [];
  for (const legalId of newLegalIds) {
    const overlappingForPerson = await PlannedAccessEntity.findOverlappingForPerson(
      legalId,
      parsed.data.expectedStartDatetime,
      parsed.data.expectedEndDatetime ?? null,
    );

    for (const existing of overlappingForPerson) {
      const startStr = formatPlannedDate(existing.expectedStartDatetime);
      const endStr = existing.expectedEndDatetime
        ? formatPlannedDate(existing.expectedEndDatetime)
        : "sin fecha de fin definida";

      personErrors.push(
        `La persona con DNI ${legalId} ya está registrada en otra solicitud planificada para "${existing.companySnapshot}" (${startStr} - ${endStr}).`,
      );
    }
  }

  if (personErrors.length > 0) {
    return {
      success: false,
      errors: personErrors.join(" "),
    };
  }

  await PlannedAccessEntity.create({
    ...parsed.data,
    siteId,
    requestedById: author.id,
    approvedById: author.id,
  });

  return { success: true };
}

function formatPlannedDate(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export async function updatePlannedAccessStatus(
  input: Record<string, unknown>,
  options: PlannedAccessAuthorOptions,
) {
  const parsed = await updatePlannedAccessStatusSchema.safeParseAsync(input);

  if (!parsed.success) {
    return { success: false, errors: z.treeifyError(parsed.error) };
  }

  const author = await UserEntity.getByUsername(options.authorUsername);

  if (!author) {
    return { success: false, errors: "unauthorized" };
  }

  if (parsed.data.status === "APPROVED") {
    const plannedAccess = await PlannedAccessEntity.findById(parsed.data.id);

    if (!plannedAccess) {
      return { success: false, errors: "La solicitud planificada no existe." };
    }

    for (const person of plannedAccess.plannedAccessPersons) {
      if (!person.externalWorkerId) continue;

      const worker = await ExternalWorkerEntity.findById(person.externalWorkerId);
      if (!worker) continue;

      const docResult = await validateWorkerDocumentsForApproval(
        person.externalWorkerId,
        worker.workCategory.requiresTraining,
      );

      if (!docResult.valid) {
        const workerName = `${worker.firstName} ${worker.lastName}`;
        const legalId = worker.legalId;
        const missingLabels = docResult.missingTypes.map(
          (t) => DOCUMENT_TYPE_LABELS[t as keyof typeof DOCUMENT_TYPE_LABELS],
        );
        const expiredLabels = docResult.expiredTypes.map(
          (t) => DOCUMENT_TYPE_LABELS[t as keyof typeof DOCUMENT_TYPE_LABELS],
        );

        const errorParts: string[] = [];
        if (missingLabels.length > 0) {
          errorParts.push(`faltan: ${missingLabels.join(", ")}`);
        }
        if (expiredLabels.length > 0) {
          errorParts.push(`expirados: ${expiredLabels.join(", ")}`);
        }

        return {
          success: false,
          errors: `El trabajador ${workerName} (${legalId}) no tiene la documentacion requerida vigente (${errorParts.join("; ")}).`,
        };
      }
    }
  }

  await PlannedAccessEntity.updateStatus({
    id: parsed.data.id,
    status: parsed.data.status,
    approvedById: author.id,
    approvedAt: parsed.data.status === "APPROVED" ? new Date() : null,
  });

  return { success: true };
}

export async function createAccessLogFromPlannedAccess(
  input: Record<string, unknown>,
  options: PlannedAccessAuthorOptions & { lockedSiteId: string },
) {
  const parsed = await createAccessLogFromPlannedAccessSchema.safeParseAsync(
    input,
  );

  if (!parsed.success) {
    return { success: false, errors: z.treeifyError(parsed.error) };
  }

  const author = await UserEntity.getByUsername(options.authorUsername);

  if (!author) {
    return { success: false, errors: "unauthorized" };
  }

  const plannedAccess = await PlannedAccessEntity.findById(
    parsed.data.plannedAccessId,
  );

  if (!plannedAccess) {
    return { success: false, errors: "La solicitud planificada no existe." };
  }

  if (plannedAccess.siteId !== options.lockedSiteId) {
    return {
      success: false,
      errors: "La solicitud no pertenece al centro actual.",
    };
  }

  if (
    plannedAccess.status !== "APPROVED" &&
    plannedAccess.status !== "PARTIALLY_USED"
  ) {
    return {
      success: false,
      errors: "Solo se pueden registrar accesos planificados aprobados o parcialmente usados.",
    };
  }

  if (
    !isPlannedForToday(
      plannedAccess.expectedStartDatetime,
      plannedAccess.expectedEndDatetime,
    )
  ) {
    return {
      success: false,
      errors: "La solicitud planificada no corresponde al dia actual.",
    };
  }

  const person = plannedAccess.plannedAccessPersons.find(
    (plannedAccessPerson) =>
      plannedAccessPerson.id === parsed.data.plannedAccessPersonId,
  );

  if (!person) {
    return {
      success: false,
      errors: "La persona no pertenece a esta solicitud planificada.",
    };
  }

  const personHasRegisteredAccess = await PlannedAccessEntity.hasPersonAccessLog(
    person.id,
  );

  if (personHasRegisteredAccess) {
    return {
      success: false,
      errors: "Esta persona ya registró su ingreso desde esta solicitud planificada.",
    };
  }

  const personIsAlreadyInside =
    (await AccessLogEntity.findOpenByLegalIdInSite(
      person.legalIdSnapshot,
      options.lockedSiteId,
    )) !== null;

  if (personIsAlreadyInside) {
    return {
      success: false,
      errors:
        "Esta persona ya se encuentra registrada dentro del centro. No se puede registrar otro acceso para esta persona.",
    };
  }

  await AccessLogEntity.create({
    entryTimestamp: new Date(),
    entrySignatureEnvelope: await encryptValue(
      JSON.stringify(parsed.data.entrySignaturePayload),
    ),
    companyNameSnapshot: plannedAccess.companySnapshot,
    firstNameSnapshot: person.firstNameSnapshot,
    middleNameSnapshot: person.middleNameSnapshot ?? undefined,
    lastNameSnapshot: person.lastNameSnapshot,
    secondLastNameSnapshot: person.secondLastNameSnapshot ?? undefined,
    phoneNumber: person.phoneNumber ?? undefined,
    legalIdSnapshot: person.legalIdSnapshot,
    externalWorkerId: person.externalWorkerId ?? undefined,
    withVehicle: false,
    visitReason: plannedAccess.visitReason,
    siteId: options.lockedSiteId,
    createdById: author.id,
    plannedAccessId: plannedAccess.id,
    plannedAccessPersonId: person.id,
  });

  const totalPersons = plannedAccess.plannedAccessPersons.length;
  const usedPersons = await PlannedAccessEntity.countLinkedAccessLogs(
    plannedAccess.id,
  );

  if (usedPersons >= totalPersons) {
    await PlannedAccessEntity.updateStatus({
      id: plannedAccess.id,
      status: "USED",
      approvedById: author.id,
    });
  } else if (usedPersons > 0) {
    await PlannedAccessEntity.updateStatus({
      id: plannedAccess.id,
      status: "PARTIALLY_USED",
      approvedById: author.id,
    });
  }

  return { success: true };
}
