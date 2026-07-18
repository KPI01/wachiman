import type { DocumentType, DocumentStatus } from "../../../db/enums";

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  IDENTIFICATION: "Identificacion",
  TRAINING: "Capacitacion",
};

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  VALIDATED: "Validado",
  EXPIRED: "Expirado",
  ARCHIVED: "Archivado",
};
