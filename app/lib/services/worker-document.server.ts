import z from "zod";
import { areFileUploadsSupported } from "../platform.server";
import { WorkerDocumentEntity } from "../database/worker-document.server";
import { AuditLogEntity } from "../database/audit-log.server";
import { ExternalWorkerEntity } from "../database/external-worker.server";
import {
  uploadDocumentSchema,
  updateDocumentSchema,
  reviewDocumentSchema,
} from "../schemas/worker-document";
import { INVALID_FILE_TYPE, FILE_TOO_LARGE, FILE_REQUIRED } from "../schemas/messages";
import type { DocumentType } from "../../../db/enums";
import { isDateExpired, isDateValidThrough } from "../document-expiry";
import {
  defaultRecordTypeForDocumentType,
  isDocumentRecordTypeAllowed,
} from "../models/worker-document";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "application/pdf",
];

const FILE_SIGNATURES: Record<string, Uint8Array> = {
  "application/pdf": new Uint8Array([0x25, 0x50, 0x44, 0x46]),
  "image/jpeg": new Uint8Array([0xff, 0xd8, 0xff]),
  "image/png": new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
};

const FILE_EXTENSIONS: Record<string, string[]> = {
  "application/pdf": [".pdf"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
};

function getUploadsBasePath() {
  const globalPath = (globalThis as Record<string, unknown>)["UPLOADS_BASE_PATH"];
  const envPath = typeof globalPath === "string" && globalPath.length > 0
    ? globalPath
    : typeof process !== "undefined" ? process.env["UPLOADS_BASE_PATH"] : undefined;
  if (!envPath) {
    throw new Error("UPLOADS_BASE_PATH no esta definido en las variables de entorno.");
  }
  return envPath;
}

export async function toOsPath(storedRelativePath: string) {
  const { isAbsolute, relative, resolve } = await import("path");
  if (isAbsolute(storedRelativePath) || storedRelativePath.includes("\\")) {
    throw new Error("La ruta del documento debe ser relativa y usar separadores POSIX.");
  }
  const root = resolve(getUploadsBasePath());
  const target = resolve(root, storedRelativePath);
  const relation = relative(root, target);
  if (relation.startsWith("..") || isAbsolute(relation)) {
    throw new Error("La ruta del documento queda fuera del almacenamiento configurado.");
  }
  return target;
}

function hasSignature(buffer: Uint8Array, signature: Uint8Array) {
  return signature.every((byte, index) => buffer[index] === byte);
}

function validateFileContent(file: File, buffer: Uint8Array) {
  const mimeType = file.type.toLowerCase();
  const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  const signature = FILE_SIGNATURES[mimeType];
  return Boolean(
    ALLOWED_MIME_TYPES.includes(mimeType) &&
    signature &&
    hasSignature(buffer, signature) &&
    FILE_EXTENSIONS[mimeType]?.includes(extension),
  );
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

  if (!isDocumentRecordTypeAllowed(parsed.data.documentType, parsed.data.recordType)) {
    return {
      success: false as const,
      errors: "La naturaleza no corresponde al tipo de documento seleccionado.",
    };
  }

  if (!file || file.size === 0) {
    return { success: false as const, errors: FILE_REQUIRED };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { success: false as const, errors: FILE_TOO_LARGE };
  }

  const buffer = new Uint8Array(await file.arrayBuffer());
  if (!validateFileContent(file, buffer)) {
    return { success: false as const, errors: INVALID_FILE_TYPE };
  }

  const { createHash } = await import("crypto");
  const contentHash = createHash("sha256").update(buffer).digest("hex");

  const record = await WorkerDocumentEntity.create({
    documentType: parsed.data.documentType,
    recordType: parsed.data.recordType,
    status: "PENDING_REVIEW",
    fileName: file.name,
    filePath: "",
    fileSize: file.size,
    mimeType: file.type,
    contentHash,
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
    reviewedById: null,
    reviewedAt: null,
    reviewReason: null,
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
  await writeFile(fullPath, buffer);

  await WorkerDocumentEntity.update(record.id, { filePath: posixRelativePath });

  await audit(
    userId,
    "WorkerDocument",
    record.id,
    "DOCUMENT_UPLOADED",
    `Documento de tipo ${parsed.data.documentType} subido para ${worker.firstName} ${worker.lastName}`,
    {
      documentType: parsed.data.documentType,
      recordType: parsed.data.recordType,
      fileName: file.name,
      validUntil: parsed.data.validUntil,
      expiryBasis: parsed.data.expiryBasis,
      status: "PENDING_REVIEW",
      contentHash,
    },
  );

  return { success: true as const, document: { ...record, filePath: posixRelativePath } };
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
    notes: data.notes,
  });

  if (!parsed.success) {
    return { success: false as const, errors: z.treeifyError(parsed.error) };
  }

  if (!isDocumentRecordTypeAllowed(doc.documentType, parsed.data.recordType ?? doc.recordType)) {
    return {
      success: false as const,
      errors: "La naturaleza no corresponde al tipo de documento seleccionado.",
    };
  }

  if (doc.status !== "PENDING_REVIEW") {
    return {
      success: false as const,
      errors: "Solo los documentos pendientes pueden modificarse. Carga un nuevo documento para sustituir un documento revisado.",
    };
  }

  await WorkerDocumentEntity.update(documentId, {
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
    notes: parsed.data.notes,
    updatedAt: new Date(),
  });

  await audit(
    userId,
    "WorkerDocument",
    documentId,
    "DOCUMENT_UPDATED",
    `Documento ${documentId} actualizado`,
    { before: doc, changes: parsed.data },
  );

  return { success: true as const };
}

export async function reviewWorkerDocument(
  documentId: string,
  data: Record<string, string>,
  userId: string,
) {
  const doc = await WorkerDocumentEntity.findById(documentId);
  if (!doc) {
    return { success: false as const, errors: "El documento no fue encontrado." };
  }

  if (doc.status !== "PENDING_REVIEW") {
    return { success: false as const, errors: "El documento ya fue revisado." };
  }

  const parsed = reviewDocumentSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false as const, errors: z.treeifyError(parsed.error) };
  }

  const reviewedAt = new Date();
  const evidenceSnapshot = {
    documentType: doc.documentType,
    recordType: doc.recordType,
    fileName: doc.fileName,
    filePath: doc.filePath,
    fileSize: doc.fileSize,
    mimeType: doc.mimeType,
    contentHash: doc.contentHash,
    completedAt: doc.completedAt,
    issuedAt: doc.issuedAt,
    validFrom: doc.validFrom,
    validUntil: doc.validUntil,
    refresherDueAt: doc.refresherDueAt,
    reviewDueAt: doc.reviewDueAt,
    lastPerformedAt: doc.lastPerformedAt,
    expiryBasis: doc.expiryBasis,
    legalSource: doc.legalSource,
    jurisdiction: doc.jurisdiction,
    sector: doc.sector,
    siteId: doc.siteId,
    workCategoryId: doc.workCategoryId,
    taskScope: doc.taskScope,
    riskScopes: doc.riskScopes,
    equipmentTypes: doc.equipmentTypes,
    procedureVersion: doc.procedureVersion,
    issuer: doc.issuer,
    employerAuthorizer: doc.employerAuthorizer,
    supersedesDocumentId: doc.supersedesDocumentId,
    notes: doc.notes,
  };

  const review = await WorkerDocumentEntity.review(documentId, {
    decision: parsed.data.decision,
    reason: parsed.data.reviewReason,
    reviewedById: userId,
    reviewedAt,
    evidenceSnapshot,
    summary: `Documento ${doc.fileName} ${parsed.data.decision === "VALIDATED" ? "validado" : "rechazado"}`,
  });
  if (!review) {
    return { success: false as const, errors: "El documento ya fue revisado." };
  }

  return { success: true as const, review };
}

