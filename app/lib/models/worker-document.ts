import type {
  DocumentExpiryBasis,
  DocumentRecordType,
  DocumentStatus,
  DocumentType,
} from "../../../db/enums";

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  IDENTIFICATION: "Identificacion",
  TRAINING: "Capacitacion",
  SPECIAL_PERMISSION: "Permiso especial",
};

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  PENDING_REVIEW: "Pendiente de revision",
  VALIDATED: "Validado",
  REJECTED: "Rechazado",
  EXPIRED: "Expirado",
  ARCHIVED: "Archivado",
};

export const DOCUMENT_RECORD_TYPE_LABELS: Record<DocumentRecordType, string> = {
  IDENTITY_CREDENTIAL: "Documento de identidad",
  TRAINING_EVIDENCE: "Documento de capacitacion",
  LEGAL_AUTHORIZATION: "Autorizacion legal",
  ISSUER_CARD: "Tarjeta del emisor",
  EMPLOYER_AUTHORIZATION: "Autorizacion empresarial",
  SITE_INDUCTION: "Induccion de centro",
  MEDICAL_SUITABILITY: "Aptitud medica",
  WORK_PERMIT: "Permiso de trabajo",
};

export const DOCUMENT_RECORD_TYPES_BY_DOCUMENT_TYPE: Record<DocumentType, DocumentRecordType[]> = {
  IDENTIFICATION: ["IDENTITY_CREDENTIAL"],
  TRAINING: ["TRAINING_EVIDENCE", "ISSUER_CARD", "SITE_INDUCTION"],
  SPECIAL_PERMISSION: [
    "LEGAL_AUTHORIZATION",
    "ISSUER_CARD",
    "EMPLOYER_AUTHORIZATION",
    "MEDICAL_SUITABILITY",
    "WORK_PERMIT",
  ],
};

export type DocumentField =
  | "completedAt"
  | "issuedAt"
  | "validFrom"
  | "validUntil"
  | "refresherDueAt"
  | "reviewDueAt"
  | "lastPerformedAt"
  | "legalSource"
  | "jurisdiction"
  | "sector"
  | "taskScope"
  | "riskScopes"
  | "equipmentTypes"
  | "procedureVersion"
  | "issuer"
  | "employerAuthorizer";

export const DOCUMENT_FIELDS_BY_RECORD_TYPE: Record<DocumentRecordType, DocumentField[]> = {
  IDENTITY_CREDENTIAL: ["issuedAt", "validFrom", "validUntil", "issuer", "jurisdiction"],
  TRAINING_EVIDENCE: [
    "completedAt",
    "refresherDueAt",
    "reviewDueAt",
    "issuer",
    "taskScope",
    "riskScopes",
    "equipmentTypes",
    "procedureVersion",
    "sector",
  ],
  LEGAL_AUTHORIZATION: [
    "issuedAt",
    "validFrom",
    "validUntil",
    "reviewDueAt",
    "legalSource",
    "jurisdiction",
    "taskScope",
    "riskScopes",
    "equipmentTypes",
    "procedureVersion",
    "issuer",
    "sector",
  ],
  ISSUER_CARD: ["issuedAt", "validFrom", "validUntil", "issuer", "jurisdiction", "taskScope", "sector"],
  EMPLOYER_AUTHORIZATION: [
    "issuedAt",
    "validFrom",
    "validUntil",
    "reviewDueAt",
    "employerAuthorizer",
    "taskScope",
    "riskScopes",
    "equipmentTypes",
    "procedureVersion",
    "sector",
  ],
  SITE_INDUCTION: [
    "completedAt",
    "reviewDueAt",
    "taskScope",
    "riskScopes",
    "procedureVersion",
    "issuer",
  ],
  MEDICAL_SUITABILITY: ["issuedAt", "validFrom", "validUntil", "reviewDueAt", "issuer", "jurisdiction", "sector"],
  WORK_PERMIT: [
    "issuedAt",
    "validFrom",
    "validUntil",
    "legalSource",
    "jurisdiction",
    "taskScope",
    "riskScopes",
    "equipmentTypes",
    "procedureVersion",
    "issuer",
    "employerAuthorizer",
    "sector",
  ],
};

export function isDocumentRecordTypeAllowed(
  documentType: DocumentType,
  recordType: DocumentRecordType,
) {
  return DOCUMENT_RECORD_TYPES_BY_DOCUMENT_TYPE[documentType].includes(recordType);
}

export function hasDocumentField(recordType: DocumentRecordType, field: DocumentField) {
  return DOCUMENT_FIELDS_BY_RECORD_TYPE[recordType].includes(field);
}

export const DOCUMENT_EXPIRY_BASIS_LABELS: Record<DocumentExpiryBasis, string> = {
  LAW: "Norma legal",
  COLLECTIVE_AGREEMENT: "Convenio colectivo",
  ISSUER: "Emisor",
  EMPLOYER_POLICY: "Politica empresarial",
  CLIENT_POLICY: "Politica del cliente",
  RISK_ASSESSMENT: "Evaluacion de riesgos",
  LEGACY_UNKNOWN: "Origen historico desconocido",
  NOT_APPLICABLE: "No aplica",
};

export function defaultRecordTypeForDocumentType(
  documentType: DocumentType,
): DocumentRecordType {
  if (documentType === "IDENTIFICATION") return "IDENTITY_CREDENTIAL";
  if (documentType === "SPECIAL_PERMISSION") return "EMPLOYER_AUTHORIZATION";
  return "TRAINING_EVIDENCE";
}
