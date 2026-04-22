import z from "zod";
import { SiteEntity } from "../database/site.server";
import { optionalString, requiredString } from "./generic";
import { SITE_DOESNT_EXISTS } from "./messages";

const signaturePayloadSchema = z.object({
  strokes: z
    .array(z.array(z.tuple([z.number(), z.number()])).min(1))
    .min(1, "La firma es obligatoria."),
});

const signaturePayloadFromStringSchema = requiredString
  .transform((value, context) => {
    try {
      return JSON.parse(value);
    } catch {
      context.addIssue({
        code: "custom",
        message: "La firma es obligatoria.",
      });

      return z.NEVER;
    }
  })
  .pipe(signaturePayloadSchema);

export type SignaturePayload = z.infer<typeof signaturePayloadSchema>;

export const createAccessLogSchema = z
  .object({
    entryTimestamp: z.coerce.date(),
    entrySignaturePayload: signaturePayloadFromStringSchema,
    companyNameSnapshot: requiredString,
    firstNameSnapshot: requiredString,
    middleNameSnapshot: optionalString,
    lastNameSnapshot: requiredString,
    secondLastNameSnapshot: optionalString,
    phoneNumber: optionalString,
    legalIdSnapshot: requiredString.transform((s) => s.toUpperCase()),
    visitReason: requiredString,
    siteId: requiredString,
    withVehicle: z.preprocess(
      (value) => value === "true" || value === "on",
      z.boolean(),
    ),
    vehicleTypeSnapshot: optionalString,
    vehicleBrandSnapshot: optionalString,
    vehicleModelSnapshot: optionalString,
    vehiclePlateSnapshot: optionalString,
  })
  .refine(async (data) => (await SiteEntity.findById(data.siteId)) !== null, {
    error: SITE_DOESNT_EXISTS,
    path: ["siteId"],
  })
  .superRefine((data, context) => {
    if (!data.withVehicle) {
      return;
    }

    if (!data.vehicleTypeSnapshot) {
      context.addIssue({
        code: "custom",
        message: "El tipo de vehiculo es obligatorio.",
        path: ["vehicleTypeSnapshot"],
      });
    }

    if (!data.vehiclePlateSnapshot) {
      context.addIssue({
        code: "custom",
        message: "La placa del vehiculo es obligatoria.",
        path: ["vehiclePlateSnapshot"],
      });
    }
  });

export const markAccessLogExitSchema = z.object({
  exitSignaturePayload: signaturePayloadFromStringSchema,
});
