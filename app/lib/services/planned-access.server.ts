import z from "zod";
import { createCompanySchema } from "../schemas/company";
import { optionalString, requiredString } from "../schemas/generic";
import { resolvePlannedAccessCompany } from "./company.server";
import type { PlannedAccessStatus } from "../../../db/enums";
import { encryptValue } from "../crypt.server";
// Comentado: la aprobación e ingreso ya no validan documentación.
// import { DOCUMENT_TYPE_LABELS } from "../models/worker-document";
import { ExternalWorkerEntity } from "../database/external-worker.server";
import { AccessLogEntity } from "../database/access-log.server";
import { PlannedAccessEntity } from "../database/planned-access.server";
import { UserEntity } from "../database/user.server";
import { WorkCategoryEntity } from "../database/work-category.server";
import { AllowedAreaEntity } from "../database/allowed-area.server";
import { CompanyEntity } from "../database/company.server";
import { AuditLogEntity } from "../database/audit-log.server";
import { AppSettingsEntity } from "../database/app-settings.server";
import { SiteEntity } from "../database/site.server";
import { WorkPermitEntity } from "../database/work-permit.server";
import { getAppConfig } from "../app-config.server";
import { uploadWorkerDocument } from "./worker-document.server";
// Comentado: la aprobación e ingreso ya no validan documentación.
// import { endOfUtcDay } from "../document-expiry";
import { isPlannedAccessEnterableAt } from "../planned-access-time";
import {
  createAccessLogFromPlannedAccessSchema,
  createPlannedAccessSchema,
  updatePlannedAccessSchema,
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
  expectedFrom?: Date;
  expectedTo?: Date;
  query?: string;
  requestedByQuery?: string;
  visitorQuery?: string;
  companyQuery?: string;
}) {
  return await PlannedAccessEntity.findMany(input);
}

export async function getPlannedAccessApprovalData(id: string) {
  const plannedAccess = await PlannedAccessEntity.findById(id);
  return { plannedAccess };
}

// Comentado: la aprobación e ingreso ya no validan documentación.
// function getPlannedAccessEnd(expectedStart: Date, expectedEnd?: Date | null) {
//   return expectedEnd ?? endOfUtcDay(expectedStart);
// }

// function formatDocumentValidationError(
//   worker: { firstName: string; lastName: string; legalId: string },
//   result: { missingTypes: DocumentType[]; expiredTypes: DocumentType[] },
// ) {
//   const errorParts: string[] = [];
//   if (result.missingTypes.length > 0) {
//     errorParts.push(
//       `faltan: ${result.missingTypes.map((type) => DOCUMENT_TYPE_LABELS[type]).join(", ")}`,
//     );
//   }
//   if (result.expiredTypes.length > 0) {
//     errorParts.push(
//       `expirados: ${result.expiredTypes.map((type) => DOCUMENT_TYPE_LABELS[type]).join(", ")}`,
//     );
//   }
//   return `El trabajador ${worker.firstName} ${worker.lastName} (${worker.legalId}) no tiene la documentación requerida vigente (${errorParts.join("; ")}).`;
// }

type PlannedAccessAuthorOptions = {
  authorUsername: string;
  lockedSiteId?: string;
  canApprove?: boolean;
  requestedById?: string;
};

function normalizeLegalId(value: string) {
  return value.trim().toUpperCase();
}

const validatePlannedAccessCompanySchema = z.object({
  id: requiredString,
  expectedUpdatedAt: z.coerce.date(),
  mode: z.enum(["existing", "new"]),
  companyId: optionalString,
});

