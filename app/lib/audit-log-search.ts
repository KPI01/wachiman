export const AUDIT_RECORD_SEARCH_FIELDS = [
  { value: "id", label: "ID del evento" },
  { value: "entityId", label: "ID de la entidad" },
  { value: "entityType", label: "Entidad" },
  { value: "action", label: "Acción" },
  { value: "changedBy", label: "Usuario o ID de usuario" },
  { value: "summary", label: "Resumen" },
  { value: "createdAt", label: "Fecha del registro" },
] as const;

export const AUDIT_METADATA_SEARCH_FIELDS = [
  {
    value: "all",
    label: "Cualquier metadato",
    keys: [] as string[],
  },
  {
    value: "identification",
    label: "DNI / NIE e identificaciones",
    keys: ["legalId", "legalIdSnapshot", "holderTaxId", "signerLegalId"],
  },
  {
    value: "name",
    label: "Nombres y apellidos",
    keys: [
      "actorName",
      "name",
      "fullName",
      "firstName",
      "firstNameSnapshot",
      "middleName",
      "middleNameSnapshot",
      "lastName",
      "lastNameSnapshot",
      "secondLastName",
      "secondLastNameSnapshot",
      "signerName",
    ],
  },
  {
    value: "identifiers",
    label: "IDs relacionados",
    keys: [
      "id",
      "entityId",
      "reviewId",
      "workPermitId",
      "plannedAccessId",
      "externalWorkerId",
      "siteId",
      "companyId",
      "allowedAreaId",
      "workCategoryId",
    ],
  },
  {
    value: "company",
    label: "Empresa",
    keys: ["companySnapshot", "holderLegalName"],
  },
  {
    value: "site",
    label: "Centro",
    keys: ["siteId", "siteName"],
  },
  {
    value: "reason",
    label: "Motivo y notas",
    keys: ["reason", "visitReason", "decisionReason", "notes", "incidents"],
  },
  {
    value: "dates",
    label: "Fechas de los metadatos",
    keys: [
      "expectedStartDatetime",
      "expectedEndDatetime",
      "approvedAt",
      "decisionAt",
      "validUntil",
      "entryTimestamp",
      "exitTimestamp",
      "reviewedAt",
      "signedAt",
      "createdAt",
      "updatedAt",
    ],
  },
] as const;

export const AUDIT_METADATA_DATE_FIELDS = [
  { value: "all", label: "Cualquier fecha de los metadatos" },
  { value: "expectedStartDatetime", label: "Inicio previsto" },
  { value: "expectedEndDatetime", label: "Fin previsto" },
  { value: "approvedAt", label: "Fecha de aprobación" },
  { value: "decisionAt", label: "Fecha de decisión" },
  { value: "validUntil", label: "Fecha de vencimiento" },
  { value: "entryTimestamp", label: "Fecha de ingreso" },
  { value: "exitTimestamp", label: "Fecha de salida" },
  { value: "reviewedAt", label: "Fecha de revisión" },
  { value: "signedAt", label: "Fecha de firma" },
  { value: "createdAt", label: "Fecha de creación" },
  { value: "updatedAt", label: "Fecha de actualización" },
] as const;

export const AUDIT_RECORD_DATE_FIELDS = [
  { value: "createdAt", label: "Fecha del registro" },
] as const;
