import z from "zod";
import { PlannedAccessEntity } from "../database/planned-access.server";
import type {
  CreatePlannedAccessInput,
  CreatePlannedAccessPerson,
  CreatePlannedAccessVehicle,
} from "../database/planned-access.server";
import {
  createPlannedAccessSchema,
  updatePlannedAccessSchema,
} from "../schemas/planned-access";

function parseFormDataArrays<T extends Record<string, string>>(
  formData: FormData,
  prefix: string,
  fields: string[],
): T[] {
  const items: T[] = [];
  let i = 0;
  while (formData.has(`${prefix}[${i}][${fields[0]}]`)) {
    const item = {} as Record<string, string>;
    for (const field of fields) {
      const value = formData.get(`${prefix}[${i}][${field}]`);
      item[field] = typeof value === "string" ? value : "";
    }
    items.push(item as T);
    i++;
  }
  return items;
}

export async function getManyPlannedAccesses() {
  return await PlannedAccessEntity.findMany();
}

export async function createPlannedAccess(formData: FormData) {
  const rawPersons = parseFormDataArrays<Record<string, string>>(
    formData,
    "persons",
    [
      "firstNameSnapshot",
      "middleNameSnapshot",
      "lastNameSnapshot",
      "secondLastNameSnapshot",
      "legalIdSnapshot",
    ],
  );

  const rawVehicles = parseFormDataArrays<Record<string, string>>(
    formData,
    "vehicles",
    [
      "typeSnapshot",
      "brandSnapshot",
      "modelSnapshot",
      "plateSnapshot",
    ],
  );

  const persons: CreatePlannedAccessPerson[] = rawPersons.map((p) => ({
    firstNameSnapshot: p.firstNameSnapshot,
    middleNameSnapshot: p.middleNameSnapshot || undefined,
    lastNameSnapshot: p.lastNameSnapshot,
    secondLastNameSnapshot: p.secondLastNameSnapshot || undefined,
    legalIdSnapshot: p.legalIdSnapshot,
  }));

  const vehicles: CreatePlannedAccessVehicle[] = rawVehicles.map((v) => ({
    typeSnapshot: v.typeSnapshot,
    brandSnapshot: v.brandSnapshot || undefined,
    modelSnapshot: v.modelSnapshot || undefined,
    plateSnapshot: v.plateSnapshot,
  }));

  const expectedStartDate = formData.get("expectedStartDate");
  const expectedEndDate = formData.get("expectedEndDate");

  const jsonData: Omit<CreatePlannedAccessInput, "approvedById"> = {
    expectedStartDate:
      typeof expectedStartDate === "string"
        ? new Date(expectedStartDate)
        : new Date(),
    expectedEndDate:
      typeof expectedEndDate === "string" && expectedEndDate.trim()
        ? new Date(expectedEndDate)
        : undefined,
    persons,
    vehicles,
  };

  const { error, data, success } =
    await createPlannedAccessSchema.safeParseAsync(jsonData);

  if (error) {
    return { errors: z.treeifyError(error) };
  }

  await PlannedAccessEntity.create(data);

  return { success };
}

export async function updatePlannedAccess(formData: FormData) {
  const jsonData = Object.fromEntries(formData);

  const { success, error, data } =
    await updatePlannedAccessSchema.safeParseAsync(jsonData);

  if (!success) {
    return { errors: z.treeifyError(error) };
  }

  const { id, ...dataWithoutId } = data;

  await PlannedAccessEntity.update(id, dataWithoutId);

  const rawPersons = parseFormDataArrays<Record<string, string>>(
    formData,
    "persons",
    [
      "firstNameSnapshot",
      "middleNameSnapshot",
      "lastNameSnapshot",
      "secondLastNameSnapshot",
      "legalIdSnapshot",
    ],
  );

  const rawVehicles = parseFormDataArrays<Record<string, string>>(
    formData,
    "vehicles",
    [
      "typeSnapshot",
      "brandSnapshot",
      "modelSnapshot",
      "plateSnapshot",
    ],
  );

  const persons = rawPersons.map((p) => ({
    firstNameSnapshot: p.firstNameSnapshot,
    middleNameSnapshot: p.middleNameSnapshot || undefined,
    lastNameSnapshot: p.lastNameSnapshot,
    secondLastNameSnapshot: p.secondLastNameSnapshot || undefined,
    legalIdSnapshot: p.legalIdSnapshot,
  }));

  const vehicles = rawVehicles.map((v) => ({
    typeSnapshot: v.typeSnapshot,
    brandSnapshot: v.brandSnapshot || undefined,
    modelSnapshot: v.modelSnapshot || undefined,
    plateSnapshot: v.plateSnapshot,
  }));

  if (persons.length > 0) {
    await PlannedAccessEntity.addPersons(id, persons);
  }

  if (vehicles.length > 0) {
    await PlannedAccessEntity.addVehicles(id, vehicles);
  }

  return { success: true };
}