export async function validatePlannedAccessCompany(
  input: Record<string, unknown>,
  options: PlannedAccessAuthorOptions,
) {
  const author = await UserEntity.getByUsername(options.authorUsername);
  if (!author || !["ADMIN", "SECURITY_MANAGER", "ACCESS_APPROVER"].includes(author.role ?? "")) {
    return { success: false, errors: "No tienes permisos para validar empresas." };
  }
  const parsed = validatePlannedAccessCompanySchema.safeParse(input);
  if (!parsed.success) return { success: false, errors: z.treeifyError(parsed.error) };
  const plannedAccess = await PlannedAccessEntity.findById(parsed.data.id);
  if (!plannedAccess || (options.lockedSiteId && plannedAccess.siteId !== options.lockedSiteId)) {
    return { success: false, errors: "No tienes permisos para esta solicitud." };
  }
  if (plannedAccess.companyId || (plannedAccess.status ?? "PENDING_APPROVAL") !== "PENDING_APPROVAL") {
    return { success: false, errors: "La solicitud ya no tiene una empresa pendiente de validar." };
  }
  let newCompany: Parameters<typeof CompanyEntity.create>[0] | undefined;
  if (parsed.data.mode === "new") {
    const company = await createCompanySchema.safeParseAsync(input);
    if (!company.success) return { success: false, errors: z.treeifyError(company.error) };
    const matches = await CompanyEntity.findNameMatches(company.data.name);
    if (matches.length) {
      return { success: false, errors: "Ya existe una empresa con ese nombre. Selecciónala en la opción de empresa existente." };
    }
    newCompany = company.data;
  } else if (!parsed.data.companyId || !await CompanyEntity.findById(parsed.data.companyId)) {
    return { success: false, errors: "Selecciona una empresa existente de la lista." };
  }
  let updated;
  try {
    updated = await PlannedAccessEntity.validateCompany({
      id: plannedAccess.id,
      expectedUpdatedAt: parsed.data.expectedUpdatedAt,
      companyId: parsed.data.companyId,
      newCompany,
    });
  } catch (error) {
    const cause = (error as { cause?: { code?: string }; code?: string });
    if (cause.code === "23505" || cause.cause?.code === "23505") {
      return { success: false, errors: "La empresa ya existe o su nombre corto está en uso. Revisa el catálogo antes de continuar." };
    }
    throw error;
  }
  if (!updated) return { success: false, errors: "La solicitud ha cambiado. Recarga la página antes de validar la empresa." };
  await AuditLogEntity.create({
    entityType: "PlannedAccess", entityId: updated.id,
    action: "PLANNED_ACCESS_COMPANY_VALIDATED", changedBy: author.id,
    summary: "Empresa de la solicitud validada y asociada",
    metadata: { originalCompanyName: plannedAccess.companySnapshot, companyId: updated.companyId,
      companyName: updated.companySnapshot, createdCompany: Boolean(newCompany) },
  });
  return { success: true };
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

  const plannedAccess = await PlannedAccessEntity.create({
    ...parsed.data,
    ...await resolvePlannedAccessCompany(parsed.data.companySnapshot, parsed.data.companyId),
    siteId,
    requestedById: author.id,
    departmentId: author.departmentId,
  });

  if (plannedAccess) {
    try {
      await AuditLogEntity.create({
        entityType: "PlannedAccess",
        entityId: plannedAccess.id,
        action: "PLANNED_ACCESS_CREATED",
        changedBy: author.id,
        summary: "Solicitud de acceso planificado creada",
        metadata: {
          siteId,
          companySnapshot: plannedAccess.companySnapshot,
          visitReason: plannedAccess.visitReason,
          expectedStartDatetime: plannedAccess.expectedStartDatetime,
          expectedEndDatetime: plannedAccess.expectedEndDatetime,
          persons: plannedAccess.plannedAccessPersons.map((person) => ({
            id: person.id,
            firstNameSnapshot: person.firstNameSnapshot,
            middleNameSnapshot: person.middleNameSnapshot,
            lastNameSnapshot: person.lastNameSnapshot,
            secondLastNameSnapshot: person.secondLastNameSnapshot,
            legalIdSnapshot: person.legalIdSnapshot,
            phoneNumber: person.phoneNumber,
            externalWorkerId: person.externalWorkerId,
            workCategoryId: person.workCategoryId,
            allowedAreaId: person.allowedAreaId,
          })),
        },
      });
    } catch (error) {
      console.error("No se pudo registrar la auditoría de PlannedAccess", error);
    }
  }

  return { success: true };
}

