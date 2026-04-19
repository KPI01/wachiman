import z from "zod";
import { getSiteById } from "../database/site";
import { optionalString, requiredString } from "./generic";
import { SITE_DOESNT_EXISTS } from "./messages";

export const createAccessLogSchema = z
  .object({
    entryTimestamp: z.coerce.date(),
    companyNameSnapshot: requiredString,
    firstNameSnapshot: requiredString,
    middleNameSnapshot: optionalString,
    lastNameSnapshot: requiredString,
    secondLastNameSnapshot: optionalString,
    phoneNumber: optionalString,
    legalIdSnapshot: requiredString,
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
  .refine(async (data) => (await getSiteById(data.siteId)) !== null, {
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
  accessLogId: requiredString,
});
