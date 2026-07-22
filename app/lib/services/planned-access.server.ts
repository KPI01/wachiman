import z from "zod";
import type { PlannedAccessStatus } from "../../../db/enums";
import { encryptValue } from "../crypt.server";
import { DOCUMENT_TYPE_LABELS } from "../models/worker-document";
import { validateWorkerDocumentsForApproval } from "./worker-document.server";
import { ExternalWorkerEntity } from "../database/external-worker.server";
import { AccessLogEntity } from "../database/access-log.server";
import { PlannedAccessEntity } from "../database/planned-access.server";
import { UserEntity } from "../database/user.server";
import { WorkCategoryEntity } from "../database/work-category.server";
import { CompanyEntity } from "../database/company.server";
import { uploadWorkerDocument } from "./worker-document.server";
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
  canApprove?: boolean;
  requestedById?: string;
};

function normalizeLegalId(value: string) {
  return value.trim().toUpperCase();
}

function normalizeCompanyName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function companySlug(value: string) {
  return normalizeCompanyName(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toUpperCase() || "EMPRESA";
}

async function findOrCreateCompany(name: string) {
  const normalizedName = normalizeCompanyName(name);
  const companies = await CompanyEntity.findMany();
  const existing = companies.find(
    (company) => normalizeCompanyName(company.name).toUpperCase() === normalizedName.toUpperCase(),
  );
  if (existing) return existing;

  let slug = companySlug(normalizedName);
  let suffix = 1;
  while (companies.some((company) => company.slug === slug)) {
    suffix += 1;
    slug = `${companySlug(normalizedName)}-${suffix}`;
  }
  return CompanyEntity.create({ name: normalizedName, slug });
}

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
  const personWorkCategories: Record<string, string | null> = {};
  for (const [key, value] of Object.entries(input)) {
    const match = /^personWorkCategories\[(.+)]$/.exec(key);
    if (match) personWorkCategories[match[1]] = String(value) || null;
  }

  const parsed = await updatePlannedAccessStatusSchema.safeParseAsync({
    ...input,
    personWorkCategories,
  });

  if (!parsed.success) {
    return { success: false, errors: z.treeifyError(parsed.error) };
  }

  const author = await UserEntity.getByUsername(options.authorUsername);

  if (!author) {
    return { success: false, errors: "unauthorized" };
  }

  if (parsed.data.status !== "CANCELED" && !options.canApprove) {
    return { success: false, errors: "No tienes permisos para aprobar solicitudes." };
  }

  const existingPlannedAccess = await PlannedAccessEntity.findById(parsed.data.id);
  if (!existingPlannedAccess) {
    return { success: false, errors: "La solicitud planificada no existe." };
  }

  if (options.lockedSiteId && existingPlannedAccess.siteId !== options.lockedSiteId) {
    return { success: false, errors: "No tienes permisos para esta solicitud." };
  }

  if (options.requestedById && existingPlannedAccess.requestedById !== options.requestedById) {
    return { success: false, errors: "Solo puedes modificar tus propias solicitudes." };
  }

  if (parsed.data.status === "APPROVED") {
    const plannedAccess = existingPlannedAccess;

    if (!plannedAccess) {
      return { success: false, errors: "La solicitud planificada no existe." };
    }

    if (plannedAccess.status !== "PENDING_APPROVAL") {
      return { success: false, errors: "La solicitud ya no está pendiente de aprobación." };
    }

    const selectedCategories = parsed.data.personWorkCategories ?? {};
    const personWorkCategories: Array<{ personId: string; workCategoryId: string | null; externalWorkerId: string }> = [];
    const validationErrors: string[] = [];

    for (const person of plannedAccess.plannedAccessPersons) {
      const categoryId = selectedCategories[person.id] || null;
      const legalId = normalizeLegalId(person.legalIdSnapshot);
      const matchedWorker = await ExternalWorkerEntity.findByLegalId(legalId);
      let worker = matchedWorker
        ? await ExternalWorkerEntity.findById(matchedWorker.id)
        : null;

      if (!worker && person.externalWorkerId) {
        const linkedWorker = await ExternalWorkerEntity.findById(person.externalWorkerId);
        if (linkedWorker && normalizeLegalId(linkedWorker.legalId) !== legalId) {
          validationErrors.push(`El trabajador vinculado a ${person.firstNameSnapshot} ${person.lastNameSnapshot} tiene un DNI diferente al de la solicitud.`);
          continue;
        }
        worker = linkedWorker;
      }

      if (!worker) {
        if (!categoryId) {
          validationErrors.push(`La persona ${person.firstNameSnapshot} ${person.lastNameSnapshot} es nueva y necesita una categoría laboral.`);
          continue;
        }
        const company = await findOrCreateCompany(plannedAccess.companySnapshot);
        const createdWorker = await ExternalWorkerEntity.create({
          firstName: person.firstNameSnapshot,
          middleName: person.middleNameSnapshot ?? undefined,
          lastName: person.lastNameSnapshot,
          secondLastName: person.secondLastNameSnapshot ?? undefined,
          phoneNumber: person.phoneNumber ?? undefined,
          legalId,
          companyId: company.id,
          workCategoryId: categoryId,
        });
        worker = createdWorker;
      }

      if (!worker) {
        validationErrors.push(`No se pudo resolver el trabajador de ${person.firstNameSnapshot} ${person.lastNameSnapshot}.`);
        continue;
      }

      const workerId = worker.id;
      personWorkCategories.push({ personId: person.id, workCategoryId: categoryId, externalWorkerId: workerId });

      let requiresTraining = false;
      if (categoryId) {
        const category = await WorkCategoryEntity.findById(categoryId);
        if (!category) {
          validationErrors.push(`La categoría seleccionada para ${worker.firstName} ${worker.lastName} no existe.`);
          continue;
        }
        requiresTraining = Boolean(category.requiresTraining);
      }

      for (const documentType of ["IDENTIFICATION", "TRAINING"] as const) {
        const fileValue = input[`documentFiles[${person.id}][${documentType}]`];
        if (!(fileValue instanceof File) || fileValue.size === 0) continue;
        const expiryDate = input[`documentExpiry[${person.id}][${documentType}]`];
        const uploadResult = await uploadWorkerDocument(
          workerId,
          fileValue,
          {
            documentType,
            expiryDate: typeof expiryDate === "string" ? expiryDate : "",
            notes: typeof input[`documentNotes[${person.id}][${documentType}]`] === "string"
              ? String(input[`documentNotes[${person.id}][${documentType}]`])
              : "",
          },
          author.id,
        );
        if (!uploadResult.success) {
          validationErrors.push(`No se pudo subir ${DOCUMENT_TYPE_LABELS[documentType]} para ${worker.firstName} ${worker.lastName}.`);
        }
      }

      const docResult = await validateWorkerDocumentsForApproval(
        workerId,
        requiresTraining,
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

        validationErrors.push(`El trabajador ${workerName} (${legalId}) no tiene la documentación requerida vigente (${errorParts.join("; ")}).`);
      }
    }

    if (validationErrors.length > 0) {
      return { success: false, errors: validationErrors.join(" ") };
    }

    const approved = await PlannedAccessEntity.approve({
      id: parsed.data.id,
      status: "APPROVED",
      approvedById: author.id,
      approvedAt: new Date(),
      personWorkCategories,
    });

    if (!approved) {
      return { success: false, errors: "La solicitud ya no está pendiente de aprobación." };
    }

    return { success: true };
  }

  const allowedPreviousStatuses = parsed.data.status === "REJECTED"
    ? ["PENDING_APPROVAL"]
    : ["PENDING_APPROVAL", "APPROVED"];
  if (!allowedPreviousStatuses.includes(existingPlannedAccess.status ?? "")) {
    return { success: false, errors: "La transición solicitada no es válida para el estado actual." };
  }

  const updated = await PlannedAccessEntity.updateStatus({
    id: parsed.data.id,
    status: parsed.data.status,
    approvedById: author.id,
    approvedAt: null,
  });

  if (!updated) {
    return { success: false, errors: "La solicitud no pudo actualizarse." };
  }

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
