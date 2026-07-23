import z from "zod";
import { requiredString } from "./generic";
import {
  DOCUMENT_EXPIRY_REQUIRED,
  DOCUMENT_TYPE_REQUIRED,
} from "./messages";
import { parseUtcDateOnly } from "../document-expiry";

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
});

export const reviewDocumentSchema = z.object({
  decision: z.enum(["VALIDATED", "REJECTED"]),
  reviewReason: requiredString,
});

export const deleteDocumentSchema = z.object({
  id: requiredString,
});

export const checkExpirySchema = z.object({
  token: z.string().optional(),
});
