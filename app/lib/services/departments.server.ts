import z from "zod";
import { DepartmentEntity } from "../database/department.server";
import {
  createDepartmentSchema,
  deleteDepartmentSchema,
  updateDepartmentSchema,
} from "../schemas/department";

export async function getManyDepartments() {
  return await DepartmentEntity.findAll()
}

export async function createDepartment(input: Record<string, unknown>) {
  const parsed = await createDepartmentSchema.safeParseAsync(input);

  if (!parsed.success) {
    return { success: false, errors: z.treeifyError(parsed.error) };
  }

  const department = await DepartmentEntity.create(parsed.data);

  if (!department) {
    return { success: false };
  }

  return { success: true };
}

export async function updateDepartment(input: Record<string, unknown>) {
  const parsed = await updateDepartmentSchema.safeParseAsync(input);

  if (!parsed.success) {
    return { success: false, errors: z.treeifyError(parsed.error) };
  }

  const { id, ...data } = parsed.data;
  const department = await DepartmentEntity.update(id, data);

  if (!department) {
    return { success: false };
  }

  return { success: true };
}

export async function deleteDepartment(input: Record<string, unknown>) {
  const parsed = await deleteDepartmentSchema.safeParseAsync(input);

  if (!parsed.success) {
    return { success: false, errors: z.treeifyError(parsed.error) };
  }

  const department = await DepartmentEntity.delete(parsed.data.id);

  if (!department) {
    return { success: false };
  }

  return { success: true };
}
