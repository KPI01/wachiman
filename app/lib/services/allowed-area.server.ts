import z from "zod";
import { AllowedAreaEntity } from "../database/allowed-area.server";
import { SiteEntity } from "../database/site.server";
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

export function getManyAllowedAreas(siteId?: string) {
  return AllowedAreaEntity.findMany(siteId);
}

export function searchAllowedAreas(query: string, siteId: string) {
  return query.trim().length < 2 ? Promise.resolve([]) : AllowedAreaEntity.search(query.trim(), siteId);
}

function fieldError(field: string, message: string) {
  return { success: false, errors: { errors: [], properties: { [field]: { errors: [message] } } } };
}

function isUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const value = error as { code?: string; cause?: unknown };
  return value.code === "23505" || isUniqueViolation(value.cause);
}

export async function createAllowedArea(input: Record<string, unknown>, lockedSiteId?: string) {
  const parsed = await createAllowedAreaSchema.safeParseAsync(input);
  if (!parsed.success) {
    return { success: false, errors: z.treeifyError(parsed.error) };
  }

  const name = parsed.data.name.trim();
  const { siteId } = parsed.data;
  if (lockedSiteId && siteId !== lockedSiteId) return fieldError("siteId", "Solo puedes gestionar áreas de tu centro.");
  if (!await SiteEntity.findById(siteId)) return fieldError("siteId", "El centro seleccionado no existe.");
  if (await AllowedAreaEntity.findBySlug(siteId, slugify(name))) {
    return fieldError("name", "Ya existe un área con este nombre en el centro.");
  }
  try {
    await AllowedAreaEntity.create({ name, siteId, slug: slugify(name) });
  } catch (error) {
    if (isUniqueViolation(error)) return fieldError("name", "Ya existe un área con este nombre en el centro.");
    throw error;
  }
  return { success: true };
}

export async function updateAllowedArea(input: Record<string, unknown>, lockedSiteId?: string) {
  const parsed = await updateAllowedAreaSchema.safeParseAsync(input);
  if (!parsed.success) {
    return { success: false, errors: z.treeifyError(parsed.error) };
  }

  const name = parsed.data.name.trim();
  const area = await AllowedAreaEntity.findById(parsed.data.id);
  if (!area) return fieldError("id", "El área autorizada no existe.");
  if (lockedSiteId && area.siteId !== lockedSiteId) return fieldError("id", "Solo puedes gestionar áreas de tu centro.");
  if (await AllowedAreaEntity.findBySlug(area.siteId, slugify(name), area.id)) {
    return fieldError("name", "Ya existe un área con este nombre en el centro.");
  }
  try {
    await AllowedAreaEntity.update(area.id, { name, slug: slugify(name) });
  } catch (error) {
    if (isUniqueViolation(error)) return fieldError("name", "Ya existe un área con este nombre en el centro.");
    throw error;
  }
  return { success: true };
}

export async function deleteAllowedArea(input: Record<string, unknown>, lockedSiteId?: string) {
  const parsed = await deleteAllowedAreaSchema.safeParseAsync(input);
  if (!parsed.success) {
    return { success: false, errors: z.treeifyError(parsed.error) };
  }

  const area = await AllowedAreaEntity.findById(parsed.data.id);
  if (!area) return fieldError("id", "El área autorizada no existe.");
  if (lockedSiteId && area.siteId !== lockedSiteId) return fieldError("id", "Solo puedes gestionar áreas de tu centro.");
  await AllowedAreaEntity.delete(area.id);
  return { success: true };
}