export async function archiveWorkerDocument(
  documentId: string,
  userId: string,
) {
  const doc = await WorkerDocumentEntity.findById(documentId);
  if (!doc) {
    return { success: false as const, errors: "El documento no fue encontrado." };
  }

  if (doc.status === "ARCHIVED") {
    return { success: false as const, errors: "El documento ya está archivado." };
  }

  await WorkerDocumentEntity.update(documentId, {
    status: "ARCHIVED",
    updatedAt: new Date(),
  });

  await audit(
    userId,
    "WorkerDocument",
    documentId,
    "DOCUMENT_ARCHIVED",
    `Documento ${doc.fileName} archivado`,
    { previousStatus: doc.status },
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
  evaluatedDocuments: Array<{
    id: string;
    documentType: DocumentType;
    recordType: string;
    contentHash: string | null;
    validUntil: Date | null;
    reviewedById: string | null;
    reviewedAt: Date | null;
  }>;
};

export async function validateWorkerDocumentsForAccess(
  workerId: string,
  requirements: DocumentRequirements,
  validThrough: Date,
): Promise<WorkerDocumentValidation> {
  const missingTypes: DocumentType[] = [];
  const expiredTypes: DocumentType[] = [];
  const evaluatedDocuments: WorkerDocumentValidation["evaluatedDocuments"] = [];
  const requiredTypes: DocumentType[] = ["IDENTIFICATION"];
  if (requirements.requiresTraining) requiredTypes.push("TRAINING");
  if (requirements.requiresSpecialPermission) requiredTypes.push("SPECIAL_PERMISSION");

  const documents = await WorkerDocumentEntity.findByWorkerId(workerId);
  for (const documentType of requiredTypes) {
    const documentsOfType = documents.filter((document) => document.documentType === documentType);
    const validDocuments = documentsOfType.filter(
      (document) =>
        document.status === "VALIDATED" &&
        isDateValidThrough(document.validUntil, validThrough),
    );
    const hasValidDocument = validDocuments.length > 0;

    if (hasValidDocument) {
      evaluatedDocuments.push(
        ...validDocuments.map((document) => ({
          id: document.id,
          documentType: document.documentType,
          recordType: document.recordType,
          contentHash: document.contentHash,
          validUntil: document.validUntil,
          reviewedById: document.reviewedById,
          reviewedAt: document.reviewedAt,
        })),
      );
      continue;
    }

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
    evaluatedDocuments,
  };
}
