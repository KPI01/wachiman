import z from "zod";
import { WorkCategoryEntity } from "../database/work-category.server";
import { createWorkCategorySchema, deleteWorkCategorySchema, updateWorkCategorySchema } from "../schemas/work-category";

export async function getManyWorkCategories() {
  return WorkCategoryEntity.findMany();
}

export async function createWorkCategory(input: Record<string, unknown>) {
  const parsed = await createWorkCategorySchema.safeParseAsync(input);
  if (!parsed.success) {
    return { success: false, errors: z.treeifyError(parsed.error) };
  }

  await WorkCategoryEntity.create(parsed.data);
  return { success: true };
}

export async function updateWorkCategory(input: Record<string, unknown>) {
  const parsed = await updateWorkCategorySchema.safeParseAsync(input);
  if (!parsed.success) {
    return { success: false, errors: z.treeifyError(parsed.error) };
  }

  const { id, ...data } = parsed.data;
  await WorkCategoryEntity.update(id, data);
  return { success: true };
}

export async function deleteWorkCategory(input: Record<string, unknown>) {
  const parsed = await deleteWorkCategorySchema.safeParseAsync(input);
  if (!parsed.success) {
    return { success: false, errors: z.treeifyError(parsed.error) };
  }

  await WorkCategoryEntity.delete(parsed.data.id);
  return { success: true };
}
