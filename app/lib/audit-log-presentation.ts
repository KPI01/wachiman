const ENTITY_LABELS: Record<string, string> = {
  "access-log": "Registro de acceso",
  "planned-access": "Solicitud de acceso",
  "external-worker": "Trabajador externo",
  company: "Empresa",
  user: "Usuario",
  "work-permit": "Permiso de trabajo",
  "worker-document": "Documento de trabajador",
  backup: "Copia de seguridad",
  "app-settings": "Configuración de la aplicación",
};

const ENTITY_REFERENCES: Record<string, string> = {
  "access-log": "un registro de acceso",
  "planned-access": "una solicitud de acceso",
  "external-worker": "un trabajador externo",
  company: "una empresa",
  user: "un usuario",
  "work-permit": "un permiso de trabajo",
  "worker-document": "un documento de trabajador",
  backup: "una copia de seguridad",
  "app-settings": "la configuración de la aplicación",
};

const ACTION_LABELS: Record<string, string> = {
  CREATE: "Creación",
  UPDATE: "Actualización",
  DELETE: "Eliminación",
  APPROVE: "Aprobación",
  REJECT: "Rechazo",
  REGISTER_EXIT: "Registro de salida",
  EXIT_SIGNATURE_REQUESTED: "Firma de salida solicitada",
  FORCE_EXIT: "Cierre forzado",
  SYSTEM_EXIT: "Cierre automático",
  CANCEL: "Cancelación",
  PLANNED_ACCESS_CREATED: "Solicitud creada",
  PLANNED_ACCESS_UPDATED: "Solicitud actualizada",
  SELF_APPROVAL_BLOCKED: "Autoaprobación bloqueada",
  PLANNED_ACCESS_APPROVED: "Solicitud aprobada",
  PLANNED_ACCESS_REJECTED: "Solicitud rechazada",
  PLANNED_ACCESS_CANCELED: "Solicitud cancelada",
  INDIVIDUAL_ACCESS_DECISIONS_RECORDED: "Decisiones de acceso registradas",
  BACKUP_EXPORT_STARTED: "Exportación iniciada",
  BACKUP_EXPORTED: "Copia de seguridad exportada",
  BACKUP_IMPORTED: "Copia de seguridad importada",
  BACKUP_OPERATION_FAILED: "Error en la copia de seguridad",
  DOCUMENT_REVIEWED: "Documento revisado",
  DOCUMENT_UPLOADED: "Documento añadido",
  DOCUMENT_UPDATED: "Documento actualizado",
  DOCUMENT_ARCHIVED: "Documento archivado",
  EXPIRE: "Caducidad aplicada",
  APP_SETTINGS_UPDATED: "Configuración actualizada",
};

const SUMMARY_ACTIONS: Record<string, string> = {
  CREATE: "creó",
  UPDATE: "actualizó",
  DELETE: "eliminó",
  APPROVE: "aprobó",
  REJECT: "rechazó",
  REGISTER_EXIT: "registró",
  CANCEL: "canceló",
};

function normalizeEntityType(entityType: string) {
  return entityType
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[_\s]+/g, "-")
    .toLowerCase();
}

function capitalize(value: string) {
  return value.charAt(0).toLocaleUpperCase("es-ES") + value.slice(1);
}

export function getAuditEntityLabel(entityType: string) {
  const key = normalizeEntityType(entityType);
  const knownLabel = ENTITY_LABELS[key];
  if (knownLabel) return knownLabel;

  const words = key.replace(/-/g, " ").trim();
  return words ? capitalize(words) : "Desconocida";
}

export function getAuditActionLabel(action: string) {
  const key = action.toUpperCase();
  const knownLabel = ACTION_LABELS[key];
  if (knownLabel) return knownLabel;

  const words = action.replace(/[_-]+/g, " ").trim().toLocaleLowerCase("es-ES");
  return words ? capitalize(words) : "Otra acción";
}

export function getAuditSummaryLabel(
  summary: string,
  entityType: string,
  action: string,
) {
  const genericSummary = summary.match(
    /^(.+?) realizó la acción .+? sobre .+?\.?$/i,
  );
  const actionVerb = SUMMARY_ACTIONS[action.toUpperCase()];
  if (!genericSummary || !actionVerb) return summary;

  const entityKey = normalizeEntityType(entityType);
  const entityReference =
    ENTITY_REFERENCES[entityKey] ?? `un registro de ${getAuditEntityLabel(entityType).toLocaleLowerCase("es-ES")}`;

  if (action.toUpperCase() === "REGISTER_EXIT") {
    return `${genericSummary[1]} registró una salida de acceso.`;
  }

  return `${genericSummary[1]} ${actionVerb} ${entityReference}.`;
}
