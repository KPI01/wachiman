import z from "zod";
import { CompanyEntity } from "../database/company.server";
import { COMPANY_ALREADY_EXISTS } from "./messages";
import { optionalString, requiredString } from "./generic";

export const createCompanySchema = z
  .object({
    name: requiredString,
    slug: requiredString.transform((str) => str.toUpperCase()),
    cif: optionalString,
    address: optionalString,
    phone: optionalString,
    email: optionalString,
  })
  .refine(
    async (data) => {
      const exists = (await CompanyEntity.findBySlug(data.slug)) !== null;
      return !exists;
    },
    {
      error: COMPANY_ALREADY_EXISTS,
      path: ["slug"],
    },
  );

export const updateCompanySchema = z
  .object({
    id: requiredString,
    name: requiredString,
    slug: requiredString,
    cif: optionalString,
    address: optionalString,
    phone: optionalString,
    email: optionalString,
  })
  .refine(
    async (data) => {
      const company = await CompanyEntity.findById(data.id);
      if (!company) return false;

      const duplicate = await CompanyEntity.findBySlug(data.slug, data.id);
      return duplicate === null;
    },
    {
      error: COMPANY_ALREADY_EXISTS,
      path: ["slug"],
    },
  );

export const deleteCompanySchema = z.object({
  id: requiredString,
});
