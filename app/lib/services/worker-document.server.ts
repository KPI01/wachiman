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
import type { DocumentType } from "../../../db/enums";
import { isDateExpired, isDateValidThrough } from "../document-expiry";
import { defaultRecordTypeForDocumentType } from "../models/worker-document";

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
  return envPath;
}

export async function toOsPath(storedRelativePath: string) {
  const { join, normalize } = await import("path");
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

export async function getDocumentByWorkerId(id: string, workerId: string) {
  return WorkerDocumentEntity.findByIdAndWorkerId(id, workerId);
}

export async function uploadWorkerDocument(
  workerId: string,
  file: File,
  formData: Record<string, string>,
  userId: string,
  options?: { validateImmediately?: boolean; reviewReason?: string },
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
    recordType: formData.recordType ?? defaultRecordTypeForDocumentType(formData.documentType as DocumentType),
    completedAt: formData.completedAt,
    issuedAt: formData.issuedAt,
    validFrom: formData.validFrom,
    validUntil: formData.validUntil ?? formData.expiryDate,
    refresherDueAt: formData.refresherDueAt,
    reviewDueAt: formData.reviewDueAt,
    lastPerformedAt: formData.lastPerformedAt,
    expiryBasis: formData.expiryBasis ?? "NOT_APPLICABLE",
    legalSource: formData.legalSource,
    jurisdiction: formData.jurisdiction,
    sector: formData.sector,
    siteId: formData.siteId,
    workCategoryId: formData.workCategoryId,
    taskScope: formData.taskScope,
    riskScopes: formData.riskScopes,
    equipmentTypes: formData.equipmentTypes,
    procedureVersion: formData.procedureVersion,
    issuer: formData.issuer,
    employerAuthorizer: formData.employerAuthorizer,
    supersedesDocumentId: formData.supersedesDocumentId,
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
    recordType: parsed.data.recordType,
    status: options?.validateImmediately ? "VALIDATED" : "PENDING_REVIEW",
    fileName: file.name,
    filePath: "",
    fileSize: file.size,
    mimeType: file.type,
    completedAt: parsed.data.completedAt,
    issuedAt: parsed.data.issuedAt,
    validFrom: parsed.data.validFrom,
    validUntil: parsed.data.validUntil,
    refresherDueAt: parsed.data.refresherDueAt,
    reviewDueAt: parsed.data.reviewDueAt,
    lastPerformedAt: parsed.data.lastPerformedAt,
    expiryBasis: parsed.data.expiryBasis,
    legalSource: parsed.data.legalSource,
    jurisdiction: parsed.data.jurisdiction,
    sector: parsed.data.sector,
    siteId: parsed.data.siteId,
    workCategoryId: parsed.data.workCategoryId ?? worker.workCategoryId,
    taskScope: parsed.data.taskScope,
    riskScopes: parsed.data.riskScopes,
    equipmentTypes: parsed.data.equipmentTypes,
    procedureVersion: parsed.data.procedureVersion,
    issuer: parsed.data.issuer,
    employerAuthorizer: parsed.data.employerAuthorizer,
    supersedesDocumentId: parsed.data.supersedesDocumentId,
    reviewedById: options?.validateImmediately ? userId : null,
    reviewedAt: options?.validateImmediately ? new Date() : null,
    reviewReason: options?.reviewReason ?? null,
    notes: parsed.data.notes,
    externalWorkerId: workerId,
  });

  const safeFileName = sanitizeFileName(file.name);
  const posixRelativePath = `workers/${workerId}/${record.id}-${safeFileName}`;
  const fullPath = await toOsPath(posixRelativePath);

  const { mkdir, writeFile } = await import("fs/promises");
  const { join, normalize } = await import("path");
  const dirPath = normalize(join(getUploadsBasePath(), "workers", workerId));
  await mkdir(dirPath, { recursive: true });
  const buffer = new Uint8Array(await file.arrayBuffer());
  await writeFile(fullPath, buffer);

  await WorkerDocumentEntity.update(record.id, { filePath: posixRelativePath });

  await audit(
    userId,
    "WorkerDocument",
    record.id,
    "CREATE",
    `Documento de tipo ${parsed.data.documentType} subido para ${worker.firstName} ${worker.lastName}`,
    {
      documentType: parsed.data.documentType,
      recordType: parsed.data.recordType,
      fileName: file.name,
      validUntil: parsed.data.validUntil,
      expiryBasis: parsed.data.expiryBasis,
      status: record.status,
    },
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
    recordType: data.recordType,
    completedAt: data.completedAt,
    issuedAt: data.issuedAt,
    validFrom: data.validFrom,
    validUntil: data.validUntil,
    refresherDueAt: data.refresherDueAt,
    reviewDueAt: data.reviewDueAt,
    lastPerformedAt: data.lastPerformedAt,
    expiryBasis: data.expiryBasis,
    legalSource: data.legalSource,
    jurisdiction: data.jurisdiction,
    sector: data.sector,
    siteId: data.siteId,
    workCategoryId: data.workCategoryId,
    taskScope: data.taskScope,
    riskScopes: data.riskScopes,
    equipmentTypes: data.equipmentTypes,
    procedureVersion: data.procedureVersion,
    issuer: data.issuer,
    employerAuthorizer: data.employerAuthorizer,
    supersedesDocumentId: data.supersedesDocumentId,
    reviewReason: data.reviewReason,
    notes: data.notes,
  });

  if (!parsed.success) {
    return { success: false as const, errors: z.treeifyError(parsed.error) };
  }

  const isReview = parsed.data.status === "VALIDATED" || parsed.data.status === "REJECTED";
  await WorkerDocumentEntity.update(documentId, {
    status: parsed.data.status,
    recordType: parsed.data.recordType,
    completedAt: parsed.data.completedAt,
    issuedAt: parsed.data.issuedAt,
    validFrom: parsed.data.validFrom,
    validUntil: parsed.data.validUntil,
    refresherDueAt: parsed.data.refresherDueAt,
    reviewDueAt: parsed.data.reviewDueAt,
    lastPerformedAt: parsed.data.lastPerformedAt,
    expiryBasis: parsed.data.expiryBasis,
    legalSource: parsed.data.legalSource,
    jurisdiction: parsed.data.jurisdiction,
    sector: parsed.data.sector,
    siteId: parsed.data.siteId,
    workCategoryId: parsed.data.workCategoryId,
    taskScope: parsed.data.taskScope,
    riskScopes: parsed.data.riskScopes,
    equipmentTypes: parsed.data.equipmentTypes,
    procedureVersion: parsed.data.procedureVersion,
    issuer: parsed.data.issuer,
    employerAuthorizer: parsed.data.employerAuthorizer,
    supersedesDocumentId: parsed.data.supersedesDocumentId,
    reviewReason: parsed.data.reviewReason,
    reviewedById: isReview ? userId : undefined,
    reviewedAt: isReview ? new Date() : undefined,
    notes: parsed.data.notes,
    updatedAt: new Date(),
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

  const fullPath = await toOsPath(doc.filePath);
  try {
    const { unlink } = await import("fs/promises");
    await unlink(fullPath);
  } catch {
    // File may not exist on disk, ignore
  }

  await audit(
    userId,
    "WorkerDocument",
    documentId,
    "DELETE",
    `Documento ${doc.fileName} eliminado`,
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

  for (const doc of result) {
    await AuditLogEntity.create({
      entityType: "WorkerDocument",
      entityId: doc.id,
      action: "EXPIRE",
      changedBy: "system",
      summary: `Documento ${doc.fileName} marcado como expirado`,
    });
  }

  return { expired: result.length };
}

type DocumentRequirements = {
  requiresTraining: boolean;
  requiresSpecialPermission: boolean;
};

export type WorkerDocumentValidation = {
  valid: boolean;
  missingTypes: DocumentType[];
  expiredTypes: DocumentType[];
};

export async function validateWorkerDocumentsForAccess(
  workerId: string,
  requirements: DocumentRequirements,
  validThrough: Date,
): Promise<WorkerDocumentValidation> {
  const missingTypes: DocumentType[] = [];
  const expiredTypes: DocumentType[] = [];
  const requiredTypes: DocumentType[] = ["IDENTIFICATION"];
  if (requirements.requiresTraining) requiredTypes.push("TRAINING");
  if (requirements.requiresSpecialPermission) requiredTypes.push("SPECIAL_PERMISSION");

  const documents = await WorkerDocumentEntity.findByWorkerId(workerId);
  for (const documentType of requiredTypes) {
    const documentsOfType = documents.filter((document) => document.documentType === documentType);
    const hasValidDocument = documentsOfType.some(
      (document) =>
        document.status === "VALIDATED" &&
        isDateValidThrough(document.validUntil, validThrough),
    );

    if (hasValidDocument) continue;

    const hasExpiredDocument = documentsOfType.some(
      (document) => document.status === "EXPIRED" || isDateExpired(document.validUntil),
    );
    if (hasExpiredDocument) {
      expiredTypes.push(documentType);
    } else {
      missingTypes.push(documentType);
    }
  }

  return {
    valid: missingTypes.length === 0 && expiredTypes.length === 0,
    missingTypes,
    expiredTypes,
  };
}
