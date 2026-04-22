import z from "zod";
import { DEPARTMENT_ALREADY_EXISTS } from "./messages";
import { DepartmentEntity } from "../database/department.server";
import { requiredString } from "./generic";

export const createDepartmentSchema = z
  .object({
    name: requiredString,
    slug: requiredString.transform((str) => str.toUpperCase()),
  })
  .refine(
    async (data) => {
      const departmentExists = (await DepartmentEntity.findBySlug(data.slug)) !== null;

      return !departmentExists;
    },
    {
      error: DEPARTMENT_ALREADY_EXISTS,
      path: ["slug"],
    },
  );

export const updateDepartmentSchema = z
  .object({
    id: requiredString,
    name: requiredString,
    slug: requiredString,
  })
  .refine(
    async (data) => {
      const department = await DepartmentEntity.findById(data.id);

      if (!department) {
        return false;
      }

      const departmentWithSameSlug = await DepartmentEntity.findBySlug(
        data.slug,
        data.id,
      );

      return departmentWithSameSlug === null;
    },
    {
      error: DEPARTMENT_ALREADY_EXISTS,
      path: ["slug"],
    },
  );

export const deleteDepartmentSchema = z.object({
  id: requiredString,
});
