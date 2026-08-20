import z from "zod";
import { SiteEntity } from "../database/site.server";
import { AllowedAreaEntity } from "../database/allowed-area.server";
import { WorkCategoryEntity } from "../database/work-category.server";
import { optionalString, requiredString } from "./generic";
import { ALLOWED_AREA_DOESNT_EXISTS, SITE_DOESNT_EXISTS, WORK_CATEGORY_DOESNT_EXISTS } from "./messages";
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
  workCategoryId: requiredString,
  allowedAreaId: requiredString,
});

async function validatePersonCatalogs(
  persons: Array<{ workCategoryId: string; allowedAreaId: string }>,
) {
  const results = await Promise.all(
    persons.flatMap((person) => [
      WorkCategoryEntity.findById(person.workCategoryId),
      AllowedAreaEntity.findById(person.allowedAreaId),
    ]),
  );
  return results.every(Boolean);
}

export const createPlannedAccessSchema = z
  .object({
    expectedStartDatetime: z.coerce.date(),
    expectedEndDatetime: optionalDate,
    companySnapshot: requiredString,
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
  .refine(async (data) => validatePersonCatalogs(data.persons), {
    error: `${WORK_CATEGORY_DOESNT_EXISTS} ${ALLOWED_AREA_DOESNT_EXISTS}`,
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

export const updatePlannedAccessSchema = z
  .object({
    id: requiredString,
    expectedUpdatedAt: z.coerce.date(),
    expectedStartDatetime: z.coerce.date(),
    expectedEndDatetime: optionalDate,
    companySnapshot: requiredString,
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
  .refine(async (data) => validatePersonCatalogs(data.persons), {
    error: `${WORK_CATEGORY_DOESNT_EXISTS} ${ALLOWED_AREA_DOESNT_EXISTS}`,
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
});
