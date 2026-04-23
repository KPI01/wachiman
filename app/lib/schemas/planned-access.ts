import z from "zod";
import { requiredString } from "./generic";
import { UserEntity } from "../database/user.server";
import { USER_DOESNT_EXISTS } from "./messages";
import { PlannedAccessStatus } from "../../../prisma/generated/prisma/enums";

export const createPlannedAccessSchema = z
  .object({
    expectedStartDate: requiredString.transform((str) => new Date(str)),
    expectedEndDate: z.preprocess((value) => {
      if (typeof value !== "string" || !value.trim()) return undefined;
      return new Date(value);
    }, z.date().optional()),
    approvedById: requiredString,
  })
  .refine(
    async (data) => (await UserEntity.getById(data.approvedById)) !== null,
    {
      error: USER_DOESNT_EXISTS,
      path: ["approvedById"],
    },
  );

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
