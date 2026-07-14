import z from "zod";
import { ExternalWorkerEntity } from "../database/external-worker.server";
import {
  COMPANY_DOESNT_EXISTS,
  EXTERNAL_WORKER_ALREADY_EXISTS,
  WORK_CATEGORY_DOESNT_EXISTS,
} from "./messages";
import { optionalString, requiredString } from "./generic";
import { CompanyEntity } from "../database/company.server";
import { WorkCategoryEntity } from "../database/work-category.server";

export const createExternalWorkerSchema = z
  .object({
    firstName: requiredString,
    middleName: optionalString,
    lastName: requiredString,
    secondLastName: optionalString,
    phoneNumber: optionalString,
    legalId: requiredString.transform((s) => s.toUpperCase()),
    companyId: requiredString,
    workCategoryId: requiredString,
  })
  .refine(
    async (data) => {
      const existing = await ExternalWorkerEntity.findByLegalId(data.legalId);
      return existing === null;
    },
    {
      error: EXTERNAL_WORKER_ALREADY_EXISTS,
      path: ["legalId"],
    },
  )
  .refine(
    async (data) => {
      const company = await CompanyEntity.findById(data.companyId);
      return company !== null;
    },
    {
      error: COMPANY_DOESNT_EXISTS,
      path: ["companyId"],
    },
  )
  .refine(
    async (data) => {
      const category = await WorkCategoryEntity.findById(data.workCategoryId);
      return category !== null;
    },
    {
      error: WORK_CATEGORY_DOESNT_EXISTS,
      path: ["workCategoryId"],
    },
  );

export const updateExternalWorkerSchema = z
  .object({
    id: requiredString,
    firstName: requiredString,
    middleName: optionalString,
    lastName: requiredString,
    secondLastName: optionalString,
    phoneNumber: optionalString,
    legalId: requiredString.transform((s) => s.toUpperCase()),
    companyId: requiredString,
    workCategoryId: requiredString,
  })
  .refine(
    async (data) => {
      const existing = await ExternalWorkerEntity.findByLegalIdExcluding(
        data.legalId,
        data.id,
      );
      return existing === null;
    },
    {
      error: EXTERNAL_WORKER_ALREADY_EXISTS,
      path: ["legalId"],
    },
  )
  .refine(
    async (data) => {
      const company = await CompanyEntity.findById(data.companyId);
      return company !== null;
    },
    {
      error: COMPANY_DOESNT_EXISTS,
      path: ["companyId"],
    },
  )
  .refine(
    async (data) => {
      const category = await WorkCategoryEntity.findById(data.workCategoryId);
      return category !== null;
    },
    {
      error: WORK_CATEGORY_DOESNT_EXISTS,
      path: ["workCategoryId"],
    },
  );

export const deleteExternalWorkerSchema = z.object({
  id: requiredString,
});

export const searchExternalWorkerSchema = z.object({
  q: requiredString,
});
