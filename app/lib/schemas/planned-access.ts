import z from "zod";
import { SiteEntity } from "../database/site.server";
import { optionalString, requiredString } from "./generic";
import { SITE_DOESNT_EXISTS } from "./messages";
import { signaturePayloadFromStringSchema } from "./access-log";

const optionalDate = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmedValue = value.trim();

  return trimmedValue.length ? trimmedValue : undefined;
}, z.coerce.date().optional());

const plannedAccessPersonSchema = z.object({
  firstNameSnapshot: requiredString,
  middleNameSnapshot: optionalString,
  lastNameSnapshot: requiredString,
  secondLastNameSnapshot: optionalString,
  phoneNumber: optionalString,
  legalIdSnapshot: requiredString.transform((value) => value.toUpperCase()),
});

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

export const updatePlannedAccessStatusSchema = z.object({
  id: requiredString,
  status: z.enum(["APPROVED", "REJECTED", "CANCELED"]),
});

export const createAccessLogFromPlannedAccessSchema = z.object({
  plannedAccessId: requiredString,
  plannedAccessPersonId: requiredString,
  entrySignaturePayload: signaturePayloadFromStringSchema,
});