export async function updatePlannedAccess(
  input: Record<string, unknown>,
  options: PlannedAccessAuthorOptions,
) {
  const parsed = await updatePlannedAccessSchema.safeParseAsync(input);
  if (!parsed.success) {
    return { success: false, errors: z.treeifyError(parsed.error) };
  }

  const author = await UserEntity.getByUsername(options.authorUsername);
  if (!author) return { success: false, errors: "unauthorized" };

  const plannedAccess = await PlannedAccessEntity.findById(parsed.data.id);
  if (!plannedAccess) {
    return { success: false, errors: "La solicitud planificada no existe." };
  }

  if (plannedAccess.status !== "PENDING_APPROVAL") {
    return {
      success: false,
      errors: "Solo se pueden editar solicitudes pendientes de aprobación.",
    };
  }

  if (options.lockedSiteId && plannedAccess.siteId !== options.lockedSiteId) {
    return { success: false, errors: "No tienes permisos para esta solicitud." };
  }

  const isPrivileged = author.role === "ADMIN" || author.role === "SECURITY_MANAGER";
  if (!isPrivileged && plannedAccess.requestedById !== author.id) {
    return { success: false, errors: "Solo puedes editar tus propias solicitudes." };
  }
  if (!isPrivileged && plannedAccess.departmentId !== author.departmentId) {
    return { success: false, errors: "No puedes editar solicitudes de otro departamento." };
  }

  const canChangeSite = isPrivileged && !options.lockedSiteId;
  const siteId = canChangeSite
    ? parsed.data.siteId
    : (options.lockedSiteId ?? plannedAccess.siteId);
  if (parsed.data.siteId !== siteId) {
    return { success: false, errors: "No puedes cambiar el centro de esta solicitud." };
  }

  const existingPersonIds = new Set(
    plannedAccess.plannedAccessPersons.map((person) => person.id),
  );
  const unknownPerson = parsed.data.persons.find(
    (person) => person.id && !existingPersonIds.has(person.id),
  );
  if (unknownPerson) {
    return {
      success: false,
      errors: "Una de las personas no pertenece a esta solicitud.",
    };
  }

  const newLegalIds = parsed.data.persons.map((person) => person.legalIdSnapshot);
  const overlappingSameSite = await PlannedAccessEntity.findOverlappingPlannedAccess(
    siteId,
    parsed.data.expectedStartDatetime,
    parsed.data.expectedEndDatetime ?? null,
    parsed.data.id,
  );

  for (const existing of overlappingSameSite) {
    const sharedLegalId = newLegalIds.find((id) =>
      existing.plannedAccessPersons.some((person) => person.legalIdSnapshot === id),
    );
    if (sharedLegalId) {
      return {
        success: false,
        errors: `Ya existe una solicitud planificada para "${existing.companySnapshot}" con las mismas personas en el rango ${formatPlannedDate(existing.expectedStartDatetime)} - ${existing.expectedEndDatetime ? formatPlannedDate(existing.expectedEndDatetime) : "sin fecha de fin definida"}.`,
      };
    }
  }

  const personErrors: string[] = [];
  for (const legalId of newLegalIds) {
    const overlappingForPerson = await PlannedAccessEntity.findOverlappingForPerson(
      legalId,
      parsed.data.expectedStartDatetime,
      parsed.data.expectedEndDatetime ?? null,
      parsed.data.id,
    );
    for (const existing of overlappingForPerson) {
      personErrors.push(
        `La persona con DNI ${legalId} ya está registrada en otra solicitud planificada para "${existing.companySnapshot}" (${formatPlannedDate(existing.expectedStartDatetime)} - ${existing.expectedEndDatetime ? formatPlannedDate(existing.expectedEndDatetime) : "sin fecha de fin definida"}).`,
      );
    }
  }
  if (personErrors.length > 0) return { success: false, errors: personErrors.join(" ") };

  const result = await PlannedAccessEntity.updatePending({
    ...parsed.data,
    ...await resolvePlannedAccessCompany(parsed.data.companySnapshot, parsed.data.companyId),
    siteId,
    expectedEndDatetime: parsed.data.expectedEndDatetime ?? null,
  });
  if (result.kind === "conflict") {
    return { success: false, errors: "La solicitud cambió o dejó de estar pendiente. Recarga la página e inténtalo de nuevo." };
  }
  if (result.kind === "linked-person") {
    return { success: false, errors: "No puedes eliminar una persona que ya tiene un ingreso registrado." };
  }

  const updated = await PlannedAccessEntity.findById(result.id);
  if (!updated) return { success: false, errors: "La solicitud no pudo actualizarse." };

  await AuditLogEntity.create({
    entityType: "PlannedAccess",
    entityId: updated.id,
    action: "PLANNED_ACCESS_UPDATED",
    changedBy: author.id,
    summary: "Solicitud de acceso planificado actualizada",
    metadata: {
      previousUpdatedAt: plannedAccess.updatedAt,
      before: {
        expectedStartDatetime: plannedAccess.expectedStartDatetime,
        expectedEndDatetime: plannedAccess.expectedEndDatetime,
        companySnapshot: plannedAccess.companySnapshot,
        visitReason: plannedAccess.visitReason,
        siteId: plannedAccess.siteId,
        persons: plannedAccess.plannedAccessPersons.map((person) => ({
          id: person.id,
          firstNameSnapshot: person.firstNameSnapshot,
          middleNameSnapshot: person.middleNameSnapshot,
          lastNameSnapshot: person.lastNameSnapshot,
          secondLastNameSnapshot: person.secondLastNameSnapshot,
          phoneNumber: person.phoneNumber,
          legalIdSnapshot: person.legalIdSnapshot,
          externalWorkerId: person.externalWorkerId,
          workCategoryId: person.workCategoryId,
          allowedAreaId: person.allowedAreaId,
        })),
      },
      after: {
        expectedStartDatetime: updated.expectedStartDatetime,
        expectedEndDatetime: updated.expectedEndDatetime,
        companySnapshot: updated.companySnapshot,
        visitReason: updated.visitReason,
        siteId: updated.siteId,
        persons: updated.plannedAccessPersons.map((person) => ({
          id: person.id,
          firstNameSnapshot: person.firstNameSnapshot,
          middleNameSnapshot: person.middleNameSnapshot,
          lastNameSnapshot: person.lastNameSnapshot,
          secondLastNameSnapshot: person.secondLastNameSnapshot,
          phoneNumber: person.phoneNumber,
          legalIdSnapshot: person.legalIdSnapshot,
          externalWorkerId: person.externalWorkerId,
          workCategoryId: person.workCategoryId,
          allowedAreaId: person.allowedAreaId,
        })),
      },
    },
  });

  return { success: true };
}

