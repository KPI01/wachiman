import z from "zod";
import { CompanyEntity } from "../database/company.server";
import { createCompanySchema, deleteCompanySchema, updateCompanySchema } from "../schemas/company";

export async function getManyCompanies() {
  return CompanyEntity.findMany();
}

export async function searchCompanies(query: string) {
  return CompanyEntity.searchByName(query);
}

export async function resolvePlannedAccessCompany(name: string, companyId?: string) {
  if (companyId) {
    const company = await CompanyEntity.findById(companyId);
    if (!company) throw new Error("La empresa seleccionada ya no existe.");
    return { companyId: company.id, companySnapshot: company.name };
  }
  const matches = await CompanyEntity.findNameMatches(name);
  const company = matches.length === 1 ? matches[0] : null;
  return { companyId: company?.id ?? null, companySnapshot: company?.name ?? name.trim() };
}

export async function createCompany(input: Record<string, unknown>) {
  const parsed = await createCompanySchema.safeParseAsync(input);
  if (!parsed.success) {
    return { success: false, errors: z.treeifyError(parsed.error) };
  }

  await CompanyEntity.create(parsed.data);
  return { success: true };
}

export async function updateCompany(input: Record<string, unknown>) {
  const parsed = await updateCompanySchema.safeParseAsync(input);
  if (!parsed.success) {
    return { success: false, errors: z.treeifyError(parsed.error) };
  }

  const { id, ...data } = parsed.data;
  await CompanyEntity.update(id, data);
  return { success: true };
}

export async function deleteCompany(input: Record<string, unknown>) {
  const parsed = await deleteCompanySchema.safeParseAsync(input);
  if (!parsed.success) {
    return { success: false, errors: z.treeifyError(parsed.error) };
  }

  await CompanyEntity.delete(parsed.data.id);
  return { success: true };
}
