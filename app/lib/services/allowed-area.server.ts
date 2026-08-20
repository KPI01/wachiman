import z from "zod";
import { AllowedAreaEntity } from "../database/allowed-area.server";
import {
  createAllowedAreaSchema,
  deleteAllowedAreaSchema,
  updateAllowedAreaSchema,
} from "../schemas/allowed-area";

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toUpperCase();
}

export function getManyAllowedAreas() {
  return AllowedAreaEntity.findMany();
}

export async function createAllowedArea(input: Record<string, unknown>) {
  const parsed = await createAllowedAreaSchema.safeParseAsync(input);
  if (!parsed.success) {
    return { success: false, errors: z.treeifyError(parsed.error) };
  }

  const name = parsed.data.name.trim();
  await AllowedAreaEntity.create({ name, slug: slugify(name) });
  return { success: true };
}

export async function updateAllowedArea(input: Record<string, unknown>) {
  const parsed = await updateAllowedAreaSchema.safeParseAsync(input);
  if (!parsed.success) {
    return { success: false, errors: z.treeifyError(parsed.error) };
  }

  const name = parsed.data.name.trim();
  await AllowedAreaEntity.update(parsed.data.id, {
    name,
    slug: slugify(name),
  });
  return { success: true };
}

export async function deleteAllowedArea(input: Record<string, unknown>) {
  const parsed = await deleteAllowedAreaSchema.safeParseAsync(input);
  if (!parsed.success) {
    return { success: false, errors: z.treeifyError(parsed.error) };
  }

  await AllowedAreaEntity.delete(parsed.data.id);
  return { success: true };
}
