import z from "zod";
import { encryptValue } from "../crypt.server";
import { AuditLogEntity } from "../database/audit-log.server";
import { CompanyEntity } from "../database/company.server";
import { PlannedAccessEntity } from "../database/planned-access.server";
import { SiteEntity } from "../database/site.server";
import { UserEntity } from "../database/user.server";
import { WorkCategoryEntity } from "../database/work-category.server";
import { WorkPermitEntity } from "../database/work-permit.server";
import {
  createWorkPermitActivitySchema,
  personDecisionSchema,
  workPermitSignatureSchema,
} from "../schemas/work-permit";
import { updatePlannedAccessStatus } from "./planned-access.server";
import type { WorkPermitActivity } from "../../../db/schema";
import { getAppConfig } from "../app-config.server";

type WorkPermitOptions = {
  authorUsername: string;
  lockedSiteId?: string;
};

export function getPersonDecisionInput(formData: FormData) {
  const decisions = new Map<string, Record<string, string>>();

  for (const [name, value] of formData.entries()) {
    const match = /^personDecisions\[([^\]]+)\]\.(accessDecision|workDecision|decisionReason|restrictions)$/.exec(name);
    if (!match) continue;
    const [, personId, field] = match;
    const decision = decisions.get(personId) ?? {};
    decision[field] = String(value);
    decisions.set(personId, decision);
  }

  return Array.from(decisions, ([plannedAccessPersonId, decision]) => ({
    plannedAccessPersonId,
    ...decision,
  }));
}

export async function getWorkPermitsForPlannedAccess(plannedAccessId: string) {
  return WorkPermitEntity.findByPlannedAccessId(plannedAccessId);
}

export async function getWorkPermitForPerson(plannedAccessPersonId: string) {
  return WorkPermitEntity.findByPersonId(plannedAccessPersonId);
}

export async function getApprovedWorkPermitsForSiteOnDate(siteId: string, date: Date) {
  return WorkPermitEntity.findApprovedForSiteOnDate(siteId, date);
}

