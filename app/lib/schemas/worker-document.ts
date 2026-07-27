import z from "zod";
import { requiredString } from "./generic";
import {
  DOCUMENT_EXPIRY_REQUIRED,
  DOCUMENT_TYPE_REQUIRED,
} from "./messages";
import { parseUtcDateOnly } from "../document-expiry";
import {
  hasDocumentField,
  isDocumentRecordTypeAllowed,
} from "../models/worker-document";
import type { DocumentRecordType, DocumentType } from "../../../db/enums";

const documentTypes = ["IDENTIFICATION", "TRAINING", "SPECIAL_PERMISSION"] as const;
const recordTypes = [
  "IDENTITY_CREDENTIAL",
  "TRAINING_EVIDENCE",
  "LEGAL_AUTHORIZATION",
  "ISSUER_CARD",
  "EMPLOYER_AUTHORIZATION",
  "SITE_INDUCTION",
  "MEDICAL_SUITABILITY",
  "WORK_PERMIT",
] as const;
const expiryBases = [
  "LAW",
  "COLLECTIVE_AGREEMENT",
  "ISSUER",
  "EMPLOYER_POLICY",
  "CLIENT_POLICY",
  "RISK_ASSESSMENT",
  "LEGACY_UNKNOWN",
  "NOT_APPLICABLE",
] as const;
const optionalDate = z
  .string()
  .optional()
  .transform((value) => (value ? parseUtcDateOnly(value) : null))
  .refine((value) => value === null || !isNaN(value.getTime()), DOCUMENT_EXPIRY_REQUIRED);

const optionalString = z.string().trim().optional().transform((value) => value || null);

const scopedFields = [
  "completedAt",
  "issuedAt",
  "validFrom",
  "validUntil",
  "refresherDueAt",
  "reviewDueAt",
  "lastPerformedAt",
  "legalSource",
  "jurisdiction",
  "sector",
  "taskScope",
  "riskScopes",
  "equipmentTypes",
  "procedureVersion",
  "issuer",
  "employerAuthorizer",
] as const;

function addInapplicableFieldIssues(
  data: Record<string, unknown> & { recordType: string },
  context: z.RefinementCtx,
) {
  for (const field of scopedFields) {
    const value = data[field];
    const hasValue = Array.isArray(value) ? value.length > 0 : value !== null && value !== undefined && value !== "";
    if (hasValue && !hasDocumentField(data.recordType as DocumentRecordType, field)) {
      context.addIssue({
        code: "custom",
        path: [field],
        message: "Este campo no aplica a la naturaleza del documento.",
      });
    }
  }
}

function optionalList(value: string | undefined) {
  if (value === undefined) return undefined;
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export const uploadDocumentSchema = z.object({
  documentType: requiredString.refine(
    (v) => documentTypes.includes(v as (typeof documentTypes)[number]),
    DOCUMENT_TYPE_REQUIRED,
  ).transform((v) => v as (typeof documentTypes)[number]),
  recordType: z.enum(recordTypes),
  completedAt: optionalDate,
  issuedAt: optionalDate,
  validFrom: optionalDate,
  validUntil: optionalDate,
  refresherDueAt: optionalDate,
  reviewDueAt: optionalDate,
  lastPerformedAt: optionalDate,
  expiryBasis: z.enum(expiryBases),
  legalSource: optionalString,
  jurisdiction: optionalString,
  sector: optionalString,
  siteId: optionalString,
  workCategoryId: optionalString,
  taskScope: optionalString,
  riskScopes: z.string().optional().transform(optionalList),
  equipmentTypes: z.string().optional().transform(optionalList),
  procedureVersion: optionalString,
  issuer: optionalString,
  employerAuthorizer: optionalString,
  supersedesDocumentId: optionalString,
  notes: optionalString,
}).superRefine((data, context) => {
  if (!isDocumentRecordTypeAllowed(data.documentType as DocumentType, data.recordType as DocumentRecordType)) {
    context.addIssue({
      code: "custom",
      path: ["recordType"],
      message: "La naturaleza no corresponde al tipo de documento seleccionado.",
    });
  }
  addInapplicableFieldIssues(data, context);
});

export const updateDocumentSchema = z.object({
  id: requiredString,
  recordType: z.enum(recordTypes).optional(),
  completedAt: optionalDate.optional(),
  issuedAt: optionalDate.optional(),
  validFrom: optionalDate.optional(),
  validUntil: optionalDate.optional(),
  refresherDueAt: optionalDate.optional(),
  reviewDueAt: optionalDate.optional(),
  lastPerformedAt: optionalDate.optional(),
  expiryBasis: z.enum(expiryBases).optional(),
  legalSource: optionalString.optional(),
  jurisdiction: optionalString.optional(),
  sector: optionalString.optional(),
  siteId: optionalString.optional(),
  workCategoryId: optionalString.optional(),
  taskScope: optionalString.optional(),
  riskScopes: z.string().optional().transform(optionalList),
  equipmentTypes: z.string().optional().transform(optionalList),
  procedureVersion: optionalString.optional(),
  issuer: optionalString.optional(),
  employerAuthorizer: optionalString.optional(),
  supersedesDocumentId: optionalString.optional(),
  notes: optionalString.optional(),
}).superRefine((data, context) => {
  if (data.recordType) addInapplicableFieldIssues(data as Record<string, unknown> & { recordType: string }, context);
});

export const reviewDocumentSchema = z.object({
  decision: z.enum(["VALIDATED", "REJECTED"]),
  reviewReason: z.string().trim().optional(),
}).superRefine((data, context) => {
  if (data.decision === "REJECTED" && !data.reviewReason) {
    context.addIssue({
      code: "custom",
      path: ["reviewReason"],
      message: "El motivo es obligatorio al rechazar un documento.",
    });
  }
});

export const deleteDocumentSchema = z.object({
  id: requiredString,
});

export const checkExpirySchema = z.object({
  token: z.string().optional(),
});
