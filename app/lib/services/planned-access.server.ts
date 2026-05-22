import z from "zod";
import type { PlannedAccessStatus } from "../../../prisma/generated/prisma/client";
import { PlannedAccessEntity } from "../database/planned-access.server";
import { UserEntity } from "../database/user.server";
import {
  createPlannedAccessSchema,
  updatePlannedAccessStatusSchema,
} from "../schemas/planned-access";

const PLANNED_ACCESS_PERSON_FIELD = /^persons\[(\d+)]\.(.+)$/;

export function getPlannedAccessFormInput(formData: FormData) {
  const data: Record<string, unknown> = {};
  const persons = new Map<number, Record<string, string>>();

  for (const [name, value] of formData.entries()) {
    const personField = PLANNED_ACCESS_PERSON_FIELD.exec(name);

    if (!personField) {
      data[name] = String(value);
      continue;
    }

    const [, rawIndex, fieldName] = personField;
    const index = Number(rawIndex);
    const person = persons.get(index) ?? {};

    person[fieldName] = String(value);
    persons.set(index, person);
  }

  data.persons = Array.from(persons.entries())
    .sort(([leftIndex], [rightIndex]) => leftIndex - rightIndex)
    .map(([, person]) => person);

  return data;
}

export async function getManyPlannedAccesses(input?: {
  status?: PlannedAccessStatus;
  siteId?: string;
}) {
  return await PlannedAccessEntity.findMany(input);
}

type PlannedAccessAuthorOptions = {
  authorUsername: string;
};

export async function createPlannedAccess(
  input: Record<string, unknown>,
  options: PlannedAccessAuthorOptions,
) {
  const parsed = await createPlannedAccessSchema.safeParseAsync(input);

  if (!parsed.success) {
    return { success: false, errors: z.treeifyError(parsed.error) };
  }

  const author = await UserEntity.getByUsername(options.authorUsername);

  if (!author) {
    return { success: false, errors: "unauthorized" };
  }

  await PlannedAccessEntity.create({
    ...parsed.data,
    requestedById: author.id,
    approvedById: author.id,
  });

  return { success: true };
}

export async function updatePlannedAccessStatus(
  input: Record<string, unknown>,
  options: PlannedAccessAuthorOptions,
) {
  const parsed = await updatePlannedAccessStatusSchema.safeParseAsync(input);

  if (!parsed.success) {
    return { success: false, errors: z.treeifyError(parsed.error) };
  }

  const author = await UserEntity.getByUsername(options.authorUsername);

  if (!author) {
    return { success: false, errors: "unauthorized" };
  }

  await PlannedAccessEntity.updateStatus({
    id: parsed.data.id,
    status: parsed.data.status,
    approvedById: author.id,
    approvedAt: parsed.data.status === "APPROVED" ? new Date() : null,
  });

  return { success: true };
}
