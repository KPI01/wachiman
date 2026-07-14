import z from "zod";
import { CompanyEntity } from "../database/company.server";
import { createCompanySchema, deleteCompanySchema, updateCompanySchema } from "../schemas/company";

export async function getManyCompanies() {
  return CompanyEntity.findMany();
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
