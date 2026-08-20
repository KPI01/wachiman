import z from "zod";
import { AllowedAreaEntity } from "../database/allowed-area.server";
import { requiredString } from "./generic";
import { ALLOWED_AREA_DOESNT_EXISTS } from "./messages";

export const createAllowedAreaSchema = z.object({
  name: requiredString,
});

export const updateAllowedAreaSchema = z
  .object({
    id: requiredString,
    name: requiredString,
  })
  .refine(async (data) => (await AllowedAreaEntity.findById(data.id)) !== null, {
    error: ALLOWED_AREA_DOESNT_EXISTS,
    path: ["id"],
  });

export const deleteAllowedAreaSchema = z.object({
  id: requiredString,
});
