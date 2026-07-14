import z from "zod";
import { ExternalWorkerEntity } from "../database/external-worker.server";
import { AuditLogEntity } from "../database/audit-log.server";
import { createExternalWorkerSchema, deleteExternalWorkerSchema, updateExternalWorkerSchema } from "../schemas/external-worker";

async function audit(
  userId: string,
  entityType: string,
  entityId: string,
  action: string,
  summary: string,
  metadata?: Record<string, unknown>,
) {
  await AuditLogEntity.create({
    entityType,
    entityId,
    action,
    changedBy: userId,
    summary,
    metadata,
  });
}

export async function getManyExternalWorkers() {
  return ExternalWorkerEntity.findMany();
}

export async function getExternalWorkerById(id: string) {
  return ExternalWorkerEntity.findById(id);
}

export async function createExternalWorker(input: Record<string, unknown>, userId: string) {
  const parsed = await createExternalWorkerSchema.safeParseAsync(input);
  if (!parsed.success) {
    return { success: false, errors: z.treeifyError(parsed.error) };
  }

  const worker = await ExternalWorkerEntity.create(parsed.data);

  await audit(
    userId,
    "ExternalWorker",
    worker.id,
    "CREATE",
    `Trabajador externo ${worker.firstName} ${worker.lastName} (${worker.legalId}) creado`,
    { data: parsed.data },
  );

  return { success: true };
}

export async function updateExternalWorker(input: Record<string, unknown>, userId: string) {
  const parsed = await updateExternalWorkerSchema.safeParseAsync(input);
  if (!parsed.success) {
    return { success: false, errors: z.treeifyError(parsed.error) };
  }

  const { id, ...data } = parsed.data;
  const current = await ExternalWorkerEntity.findById(id);
  const worker = await ExternalWorkerEntity.update(id, data);

  await audit(
    userId,
    "ExternalWorker",
    worker.id,
    "UPDATE",
    `Trabajador externo ${worker.firstName} ${worker.lastName} actualizado`,
    { previous: current ? { firstName: current.firstName, lastName: current.lastName, legalId: current.legalId, companyId: current.companyId, workCategoryId: current.workCategoryId } : null, updated: data },
  );

  return { success: true };
}

export async function deleteExternalWorker(input: Record<string, unknown>, userId: string) {
  const parsed = await deleteExternalWorkerSchema.safeParseAsync(input);
  if (!parsed.success) {
    return { success: false, errors: z.treeifyError(parsed.error) };
  }

  const worker = await ExternalWorkerEntity.findById(parsed.data.id);
  if (!worker) {
    return { success: false };
  }

  await ExternalWorkerEntity.delete(parsed.data.id);

  await audit(
    userId,
    "ExternalWorker",
    parsed.data.id,
    "DELETE",
    `Trabajador externo ${worker.firstName} ${worker.lastName} (${worker.legalId}) eliminado`,
  );

  return { success: true };
}

export async function searchExternalWorkers(query: string) {
  return ExternalWorkerEntity.search(query);
}
