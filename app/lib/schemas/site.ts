import z from "zod";
import {
  SITE_ALREADY_EXISTS,
  STRING_REQUIRED_MSG,
  STRING_TYPE_REQUIRED_MSG,
} from "./messages";
import { getSiteById, getSiteBySlug } from "../database/site";

const requiredString = z
  .string(STRING_TYPE_REQUIRED_MSG)
  .trim()
  .min(1, STRING_REQUIRED_MSG);

const optionalString = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmedValue = value.trim();

  return trimmedValue.length ? trimmedValue : undefined;
}, z.string(STRING_TYPE_REQUIRED_MSG).optional());

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
