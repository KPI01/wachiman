import type {
  DataTableAdvancedFilter,
  DataTableQuickFilterGroup,
} from "./data-table";
import {
  AUDIT_METADATA_DATE_FIELDS,
  AUDIT_METADATA_SEARCH_FIELDS,
  AUDIT_RECORD_DATE_FIELDS,
  AUDIT_RECORD_SEARCH_FIELDS,
} from "~/lib/audit-log-search";

function getPresetDateRange(value: string, now: Date) {
  if (value !== "today" && value !== "7days") return undefined;
  const from = new Date(now);
  from.setHours(0, 0, 0, 0);
  if (value === "7days") from.setDate(from.getDate() - 6);
  const to = new Date(now);
  to.setHours(23, 59, 0, 0);
  return { from, to };
}

function formatLocalDate(date: Date) {
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export const ACCESS_LOG_QUICK_FILTERS: DataTableQuickFilterGroup<any>[] = [
  {
    param: "datePreset",
    label: "Periodo",
    defaultValue: "today",
    allValue: "all",
    clearParamsOnChange: ["date"],
    syncQueryParams: (value, now): Record<string, string | null> => {
      if (value === "all") return { dateFrom: null, dateTo: null };
      const range = getPresetDateRange(value, now);
      return range
        ? { dateFrom: range.from.toISOString(), dateTo: range.to.toISOString() }
        : {};
    },
    options: [
      { value: "today", label: "Hoy" },
      { value: "7days", label: "Últimos 7 días" },
    ],
  },
  {
    param: "status",
    label: "Estado",
    options: [
      { value: "INSIDE", label: "Dentro" },
      { value: "OUTSIDE", label: "Fuera" },
    ],
  },
];

export const ACCESS_LOG_ADVANCED_FILTERS: DataTableAdvancedFilter[] = [
  {
    param: "period",
    fromParam: "dateFrom",
    toParam: "dateTo",
    label: "Periodo de ingreso",
    type: "date-time-range",
    quickFilterParams: ["datePreset"],
  },
  { param: "legalId", label: "Documento", type: "text" },
  { param: "approvedBy", label: "Persona que autoriza", type: "text" },
  { param: "vehicleQuery", label: "Vehículo", type: "text" },
];

function getExpectedDatePreset(value: string, now: Date) {
  if (!["today", "next7days", "next15days"].includes(value)) return undefined;

  const from = new Date(now);
  from.setHours(0, 0, 0, 0);
  const to = new Date(from);
  if (value === "next7days") to.setDate(to.getDate() + 6);
  if (value === "next15days") to.setDate(to.getDate() + 14);
  to.setHours(23, 59, 59, 999);
  return { from, to };
}

const PLANNED_ACCESS_STATUS_QUICK_FILTER: DataTableQuickFilterGroup<any> = {
  param: "status",
  label: "Estado",
  options: [
    { value: "PENDING_APPROVAL", label: "Pendientes" },
    { value: "APPROVED", label: "Aprobadas" },
    { value: "REJECTED", label: "Rechazadas" },
    { value: "CANCELED", label: "Canceladas" },
    { value: "EXPIRED", label: "Expiradas" },
    { value: "PARTIALLY_USED", label: "Parciales" },
    { value: "USED", label: "Utilizadas" },
  ],
};

const PLANNED_ACCESS_DATE_QUICK_FILTER: DataTableQuickFilterGroup<any> = {
  param: "expectedPreset",
  label: "Fecha prevista",
  allValue: "all",
  clearParamsOnChange: ["expectedFrom", "expectedTo"],
  syncQueryParams: (value, now): Record<string, string | null> => {
    if (value === "all") return { expectedFrom: null, expectedTo: null };
    const range = getExpectedDatePreset(value, now);
    return range
      ? {
          expectedFrom: formatLocalDate(range.from),
          expectedTo: formatLocalDate(range.to),
        }
      : {};
  },
  options: [
    { value: "today", label: "Hoy" },
    { value: "next7days", label: "Próximos 7 días" },
    { value: "next15days", label: "Próximos 15 días" },
  ],
};

export const PLANNED_ACCESS_QUICK_FILTERS: DataTableQuickFilterGroup<any>[] = [
  PLANNED_ACCESS_DATE_QUICK_FILTER,
  PLANNED_ACCESS_STATUS_QUICK_FILTER,
];

const REQUESTER_PLANNED_ACCESS_DATE_QUICK_FILTER: DataTableQuickFilterGroup<any> = {
  ...PLANNED_ACCESS_DATE_QUICK_FILTER,
  syncQueryParams: (value, now): Record<string, string | null> => {
    if (value === "all") return { expectedFrom: null, expectedTo: null };
    const range = getExpectedDatePreset(value, now);
    return range
      ? { expectedFrom: range.from.toISOString(), expectedTo: range.to.toISOString() }
      : {};
  },
};

export const REQUESTER_PLANNED_ACCESS_QUICK_FILTERS: DataTableQuickFilterGroup<any>[] = [
  REQUESTER_PLANNED_ACCESS_DATE_QUICK_FILTER,
  PLANNED_ACCESS_STATUS_QUICK_FILTER,
];

export const PLANNED_ACCESS_ADVANCED_FILTERS: DataTableAdvancedFilter[] = [
  {
    param: "expected",
    fromParam: "expectedFrom",
    toParam: "expectedTo",
    label: "Fecha prevista",
    type: "date-range",
    quickFilterParams: ["expectedPreset"],
  },
];

export const REQUESTER_PLANNED_ACCESS_ADVANCED_FILTERS: DataTableAdvancedFilter[] = [
  {
    param: "expected",
    fromParam: "expectedFrom",
    toParam: "expectedTo",
    label: "Fecha prevista",
    type: "date-time-range",
    quickFilterParams: ["expectedPreset"],
  },
  { param: "requestedByQuery", label: "Usuario que creó la solicitud", type: "text" },
  { param: "visitorQuery", label: "Datos del visitante", type: "text" },
  { param: "companyQuery", label: "Empresa", type: "text" },
];

export const USER_QUICK_FILTERS: DataTableQuickFilterGroup<any>[] = [
  {
    param: "active",
    label: "Estado",
    defaultValue: "active",
    allValue: "all",
    options: [
      { value: "active", label: "Activos" },
      { value: "inactive", label: "Inactivos" },
    ],
  },
];

export const AUDIT_LOG_QUICK_FILTERS: DataTableQuickFilterGroup<any>[] = [
  {
    param: "period",
    label: "Fecha del registro",
    clearParamsOnChange: ["auditDateFrom", "auditDateTo", "auditDateSource", "auditDateField"],
    syncQueryParams: (value, now): Record<string, string | null> => {
      const range = getPresetDateRange(value, now);
      return range
        ? {
            auditDateFrom: formatLocalDate(range.from),
            auditDateTo: formatLocalDate(range.to),
            auditDateSource: "record",
            auditDateField: "createdAt",
          }
        : {};
    },
    options: [
      { value: "today", label: "Hoy" },
      { value: "7days", label: "Últimos 7 días" },
    ],
  },
];

const AUDIT_SEARCH_SCOPES = [
  { value: "record", label: "Registro" },
  { value: "metadata", label: "Metadatos" },
];

export const AUDIT_LOG_ADVANCED_FILTERS: DataTableAdvancedFilter[] = [
  {
    param: "auditFieldQuery",
    label: "Buscar por campo",
    type: "text",
    scopeParam: "auditFieldSource",
    scopeLabel: "Buscar en",
    scopeDefaultValue: "record",
    scopeOptions: AUDIT_SEARCH_SCOPES,
    fieldParam: "auditField",
    fieldLabel: "Campo",
    fieldOptionsByScope: {
      record: AUDIT_RECORD_SEARCH_FIELDS.map(({ value, label }) => ({ value, label })),
      metadata: AUDIT_METADATA_SEARCH_FIELDS.map(({ value, label }) => ({ value, label })),
    },
  },
  {
    param: "auditDateRange",
    fromParam: "auditDateFrom",
    toParam: "auditDateTo",
    label: "Filtrar por fecha",
    type: "date-range",
    quickFilterParams: ["period"],
    scopeParam: "auditDateSource",
    scopeLabel: "Fecha de",
    scopeDefaultValue: "record",
    scopeOptions: AUDIT_SEARCH_SCOPES,
    fieldParam: "auditDateField",
    fieldLabel: "Campo de fecha",
    fieldOptionsByScope: {
      record: AUDIT_RECORD_DATE_FIELDS.map(({ value, label }) => ({ value, label })),
      metadata: AUDIT_METADATA_DATE_FIELDS.map(({ value, label }) => ({ value, label })),
    },
  },
];

export const EXTERNAL_WORKER_QUICK_FILTERS: DataTableQuickFilterGroup<any>[] = [
  {
    param: "recent",
    label: "Antigüedad",
    options: [
      { value: "30days", label: "Recientes" },
    ],
  },
];

export function catalogRecentFilter<TData extends { createdAt?: Date | string | null }>(): DataTableQuickFilterGroup<TData>[] {
  return [
    {
      param: "recent",
      label: "Fecha de alta",
      options: [
        {
          value: "30days",
          label: "Recientes",
          predicate: (row) => {
            const createdAt = row.createdAt ? new Date(row.createdAt).getTime() : 0;
            return createdAt >= Date.now() - 30 * 24 * 60 * 60 * 1_000;
          },
        },
      ],
    },
  ];
}
