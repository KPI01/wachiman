import z from "zod";
import type { PlannedAccessStatus } from "../../../prisma/generated/prisma/client";
import { encryptValue } from "../crypt.server";
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
  status?: PlannedAccessStatus;
  siteId?: string;
  requestedById?: string;
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

  await PlannedAccessEntity.create({
    ...parsed.data,
    siteId: options.lockedSiteId ?? parsed.data.siteId,
    requestedById: author.id,
    approvedById: author.id,
  });

  return { success: true };
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

  if (plannedAccess.status !== "APPROVED") {
    return {
      success: false,
      errors: "Solo se pueden registrar accesos planificados aprobados.",
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

  const personIsAlreadyInside =
    (await AccessLogEntity.findOpenByLegalId(person.legalIdSnapshot)) !== null;

  if (personIsAlreadyInside) {
    return {
      success: false,
      errors:
        "Esta persona ya se encuentra registrada dentro del centro. No se puede registrar otro acceso para esta persona.",
    };
  }

  await AccessLogEntity.create({
    entryTimestamp: new Date(),
    entrySignatureEnvelope: encryptValue(
      JSON.stringify(parsed.data.entrySignaturePayload),
    ),
    companyNameSnapshot: plannedAccess.companySnapshot,
    firstNameSnapshot: person.firstNameSnapshot,
    middleNameSnapshot: person.middleNameSnapshot ?? undefined,
    lastNameSnapshot: person.lastNameSnapshot,
    secondLastNameSnapshot: person.secondLastNameSnapshot ?? undefined,
    phoneNumber: person.phoneNumber ?? undefined,
    legalIdSnapshot: person.legalIdSnapshot,
    withVehicle: false,
    visitReason: plannedAccess.visitReason,
    siteId: options.lockedSiteId,
    createdById: author.id,
  });

  return { success: true };
}