export async function createAndApproveWorkPermitActivity(
  input: Record<string, unknown>,
  decisionsInput: unknown[],
  options: WorkPermitOptions,
) {
  if (!getAppConfig().workPermitsEnabled) {
    return { success: false, errors: "El proceso de permisos de trabajo está desactivado." };
  }

  const author = await UserEntity.getByUsername(options.authorUsername);
  if (!author) return { success: false, errors: "unauthorized" };

  const plannedAccessId = String(input.plannedAccessId ?? "");
  const plannedAccess = await PlannedAccessEntity.findById(plannedAccessId);
  if (!plannedAccess) return { success: false, errors: "La solicitud no existe." };
  if (options.lockedSiteId && plannedAccess.siteId !== options.lockedSiteId) {
    return { success: false, errors: "No tienes permisos para esta solicitud." };
  }
  if (!plannedAccess.companyId) {
    return { success: false, errors: "Valida y asocia la empresa antes de aprobar la solicitud." };
  }

  const parsedDecisions = decisionsInput.map((decision) =>
    personDecisionSchema.safeParse(decision),
  );
  const invalidDecision = parsedDecisions.find((result) => !result.success);
  if (invalidDecision && !invalidDecision.success) {
    return { success: false, errors: z.treeifyError(invalidDecision.error) };
  }
  const decisions = parsedDecisions.map((result) =>
    result.success ? result.data : null,
  ).filter((decision): decision is NonNullable<typeof decision> => Boolean(decision));

  if (decisions.length !== plannedAccess.plannedAccessPersons.length) {
    return { success: false, errors: "Debes decidir el acceso de todas las personas." };
  }

  const personById = new Map(
    plannedAccess.plannedAccessPersons.map((person) => [person.id, person]),
  );
  const selectedCategoryByPersonId = new Map<string, string>();
  for (const [key, value] of Object.entries(input)) {
    const match = /^personWorkCategories\[([^\]]+)\]$/.exec(key);
    if (match && typeof value === "string") {
      selectedCategoryByPersonId.set(match[1], value);
    }
  }
  const categoryByPersonId = new Map<string, NonNullable<Awaited<ReturnType<typeof WorkCategoryEntity.findById>>>>();
  for (const person of plannedAccess.plannedAccessPersons) {
    const workCategoryId = selectedCategoryByPersonId.get(person.id) ?? person.workCategoryId;
    if (!workCategoryId) {
      return { success: false, errors: `La persona ${person.firstNameSnapshot} no tiene tipo de trabajo.` };
    }
    const category = await WorkCategoryEntity.findById(workCategoryId);
    if (!category) return { success: false, errors: "Uno de los tipos de trabajo no existe." };
    categoryByPersonId.set(person.id, category);
  }

  for (const decision of decisions) {
    const person = personById.get(decision.plannedAccessPersonId);
    if (!person) return { success: false, errors: "Una de las personas no pertenece a la solicitud." };
    const requiresPersonPermit = Boolean(categoryByPersonId.get(person.id)?.requiresWorkPermit);
    if (decision.accessDecision === "PENDING" || decision.workDecision === "PENDING") {
      return { success: false, errors: `Debes completar la decisión de ${person.firstNameSnapshot}.` };
    }
    if (requiresPersonPermit && decision.workDecision === "NOT_REQUIRED") {
      return { success: false, errors: `El trabajo de ${person.firstNameSnapshot} requiere permiso.` };
    }
    if ((decision.accessDecision === "DENIED" || decision.workDecision === "DENIED") && !decision.decisionReason) {
      return { success: false, errors: `Indica el motivo de la decisión para ${person.firstNameSnapshot}.` };
    }
  }

  const requiresPermit = plannedAccess.plannedAccessPersons.some((person) =>
    Boolean(categoryByPersonId.get(person.id)?.requiresWorkPermit),
  );
  const existingActivity = (await WorkPermitEntity.findByPlannedAccessId(plannedAccess.id))[0] ?? null;
  let activity: Pick<WorkPermitActivity, "id" | "facilityRiskVersion"> | null = existingActivity
    ? { id: existingActivity.id, facilityRiskVersion: existingActivity.facilityRiskVersion }
    : null;

  if (requiresPermit) {
    const parsedActivity = await createWorkPermitActivitySchema.safeParseAsync(input);
    if (!parsedActivity.success) {
      return { success: false, errors: z.treeifyError(parsedActivity.error) };
    }

    const site = await SiteEntity.findById(plannedAccess.siteId);
    const company = plannedAccess.companyId
      ? await CompanyEntity.findById(plannedAccess.companyId)
      : null;
    if (!site?.riskInformation || !company) {
      return {
        success: false,
        errors: "El centro y la empresa deben estar configurados antes de aprobar el permiso.",
      };
    }

    if (!activity) {
      activity = await WorkPermitEntity.createActivity({
        plannedAccessId: plannedAccess.id,
        siteId: plannedAccess.siteId,
        companyId: company.id,
        companySnapshot: plannedAccess.companySnapshot,
        taskDescription: parsedActivity.data.taskDescription,
        workAreaSnapshot: parsedActivity.data.workAreaSnapshot,
        expectedStartDatetime: plannedAccess.expectedStartDatetime,
        expectedEndDatetime: plannedAccess.expectedEndDatetime ?? null,
        riskItems: parsedActivity.data.riskItems,
        toolsAndEquipment: parsedActivity.data.toolsAndEquipment,
        personalProtectiveEquipment: parsedActivity.data.personalProtectiveEquipment,
        checklist: {
          toolsAdequate: parsedActivity.data.toolsAdequate,
          procedureKnown: parsedActivity.data.procedureKnown,
          trainingProvided: parsedActivity.data.trainingProvided,
          areaOrderly: parsedActivity.data.areaOrderly,
          ppeAdequate: parsedActivity.data.ppeAdequate,
        },
        incidents: parsedActivity.data.incidents ?? null,
        facilityRiskSnapshot: site.riskInformation,
        facilityRiskVersion: site.riskInformationVersion,
        createdById: author.id,
      });
    }

    const existingPermits = await WorkPermitEntity.findByPlannedAccessId(plannedAccess.id);
    const existingPermitPersonIds = new Set(
      existingPermits.flatMap((item) => item.workPermits.map((permit) => permit.plannedAccessPersonId)),
    );
    for (const person of plannedAccess.plannedAccessPersons) {
      if (!categoryByPersonId.get(person.id)?.requiresWorkPermit || existingPermitPersonIds.has(person.id)) {
        continue;
      }
      await WorkPermitEntity.createPermit({
        activityId: activity.id,
        plannedAccessPersonId: person.id,
        externalWorkerId: person.externalWorkerId ?? null,
         firstNameSnapshot: [person.firstNameSnapshot, person.middleNameSnapshot]
           .filter(Boolean)
           .join(" "),
        lastNameSnapshot: [person.lastNameSnapshot, person.secondLastNameSnapshot]
          .filter(Boolean)
          .join(" "),
        legalIdSnapshot: person.legalIdSnapshot,
        workCategoryId: categoryByPersonId.get(person.id)!.id,
        workCategoryRiskSnapshot: categoryByPersonId.get(person.id)?.riskInformation ?? null,
        restrictions: decisions.find((decision) => decision.plannedAccessPersonId === person.id)?.restrictions ?? null,
        status: "DRAFT",
        createdById: author.id,
      });
    }
  }

  const categoryFields: Record<string, string> = {};
  const areaFields: Record<string, string> = {};
  for (const person of plannedAccess.plannedAccessPersons) {
    categoryFields[`personWorkCategories[${person.id}]`] = categoryByPersonId.get(person.id)?.id ?? "";
    areaFields[`personAllowedAreas[${person.id}]`] = person.allowedAreaId ?? "";
  }

  const accessResult = await updatePlannedAccessStatus(
    {
      id: plannedAccess.id,
      status: "APPROVED",
      ...categoryFields,
      ...areaFields,
    },
    { authorUsername: author.username, canApprove: true, lockedSiteId: options.lockedSiteId },
  );
  if (!accessResult.success) return accessResult;

  const permits = activity
    ? await WorkPermitEntity.findByPlannedAccessId(plannedAccess.id)
    : [];
  const permitByPersonId = new Map(
    permits.flatMap((item) => item.workPermits.map((permit) => [permit.plannedAccessPersonId, permit] as const)),
  );

  for (const decision of decisions) {
    const person = personById.get(decision.plannedAccessPersonId);
    if (!person) return { success: false, errors: "Una de las personas no pertenece a la solicitud." };
    const category = categoryByPersonId.get(person.id);
    const requiresPersonPermit = Boolean(category?.requiresWorkPermit);
    const permit = permitByPersonId.get(person.id);
    if (requiresPersonPermit && decision.workDecision === "APPROVED" && !permit) {
      return { success: false, errors: `No se pudo crear el permiso de ${person.firstNameSnapshot}.` };
    }
    await WorkPermitEntity.saveDecision({
      plannedAccessPersonId: person.id,
      workPermitId: permit?.id ?? null,
      accessDecision: decision.accessDecision,
      workDecision: requiresPersonPermit ? decision.workDecision : "NOT_REQUIRED",
      decisionReason: decision.decisionReason ?? null,
      decidedById: author.id,
      decidedAt: new Date(),
    });
    if (permit && activity) {
      await WorkPermitEntity.approvePermit(permit.id, author.id, {
        activityId: activity.id,
        personId: person.id,
        accessDecision: decision.accessDecision,
        workDecision: decision.workDecision,
        decisionReason: decision.decisionReason ?? null,
        facilityRiskVersion: activity.facilityRiskVersion,
      });
    }
  }

  await AuditLogEntity.create({
    entityType: "PlannedAccess",
    entityId: plannedAccess.id,
    action: "INDIVIDUAL_ACCESS_DECISIONS_RECORDED",
    changedBy: author.id,
    summary: "Decisiones individuales de acceso y trabajo registradas",
    metadata: { decisions },
  });

  return { success: true };
}

