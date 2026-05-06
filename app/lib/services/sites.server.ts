import z from "zod";
import { SiteEntity } from "../database/site.server";
import {
  createSiteSchema,
  deleteSiteSchema,
  updateSiteSchema,
} from "../schemas/site";

export async function getManySites() {
  return await SiteEntity.findMany()
}

export async function createSite(input: Record<string, unknown>) {
  const parsed = await createSiteSchema.safeParseAsync(input);

  if (!parsed.success) {
    return { success: false, errors: z.treeifyError(parsed.error) };
  }

  const site = await SiteEntity.create(parsed.data);

  if (!site) {
    return { success: false };
  }

  return { success: true };
}

export async function updateSite(input: Record<string, unknown>) {
  const parsed = await updateSiteSchema.safeParseAsync(input);

  if (!parsed.success) {
    return { success: false, errors: z.treeifyError(parsed.error) };
  }

  const { id, ...data } = parsed.data;
  const site = await SiteEntity.update(id, data);

  if (!site) {
    return { success: false };
  }

  return { success: true };
}

export async function deleteSite(input: Record<string, unknown>) {
  const parsed = await deleteSiteSchema.safeParseAsync(input);

  if (!parsed.success) {
    return { success: false, errors: z.treeifyError(parsed.error) };
  }

  const site = await SiteEntity.delete(parsed.data.id);

  if (!site) {
    return { success: false };
  }

  return { success: true };
}
