import z from "zod";
import { SITE_ALREADY_EXISTS } from "./messages";
import { getSiteById, getSiteBySlug } from "../database/site.server";
import { optionalString, requiredString } from "./generic";

export const createSiteSchema = z
  .object({
    name: requiredString,
    slug: requiredString.transform((str) => str.toUpperCase()),
    address: optionalString,
  })
  .refine(
    async (data) => {
      const siteExists = (await getSiteBySlug(data.slug)) !== null;

      return !siteExists;
    },
    {
      error: SITE_ALREADY_EXISTS,
      path: ["slug"],
    },
  );

export const updateSiteSchema = z
  .object({
    id: requiredString,
    name: requiredString,
    slug: requiredString,
    address: optionalString,
  })
  .refine(
    async (data) => {
      const site = await getSiteById(data.id);

      if (!site) {
        return false;
      }

      const siteWithSameSlug = await getSiteBySlug(data.slug, data.id);

      return siteWithSameSlug === null;
    },
    {
      error: SITE_ALREADY_EXISTS,
      path: ["slug"],
    },
  );

export const deleteSiteSchema = z.object({
  id: requiredString,
});
