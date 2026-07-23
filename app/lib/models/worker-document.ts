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
  TRAINING_EVIDENCE: "Evidencia de capacitacion",
  LEGAL_AUTHORIZATION: "Autorizacion legal",
  ISSUER_CARD: "Tarjeta del emisor",
  EMPLOYER_AUTHORIZATION: "Autorizacion empresarial",
  SITE_INDUCTION: "Induccion de centro",
  MEDICAL_SUITABILITY: "Aptitud medica",
  WORK_PERMIT: "Permiso de trabajo",
};

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
