import z from "zod";
import { optionalString, requiredString } from "./generic";
import { WorkCategoryEntity } from "../database/work-category.server";
import { WORK_CATEGORY_DOESNT_EXISTS } from "./messages";

export const createWorkCategorySchema = z.object({
  name: requiredString,
  description: optionalString,
  requiresSpecialPermission: z.preprocess(
    (value) => value === "true" || value === "on",
    z.boolean(),
  ).optional().default(false),
  requiresTraining: z.preprocess(
    (value) => value === "true" || value === "on",
    z.boolean(),
  ).optional().default(false),
});

export const updateWorkCategorySchema = z
  .object({
    id: requiredString,
    name: requiredString,
    description: optionalString,
    requiresSpecialPermission: z.preprocess(
      (value) => value === "true" || value === "on",
      z.boolean(),
    ).optional().default(false),
    requiresTraining: z.preprocess(
      (value) => value === "true" || value === "on",
      z.boolean(),
    ).optional().default(false),
  })
  .refine(
    async (data) => {
      const category = await WorkCategoryEntity.findById(data.id);
      return category !== null;
    },
    {
      error: WORK_CATEGORY_DOESNT_EXISTS,
      path: ["id"],
    },
  );

export const deleteWorkCategorySchema = z.object({
  id: requiredString,
});
