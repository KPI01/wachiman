import z from "zod";
import { SiteEntity } from "../database/site.server";
import { AllowedAreaEntity } from "../database/allowed-area.server";
import { WorkCategoryEntity } from "../database/work-category.server";
import { ExternalWorkerEntity } from "../database/external-worker.server";
import { CompanyEntity } from "../database/company.server";
import { optionalString, requiredString } from "./generic";
import {
  SITE_DOESNT_EXISTS,
  WORK_CATEGORY_DOESNT_EXISTS,
} from "./messages";
import { signaturePayloadFromStringSchema } from "./access-log";

const optionalDate = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmedValue = value.trim();

  return trimmedValue.length ? trimmedValue : undefined;
}, z.coerce.date().optional());

const plannedAccessPersonSchema = z.object({
  id: optionalString,
  firstNameSnapshot: requiredString,
  middleNameSnapshot: optionalString,
  lastNameSnapshot: requiredString,
  secondLastNameSnapshot: optionalString,
  phoneNumber: optionalString,
  legalIdSnapshot: requiredString.transform((value) => value.toUpperCase()),
  externalWorkerId: optionalString,
  workCategoryId: optionalString,
  allowedAreaSnapshot: requiredString,
  allowedAreaId: optionalString,
});

async function validatePersonCatalogs(
  persons: Array<{ workCategoryId?: string; allowedAreaId?: string }>,
  siteId: string,
) {
  const results = await Promise.all(
    persons.flatMap((person) => [
      person.workCategoryId ? WorkCategoryEntity.findById(person.workCategoryId) : null,
      person.allowedAreaId ? AllowedAreaEntity.findById(person.allowedAreaId).then((area) => area?.siteId === siteId) : null,
    ]).filter((result) => result !== null),
  );
  return results.every(Boolean);
}

export const createPlannedAccessSchema = z
  .object({
    expectedStartDatetime: z.coerce.date(),
    expectedEndDatetime: optionalDate,
    companySnapshot: requiredString,
    companyId: optionalString,
    visitReason: requiredString,
    siteId: requiredString,
    persons: z
      .array(plannedAccessPersonSchema)
      .min(1, "Debe agregar al menos un visitante."),
  })
  .refine(async (data) => (await SiteEntity.findById(data.siteId)) !== null, {
    error: SITE_DOESNT_EXISTS,
    path: ["siteId"],
  })
  .refine(async (data) => !data.companyId || (await CompanyEntity.findById(data.companyId)) !== null, {
    error: "La empresa contratista seleccionada no existe.",
    path: ["companyId"],
  })
  .refine(async (data) => validatePersonCatalogs(data.persons, data.siteId), {
    error: `${WORK_CATEGORY_DOESNT_EXISTS} El área autorizada debe pertenecer al centro de la solicitud.`,
    path: ["persons"],
  })
  .refine(
    async (data) =>
      (
        await Promise.all(
          data.persons
            .map((person) => person.externalWorkerId)
            .filter((id): id is string => Boolean(id))
            .map((id) => ExternalWorkerEntity.findById(id)),
        )
      ).every(Boolean),
    {
      error: "Uno de los trabajadores externos seleccionados ya no existe.",
      path: ["persons"],
    },
  )
  .superRefine((data, context) => {
    if (
      data.expectedEndDatetime &&
      data.expectedEndDatetime < data.expectedStartDatetime
    ) {
      context.addIssue({
        code: "custom",
        message: "La fecha de fin debe ser posterior a la fecha de inicio.",
        path: ["expectedEndDatetime"],
      });
    }

    const seenLegalIds = new Set<string>();
    data.persons.forEach((person, index) => {
      if (seenLegalIds.has(person.legalIdSnapshot)) {
        context.addIssue({
          code: "custom",
          message: "Esta persona ya fue agregada a la solicitud.",
          path: ["persons", index, "legalIdSnapshot"],
        });
      }
      seenLegalIds.add(person.legalIdSnapshot);
    });
  });

export const updatePlannedAccessSchema = z
  .object({
    id: requiredString,
    expectedUpdatedAt: z.coerce.date(),
    expectedStartDatetime: z.coerce.date(),
    expectedEndDatetime: optionalDate,
    companySnapshot: requiredString,
    companyId: optionalString,
    visitReason: requiredString,
    siteId: requiredString,
    persons: z
      .array(plannedAccessPersonSchema)
      .min(1, "Debe agregar al menos un visitante."),
  })
  .refine(async (data) => (await SiteEntity.findById(data.siteId)) !== null, {
    error: SITE_DOESNT_EXISTS,
    path: ["siteId"],
  })
  .refine(async (data) => !data.companyId || (await CompanyEntity.findById(data.companyId)) !== null, {
    error: "La empresa contratista seleccionada no existe.",
    path: ["companyId"],
  })
  .refine(async (data) => validatePersonCatalogs(data.persons, data.siteId), {
    error: `${WORK_CATEGORY_DOESNT_EXISTS} El área autorizada debe pertenecer al centro de la solicitud.`,
    path: ["persons"],
  })
  .superRefine((data, context) => {
    if (
      data.expectedEndDatetime &&
      data.expectedEndDatetime < data.expectedStartDatetime
    ) {
      context.addIssue({
        code: "custom",
        message: "La fecha de fin debe ser posterior a la fecha de inicio.",
        path: ["expectedEndDatetime"],
      });
    }

    const seenLegalIds = new Set<string>();
    data.persons.forEach((person, index) => {
      if (seenLegalIds.has(person.legalIdSnapshot)) {
        context.addIssue({
          code: "custom",
          message: "Esta persona ya fue agregada a la solicitud.",
          path: ["persons", index, "legalIdSnapshot"],
        });
      }
      seenLegalIds.add(person.legalIdSnapshot);
    });
  });

export const updatePlannedAccessStatusSchema = z
  .object({
    id: requiredString,
    status: z.enum(["APPROVED", "REJECTED", "CANCELED"]),
    decisionReason: optionalString,
    personWorkCategories: z.record(z.string(), z.string().nullable()).optional(),
    personAllowedAreas: z.record(z.string(), z.string().nullable()).optional(),
  })
  .superRefine((value, context) => {
    if (value.status !== "APPROVED" && !value.decisionReason) {
      context.addIssue({
        code: "custom",
        path: ["decisionReason"],
        message: "Indica el motivo de la decisión.",
      });
    }
  });

export const createAccessLogFromPlannedAccessSchema = z.object({
  plannedAccessId: requiredString,
  plannedAccessPersonId: requiredString,
  entrySignaturePayload: signaturePayloadFromStringSchema,
  riskInformationAcknowledged: z.preprocess(
    (value) => value === "true" || value === "on",
    z.literal(true, { error: "Debes confirmar que has sido informado de los riesgos." }),
  ),
});
