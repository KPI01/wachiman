import z from "zod";
import { optionalString, requiredString } from "./generic";
import { UserEntity } from "../database/user.server";
import { USER_DOESNT_EXISTS } from "./messages";
import { PlannedAccessStatus } from "../../../prisma/generated/prisma/enums";

export const plannedAccessPersonSchema = z.object({
  firstNameSnapshot: requiredString,
  middleNameSnapshot: optionalString,
  lastNameSnapshot: requiredString,
  secondLastNameSnapshot: optionalString,
  legalIdSnapshot: requiredString.transform((s) => s.toUpperCase()),
});

export const plannedAccessVehicleSchema = z.object({
  typeSnapshot: requiredString,
  brandSnapshot: optionalString,
  modelSnapshot: optionalString,
  plateSnapshot: requiredString.transform((s) => s.toUpperCase()),
});

export const createPlannedAccessSchema = z.object({
  expectedStartDate: requiredString.transform((str) => new Date(str)),
  expectedEndDate: z.preprocess((value) => {
    if (typeof value !== "string" || !value.trim()) return undefined;
    return new Date(value);
  }, z.date().optional()),
  persons: z
    .array(plannedAccessPersonSchema)
    .min(1, "Debe haber al menos una persona"),
  vehicles: z.array(plannedAccessVehicleSchema).optional().default([]),
});

export const updatePlannedAccessSchema = z
  .object({
    id: requiredString,
    expectedStartDate: requiredString.transform((str) => new Date(str)),
    expectedEndDate: z.preprocess((value) => {
      if (typeof value !== "string" || !value.trim()) return undefined;
      return new Date(value);
    }, z.date().optional()),
    status: z.enum(PlannedAccessStatus),
    approvedById: requiredString,
  })
  .refine(
    async (data) => (await UserEntity.getById(data.approvedById)) !== null,
    {
      error: USER_DOESNT_EXISTS,
      path: ["approvedById"],
    },
  );