export async function signWorkPermit(
  input: Record<string, unknown>,
  options: WorkPermitOptions,
) {
  if (!getAppConfig().workPermitsEnabled) {
    return { success: false, errors: "El proceso de permisos de trabajo está desactivado." };
  }

  const parsed = workPermitSignatureSchema.safeParse(input);
  if (!parsed.success) return { success: false, errors: z.treeifyError(parsed.error) };
  const author = await UserEntity.getByUsername(options.authorUsername);
  if (!author) return { success: false, errors: "unauthorized" };

  const permit = await WorkPermitEntity.findById(parsed.data.workPermitId);
  if (!permit || permit.status !== "APPROVED") {
    return { success: false, errors: "El permiso de trabajo no está aprobado." };
  }
  if (options.lockedSiteId && permit.activity.siteId !== options.lockedSiteId) {
    return { success: false, errors: "El permiso no pertenece al centro actual." };
  }
  const decision = await WorkPermitEntity.findDecision(permit.plannedAccessPersonId);
  if (decision?.accessDecision === "DENIED") {
    return { success: false, errors: "El acceso de esta persona fue denegado." };
  }
  if (await WorkPermitEntity.hasSignature(permit.id, "WORKER")) {
    return { success: true };
  }

  await WorkPermitEntity.createSignature({
    workPermitId: permit.id,
    signerType: "WORKER",
    signerName: `${permit.firstNameSnapshot} ${permit.lastNameSnapshot}`,
    signerLegalId: permit.legalIdSnapshot,
    signatureEnvelope: await encryptValue(JSON.stringify(parsed.data.signaturePayload)),
    capturedById: author.id,
  });

  return { success: true };
}
