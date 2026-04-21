import z from "zod";
import { DEPARTMENT_ALREADY_EXISTS } from "./messages";
import { getDepartmentById, getDepartmentBySlug } from "../database/department.server";
import { requiredString } from "./generic";

export const createDepartmentSchema = z
  .object({
    name: requiredString,
    slug: requiredString.transform((str) => str.toUpperCase()),
  })
  .refine(
    async (data) => {
      const departmentExists = (await getDepartmentBySlug(data.slug)) !== null;

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
      const department = await getDepartmentById(data.id);

      if (!department) {
        return false;
      }

      const departmentWithSameSlug = await getDepartmentBySlug(
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