export async function uploadPlannedAccessPersonDocument(
  plannedAccessId: string,
  personId: string,
  file: File,
  input: Record<string, string>,
  options: PlannedAccessAuthorOptions,
) {
  const author = await UserEntity.getByUsername(options.authorUsername);
  if (!author) return { success: false as const, errors: "unauthorized" };

  const plannedAccess = await PlannedAccessEntity.findById(plannedAccessId);
  if (!plannedAccess) return { success: false as const, errors: "La solicitud no existe." };
  if (plannedAccess.status !== "PENDING_APPROVAL") {
    return { success: false as const, errors: "Solo puedes cargar documentación de solicitudes pendientes." };
  }
  if (options.lockedSiteId && plannedAccess.siteId !== options.lockedSiteId) {
    return { success: false as const, errors: "No tienes permisos para esta solicitud." };
  }

  const person = plannedAccess.plannedAccessPersons.find((item) => item.id === personId);
  if (!person) return { success: false as const, errors: "La persona no pertenece a esta solicitud." };

  const categoryId = input.workCategoryId || person.workCategoryId;
  let worker = person.externalWorkerId
    ? await ExternalWorkerEntity.findById(person.externalWorkerId)
    : await ExternalWorkerEntity.findByLegalId(normalizeLegalId(person.legalIdSnapshot));

  if (!worker) {
    if (!categoryId) return { success: false as const, errors: "Selecciona un tipo de trabajo antes de cargar documentación." };
    const company = plannedAccess.companyId ? await CompanyEntity.findById(plannedAccess.companyId) : null;
    if (!company) return { success: false as const, errors: "Valida y asocia la empresa antes de crear trabajadores." };
    worker = await ExternalWorkerEntity.create({
      firstName: person.firstNameSnapshot,
      middleName: person.middleNameSnapshot ?? undefined,
      lastName: person.lastNameSnapshot,
      secondLastName: person.secondLastNameSnapshot ?? undefined,
      phoneNumber: person.phoneNumber ?? undefined,
      legalId: normalizeLegalId(person.legalIdSnapshot),
      companyId: company.id,
      workCategoryId: categoryId,
    });
  }

  const effectiveCategoryId = categoryId ?? worker.workCategoryId;
  if (!effectiveCategoryId) return { success: false as const, errors: "Selecciona un tipo de trabajo antes de cargar documentación." };
  const linked = await PlannedAccessEntity.linkPersonWorker(plannedAccessId, personId, worker.id, effectiveCategoryId);
  if (!linked) return { success: false as const, errors: "No se pudo vincular la persona al trabajador." };

  return uploadWorkerDocument(worker.id, file, {
    ...input,
    workCategoryId: effectiveCategoryId,
  }, author.id);
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
  const personAllowedAreas: Record<string, string | null> = {};
  for (const [key, value] of Object.entries(input)) {
    const match = /^personWorkCategories\[(.+)]$/.exec(key);
    if (match) personWorkCategories[match[1]] = String(value) || null;
    const areaMatch = /^personAllowedAreas\[(.+)]$/.exec(key);
    if (areaMatch) personAllowedAreas[areaMatch[1]] = String(value) || null;
  }

  const parsed = await updatePlannedAccessStatusSchema.safeParseAsync({
    ...input,
    personWorkCategories,
    personAllowedAreas,
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

  // Older rows may have a null status because the column predates its default.
  // The list already treats those rows as pending, so transitions must use the
  // same effective value instead of rejecting them inconsistently.
  const currentStatus = existingPlannedAccess.status ?? "PENDING_APPROVAL";

  const isOwnRequest = existingPlannedAccess.requestedById === author.id;
  const canApproveOwnRequest =
    author.role === "ADMIN" ||
    author.role === "SECURITY_MANAGER" ||
    author.role === "ACCESS_APPROVER";

  if (
    isOwnRequest &&
    (parsed.data.status === "REJECTED" ||
      (parsed.data.status === "APPROVED" && !canApproveOwnRequest))
  ) {
    await AuditLogEntity.create({
      entityType: "PlannedAccess",
      entityId: existingPlannedAccess.id,
      action: "SELF_APPROVAL_BLOCKED",
      changedBy: author.id,
      summary: "Se bloqueó una decisión sobre una solicitud propia",
      metadata: { attemptedStatus: parsed.data.status },
    });
    return {
      success: false,
      errors: parsed.data.status === "REJECTED"
        ? "No puedes rechazar una solicitud creada por ti."
        : "No puedes aprobar una solicitud propia con este rol.",
    };
  }

  if (parsed.data.status === "APPROVED") {
    const plannedAccess = existingPlannedAccess;

    if (!plannedAccess) {
      return { success: false, errors: "La solicitud planificada no existe." };
    }

    if (currentStatus !== "PENDING_APPROVAL") {
      return { success: false, errors: "La solicitud ya no está pendiente de aprobación." };
    }

    const company = plannedAccess.companyId ? await CompanyEntity.findById(plannedAccess.companyId) : null;
    if (!company) return { success: false, errors: "Valida y asocia la empresa antes de aprobar la solicitud." };

    const selectedCategories = parsed.data.personWorkCategories ?? {};
    const selectedAreas = parsed.data.personAllowedAreas ?? {};
    const personWorkCategories: Array<{ personId: string; workCategoryId: string; externalWorkerId: string }> = [];
    const personAllowedAreas: Array<{ personId: string; allowedAreaId: string; allowedAreaSnapshot: string }> = [];
    const validationErrors: string[] = [];
    const decisionEvidence: Array<Record<string, unknown>> = [];

    for (const person of plannedAccess.plannedAccessPersons) {
      const categoryId = selectedCategories[person.id] || null;
      const allowedAreaId = selectedAreas[person.id] || person.allowedAreaId || null;
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
        // Comentado: se exigía un tipo de trabajo para crear personas nuevas.
        // if (!categoryId) {
        //   validationErrors.push(`La persona ${person.firstNameSnapshot} ${person.lastNameSnapshot} es nueva y necesita un tipo de trabajo.`);
        //   continue;
        // }
        // Nuevo: se resuelve un tipo de trabajo por defecto cuando no se indicó uno.
        const defaultCategoryId = await WorkCategoryEntity.resolveDefault();
        const createdWorker = await ExternalWorkerEntity.create({
          firstName: person.firstNameSnapshot,
          middleName: person.middleNameSnapshot ?? undefined,
          lastName: person.lastNameSnapshot,
          secondLastName: person.secondLastNameSnapshot ?? undefined,
          phoneNumber: person.phoneNumber ?? undefined,
          legalId,
          companyId: company.id,
          workCategoryId: categoryId ?? defaultCategoryId,
        });
        worker = createdWorker;
      }

      if (!worker) {
        validationErrors.push(`No se pudo resolver el trabajador de ${person.firstNameSnapshot} ${person.lastNameSnapshot}.`);
        continue;
      }

      const effectiveCategoryId = categoryId ?? worker.workCategoryId;
      const category = await WorkCategoryEntity.findById(effectiveCategoryId);
      if (!category) {
        validationErrors.push(`El tipo de trabajo seleccionado para ${worker.firstName} ${worker.lastName} no existe.`);
        continue;
      }

      const allowedArea = allowedAreaId
        ? await AllowedAreaEntity.findById(allowedAreaId)
        : null;
      if (!allowedArea) {
        validationErrors.push(`El área autorizada para ${worker.firstName} ${worker.lastName} no existe o no fue seleccionada.`);
        continue;
      }

      const workerId = worker.id;
      personWorkCategories.push({ personId: person.id, workCategoryId: effectiveCategoryId, externalWorkerId: workerId });
      personAllowedAreas.push({
        personId: person.id,
        allowedAreaId: allowedArea.id,
        allowedAreaSnapshot: allowedArea.name,
      });
      // Comentado: la aprobación ya no valida documentación.
      // const requirements = {
      //   requiresTraining: Boolean(category.requiresTraining),
      //   requiresSpecialPermission: Boolean(category.requiresSpecialPermission),
      // };
      // const docResult = await validateWorkerDocumentsForAccess(
      //   workerId,
      //   requirements,
      //   getPlannedAccessEnd(
      //     plannedAccess.expectedStartDatetime,
      //     plannedAccess.expectedEndDatetime,
      //   ),
      // );

      // if (!docResult.valid) {
      //   validationErrors.push(formatDocumentValidationError(worker, docResult));
      // } else {
      //   decisionEvidence.push({
      //     personId: person.id,
      //     workerId,
      //     workCategoryId: effectiveCategoryId,
      //     requirements,
      //     documents: docResult.evaluatedDocuments,
      //   });
      // }

      decisionEvidence.push({
        personId: person.id,
        workerId,
        workCategoryId: effectiveCategoryId,
        allowedAreaId: allowedArea.id,
      });
    }

    if (validationErrors.length > 0) {
      return { success: false, errors: validationErrors.join(" ") };
    }

    const approved = await PlannedAccessEntity.approve({
      id: parsed.data.id,
      expectedUpdatedAt: plannedAccess.updatedAt,
      status: "APPROVED",
      approvedById: author.id,
      approvedAt: new Date(),
      decisionReason: parsed.data.decisionReason ?? null,
      decisionById: author.id,
      decisionAt: new Date(),
       personWorkCategories,
       personAllowedAreas,
    });

    if (!approved) {
      return { success: false, errors: "La solicitud ya no está pendiente de aprobación." };
    }

    await AuditLogEntity.create({
      entityType: "PlannedAccess",
      entityId: approved.id,
      action: "PLANNED_ACCESS_APPROVED",
      changedBy: author.id,
      summary: "Solicitud de acceso planificado aprobada",
      metadata: {
        reason: parsed.data.decisionReason ?? null,
        selfApproval: isOwnRequest,
        evidence: decisionEvidence,
      },
    });

    return { success: true };
  }

  const allowedPreviousStatuses = parsed.data.status === "REJECTED"
    ? ["PENDING_APPROVAL"]
    : ["PENDING_APPROVAL", "APPROVED"];
  if (!allowedPreviousStatuses.includes(currentStatus)) {
    return { success: false, errors: "La transición solicitada no es válida para el estado actual." };
  }

  const updated = await PlannedAccessEntity.updateStatus({
    id: parsed.data.id,
    status: parsed.data.status,
    decisionReason: parsed.data.decisionReason ?? null,
    decisionById: author.id,
    decisionAt: new Date(),
  });

  if (!updated) {
    return { success: false, errors: "La solicitud no pudo actualizarse." };
  }

  await AuditLogEntity.create({
    entityType: "PlannedAccess",
    entityId: updated.id,
    action: parsed.data.status === "REJECTED"
      ? "PLANNED_ACCESS_REJECTED"
      : "PLANNED_ACCESS_CANCELED",
    changedBy: author.id,
    summary: parsed.data.status === "REJECTED"
      ? "Solicitud de acceso planificado rechazada"
      : "Solicitud de acceso planificado cancelada",
    metadata: {
      previousStatus: currentStatus,
      reason: parsed.data.decisionReason,
    },
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
    plannedAccess.status !== "PARTIALLY_USED" &&
    plannedAccess.status !== "USED"
  ) {
    return {
      success: false,
      errors: "Solo se pueden registrar accesos planificados aprobados, parcialmente usados o usados.",
    };
  }

  const settings = await AppSettingsEntity.getGlobal();
  if (!settings) {
    return {
      success: false,
      errors: "La configuración global de accesos no está disponible.",
    };
  }

  const now = new Date();
  if (
    !isPlannedAccessEnterableAt({
      expectedStart: plannedAccess.expectedStartDatetime,
      expectedEnd: plannedAccess.expectedEndDatetime,
      earlyArrivalToleranceMinutes: settings.earlyArrivalToleranceMinutes,
      now,
    })
  ) {
    return {
      success: false,
      errors: "La solicitud planificada no corresponde al intervalo actual.",
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

  const individualDecision = await WorkPermitEntity.findDecision(person.id);
  if (individualDecision && individualDecision.accessDecision !== "APPROVED") {
    return { success: false, errors: individualDecision.accessDecision === "DENIED"
      ? `El acceso de esta persona fue rechazado${individualDecision.decisionReason ? `: ${individualDecision.decisionReason}` : "."}`
      : "El acceso de esta persona está pendiente de aprobación." };
  }

  if (plannedAccess.plannedAccessPersons.some((person) => person.decision && person.decision.accessDecision !== "PENDING")) {
    return { success: false, errors: "No se puede editar una solicitud cuya revisión por visitante ya ha comenzado." };
  }

  if (!person.externalWorkerId) {
    return {
      success: false,
      errors: "La persona no está vinculada a un trabajador externo validable.",
    };
  }

  if (!person.allowedArea) {
    return {
      success: false,
      errors: "La persona no tiene un área autorizada definida en la solicitud planificada.",
    };
  }

  const worker = await ExternalWorkerEntity.findById(person.externalWorkerId);
  if (!worker) {
    return { success: false, errors: "El trabajador externo vinculado ya no existe." };
  }

  const workPermitsEnabled = getAppConfig().workPermitsEnabled;

  const category = person.workCategory ?? worker.workCategory;
  if (!category) {
    return { success: false, errors: "La persona no tiene un tipo de trabajo válido." };
  }
  const workPermit = workPermitsEnabled
    ? await WorkPermitEntity.findByPersonId(person.id)
    : null;
  if (workPermitsEnabled && category.requiresWorkPermit && individualDecision?.workDecision !== "NOT_REQUIRED") {
    if (!workPermit || workPermit.status !== "APPROVED") {
      return { success: false, errors: "El permiso de trabajo de esta persona no está aprobado." };
    }
    if (!await WorkPermitEntity.hasSignature(workPermit.id, "WORKER")) {
      return { success: false, errors: "El trabajador debe firmar el permiso de trabajo antes de entrar." };
    }
  }
  const [site, company, holder] = await Promise.all([
    SiteEntity.findById(options.lockedSiteId),
    plannedAccess.companyId ? CompanyEntity.findById(plannedAccess.companyId) : Promise.resolve(null),
    AppSettingsEntity.getGlobal(),
  ]);
  if (!site?.riskInformation || !company || !company.cif || !company.address || !holder?.holderLegalName || !holder.holderTaxId || !holder.holderFiscalAddress) {
    return { success: false, errors: "El centro y la empresa deben tener configurada la información necesaria para firmar." };
  }

  // Comentado: el ingreso al centro ya no valida documentación.
  // const category = person.workCategory ?? worker.workCategory;
  // if (!category) {
  //   return { success: false, errors: "La persona no tiene un tipo de trabajo válido." };
  // }

  // const documentResult = await validateWorkerDocumentsForAccess(
  //   worker.id,
  //   {
  //     requiresTraining: Boolean(category.requiresTraining),
  //     requiresSpecialPermission: Boolean(category.requiresSpecialPermission),
  //   },
  //   getPlannedAccessEnd(
  //     plannedAccess.expectedStartDatetime,
  //     plannedAccess.expectedEndDatetime,
  //   ),
  // );
  // if (!documentResult.valid) {
  //   return { success: false, errors: formatDocumentValidationError(worker, documentResult) };
  // }

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
    entryTimestamp: now,
    entrySignatureEnvelope: await encryptValue(
      JSON.stringify(parsed.data.entrySignaturePayload),
    ),
    riskAcknowledgedAt: now,
    riskAcknowledgementSnapshot: {
      holderLegalName: holder.holderLegalName,
      holderTaxId: holder.holderTaxId,
      holderFiscalAddress: holder.holderFiscalAddress,
      siteName: site.name,
      siteAddress: site.address,
      riskInformation: site.riskInformation,
      riskInformationVersion: site.riskInformationVersion,
      workCategoryName: person.workCategory?.name ?? null,
      workCategoryRiskInformation: person.workCategory?.riskInformation ?? null,
      companyName: company.name,
      companyCif: company.cif,
      companyAddress: company.address,
      acknowledgedAt: now.toISOString(),
    },
    companyNameSnapshot: plannedAccess.companySnapshot,
    companyId: company.id,
    firstNameSnapshot: person.firstNameSnapshot,
    middleNameSnapshot: person.middleNameSnapshot ?? undefined,
    lastNameSnapshot: person.lastNameSnapshot,
    secondLastNameSnapshot: person.secondLastNameSnapshot ?? undefined,
    phoneNumber: person.phoneNumber ?? undefined,
    legalIdSnapshot: person.legalIdSnapshot,
    allowedAreaSnapshot: person.allowedArea.name,
    allowedAreaId: person.allowedArea.id,
    approvedBySnapshot:
      plannedAccess.approvedBy?.fullName ?? author.fullName,
    externalWorkerId: person.externalWorkerId ?? undefined,
    withVehicle: false,
    visitReason: plannedAccess.visitReason,
    siteId: options.lockedSiteId,
    createdById: author.id,
    plannedAccessId: plannedAccess.id,
    plannedAccessPersonId: person.id,
    ...(workPermitsEnabled && workPermit ? { workPermitId: workPermit.id } : {}),
  });

  const totalPersons = plannedAccess.plannedAccessPersons.filter((item) =>
    !item.decision || item.decision.accessDecision === "APPROVED",
  ).length;
  const usedPersons = await PlannedAccessEntity.countPersonsWithAccessLogs(
    plannedAccess.id,
  );

  if (usedPersons >= totalPersons) {
    await PlannedAccessEntity.transitionUsageStatus(plannedAccess.id, "USED");
  } else if (usedPersons > 0) {
    await PlannedAccessEntity.transitionUsageStatus(plannedAccess.id, "PARTIALLY_USED");
  }

  return { success: true };
}
