import type { PlannedAccessStatus } from "../../db/enums";
import { parseLocalDate, parseLocalDateTime } from "./utils";
import {
  AUDIT_METADATA_DATE_FIELDS,
  AUDIT_METADATA_SEARCH_FIELDS,
  AUDIT_RECORD_DATE_FIELDS,
  AUDIT_RECORD_SEARCH_FIELDS,
} from "./audit-log-search";

export function isTableOnlyDataRequest(request: Request) {
  return new URL(request.url).searchParams.get("__tableOnly") === "1";
}

const plannedStatuses = new Set<PlannedAccessStatus>([
  "PENDING_APPROVAL",
  "APPROVED",
  "PARTIALLY_USED",
  "USED",
  "REJECTED",
  "CANCELED",
  "EXPIRED",
]);

export function getPlannedAccessTableFilters(request: Request) {
  const url = new URL(request.url);
  const statusValue = url.searchParams.get("status") as PlannedAccessStatus | null;
  const expectedFromValue = url.searchParams.get("expectedFrom");
  const expectedToValue = url.searchParams.get("expectedTo");
  const expectedFrom = expectedFromValue ? parseLocalDateTime(expectedFromValue) : undefined;
  const expectedTo = expectedToValue ? parseLocalDateTime(expectedToValue, true) : undefined;

  return {
    ...(statusValue && plannedStatuses.has(statusValue) ? { status: statusValue } : {}),
    siteId: url.searchParams.get("siteId") || undefined,
    query: url.searchParams.get("q")?.trim() || undefined,
    requestedByQuery: url.searchParams.get("requestedByQuery")?.trim() || undefined,
    visitorQuery: url.searchParams.get("visitorQuery")?.trim() || undefined,
    companyQuery: url.searchParams.get("companyQuery")?.trim() || undefined,
    expectedFrom,
    expectedTo,
  };
}

export function getAuditLogTableFilters(request: Request) {
  const url = new URL(request.url);
  const hasExplicitAuditDateRange = Boolean(
    url.searchParams.get("auditDateFrom") || url.searchParams.get("auditDateTo"),
  );
  const period = hasExplicitAuditDateRange ? null : url.searchParams.get("period");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const from = period === "today"
    ? today
    : period === "7days"
      ? new Date(today.getTime() - 6 * 24 * 60 * 60 * 1_000)
      : undefined;

  const dateFromValue = getDateFilterValue(url.searchParams.get("auditDateFrom"));
  const dateToValue = getDateFilterValue(url.searchParams.get("auditDateTo"));
  const requestedDateSource = url.searchParams.get("auditDateSource");
  const dateSource: "record" | "metadata" = requestedDateSource === "metadata" ? "metadata" : "record";
  const dateField = url.searchParams.get("auditDateField") ??
    (dateSource === "record" ? "createdAt" : "all");
  const dateFields = dateSource === "record"
    ? AUDIT_RECORD_DATE_FIELDS
    : AUDIT_METADATA_DATE_FIELDS;
  const hasValidDateField = dateFields.some((field) => field.value === dateField);

  const requestedFieldSource = url.searchParams.get("auditFieldSource");
  const fieldSource: "record" | "metadata" = requestedFieldSource === "metadata" ? "metadata" : "record";
  const fieldName = url.searchParams.get("auditField") ??
    (fieldSource === "record" ? "id" : "all");
  const searchFields = fieldSource === "record"
    ? AUDIT_RECORD_SEARCH_FIELDS
    : AUDIT_METADATA_SEARCH_FIELDS;
  const hasValidSearchField = searchFields.some((field) => field.value === fieldName);
  const fieldQuery = url.searchParams.get("auditFieldQuery")?.trim();

  const auditDate = hasValidDateField && (dateFromValue || dateToValue)
    ? {
        source: dateSource,
        field: dateField,
        from: dateFromValue ? parseLocalDate(dateFromValue) : undefined,
        to: dateToValue ? getLocalDateEnd(dateToValue) : undefined,
        fromValue: dateFromValue,
        toValue: dateToValue,
      }
    : undefined;

  const fieldSearch = fieldQuery && hasValidSearchField
    ? { source: fieldSource, field: fieldName, value: fieldQuery }
    : undefined;

  return {
    from,
    to: from ? new Date() : undefined,
    query: url.searchParams.get("q")?.trim() || undefined,
    auditDate,
    fieldSearch,
  };
}

function getDateFilterValue(value: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    ? value
    : undefined;
}

function getLocalDateEnd(value: string) {
  const date = parseLocalDate(value);
  date.setHours(23, 59, 59, 999);
  return date;
}
