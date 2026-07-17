import { mkdir } from "fs/promises";
import { join, normalize, resolve as resolvePath } from "path";
import { writeFile, unlink } from "fs/promises";
import z from "zod";
import { areFileUploadsSupported } from "../platform.server";
import { WorkerDocumentEntity } from "../database/worker-document.server";
import { AuditLogEntity } from "../database/audit-log.server";
import { ExternalWorkerEntity } from "../database/external-worker.server";
import {
  uploadDocumentSchema,
  updateDocumentSchema,
  deleteDocumentSchema,
} from "../schemas/worker-document";
import { INVALID_FILE_TYPE, FILE_TOO_LARGE, FILE_REQUIRED } from "../schemas/messages";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

function getUploadsBasePath() {
  const envPath = process.env["UPLOADS_BASE_PATH"];
  if (!envPath) {
    throw new Error("UPLOADS_BASE_PATH no esta definido en las variables de entorno.");
  }
  return resolvePath(envPath);
}

export function toOsPath(storedRelativePath: string) {
  return normalize(join(getUploadsBasePath(), ...storedRelativePath.split("/")));
}

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

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

export async function getWorkerDocuments(workerId: string) {
  return WorkerDocumentEntity.findByWorkerId(workerId);
}

export async function getAllDocuments() {
  return WorkerDocumentEntity.findAllWithWorker();
}

export async function getDocumentById(id: string) {
  return WorkerDocumentEntity.findById(id);
}

export async function uploadWorkerDocument(
  workerId: string,
  file: File,
  formData: Record<string, string>,
  userId: string,
) {
  if (!areFileUploadsSupported()) {
    return { success: false as const, errors: "Carga de documentos no disponible en este entorno." };
  }

  const worker = await ExternalWorkerEntity.findById(workerId);
  if (!worker) {
    return { success: false as const, errors: "El trabajador externo no existe." };
  }

  const parsed = await uploadDocumentSchema.safeParseAsync({
    documentType: formData.documentType,
    expiryDate: formData.expiryDate,
    notes: formData.notes,
  });

  if (!parsed.success) {
    return { success: false as const, errors: z.treeifyError(parsed.error) };
  }

  if (!file || file.size === 0) {
    return { success: false as const, errors: FILE_REQUIRED };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { success: false as const, errors: FILE_TOO_LARGE };
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { success: false as const, errors: INVALID_FILE_TYPE };
  }

  const record = await WorkerDocumentEntity.create({
    documentType: parsed.data.documentType,
    status: "VALIDATED",
    fileName: file.name,
    filePath: "",
    fileSize: file.size,
    mimeType: file.type,
    expiryDate: parsed.data.expiryDate,
    notes: parsed.data.notes,
    externalWorkerId: workerId,
  });

  const safeFileName = sanitizeFileName(file.name);
  const posixRelativePath = `workers/${workerId}/${record.id}-${safeFileName}`;
  const fullPath = toOsPath(posixRelativePath);

  await mkdir(normalize(join(getUploadsBasePath(), "workers", workerId)), { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(fullPath, buffer);

  await WorkerDocumentEntity.update(record.id, { filePath: posixRelativePath });

  await audit(
    userId,
    "WorkerDocument",
    record.id,
    "CREATE",
    `Documento de tipo ${parsed.data.documentType} subido para ${worker.firstName} ${worker.lastName}`,
    { documentType: parsed.data.documentType, fileName: file.name, expiryDate: parsed.data.expiryDate },
  );

  return { success: true as const, document: record };
}

export async function updateWorkerDocument(
  documentId: string,
  data: Record<string, string>,
  userId: string,
) {
  const doc = await WorkerDocumentEntity.findById(documentId);
  if (!doc) {
    return { success: false as const, errors: "El documento no fue encontrado." };
  }

  const parsed = await updateDocumentSchema.safeParseAsync({
    id: data.id,
    status: data.status,
    expiryDate: data.expiryDate,
    notes: data.notes,
  });

  if (!parsed.success) {
    return { success: false as const, errors: z.treeifyError(parsed.error) };
  }

  await WorkerDocumentEntity.update(documentId, {
    status: parsed.data.status,
    expiryDate: parsed.data.expiryDate,
    notes: parsed.data.notes,
  });

  await audit(
    userId,
    "WorkerDocument",
    documentId,
    "UPDATE",
    `Documento ${documentId} actualizado`,
    { changes: parsed.data },
  );

  return { success: true as const };
}

export async function deleteWorkerDocument(
  documentId: string,
  userId: string,
) {
  if (!areFileUploadsSupported()) {
    return { success: false as const, errors: "Eliminación de documentos no disponible en este entorno." };
  }

  const doc = await WorkerDocumentEntity.findById(documentId);
  if (!doc) {
    return { success: false as const, errors: "El documento no fue encontrado." };
  }

  await WorkerDocumentEntity.delete(documentId);

  const fullPath = toOsPath(doc.filePath);
  try {
    await unlink(fullPath);
  } catch {
    // File may not exist on disk, ignore
  }

  await audit(
    userId,
    "WorkerDocument",
    documentId,
    "DELETE",
    `Documento ${doc.fileName} eliminado del trabajador ${doc.externalWorker.firstName} ${doc.externalWorker.lastName}`,
  );

  return { success: true as const };
}

export async function checkExpiredDocuments() {
  const expiredDocs = await WorkerDocumentEntity.findExpiredValidated();
  if (expiredDocs.length === 0) {
    return { expired: 0 };
  }

  const ids = expiredDocs.map((d) => d.id);
  const result = await WorkerDocumentEntity.markManyAsExpired(ids);

  for (const doc of expiredDocs) {
    await AuditLogEntity.create({
      entityType: "WorkerDocument",
      entityId: doc.id,
      action: "EXPIRE",
      changedBy: "system",
      summary: `Documento ${doc.fileName} marcado como expirado`,
    });
  }

  return { expired: result.count };
}

export async function validateWorkerDocumentsForApproval(
  workerId: string,
  requiresTraining: boolean,
): Promise<{ valid: boolean; missingTypes: string[]; expiredTypes: string[] }> {
  const missingTypes: string[] = [];
  const expiredTypes: string[] = [];

  const identification = await WorkerDocumentEntity.findValidByWorkerIdAndType(
    workerId,
    "IDENTIFICATION",
  );

  if (!identification) {
    const anyIdentification = await WorkerDocumentEntity.findByWorkerId(workerId);
    const idDoc = anyIdentification.find((d) => d.documentType === "IDENTIFICATION");
    if (!idDoc) {
      missingTypes.push("IDENTIFICATION");
    } else if (idDoc.status === "EXPIRED") {
      expiredTypes.push("IDENTIFICATION");
    } else {
      missingTypes.push("IDENTIFICATION");
    }
  }

  if (requiresTraining) {
    const training = await WorkerDocumentEntity.findValidByWorkerIdAndType(
      workerId,
      "TRAINING",
    );

    if (!training) {
      const anyDocs = await WorkerDocumentEntity.findByWorkerId(workerId);
      const trainingDoc = anyDocs.find((d) => d.documentType === "TRAINING");
      if (!trainingDoc) {
        missingTypes.push("TRAINING");
      } else if (trainingDoc.status === "EXPIRED") {
        expiredTypes.push("TRAINING");
      } else {
        missingTypes.push("TRAINING");
      }
    }
  }

  return {
    valid: missingTypes.length === 0 && expiredTypes.length === 0,
    missingTypes,
    expiredTypes,
  };
}
