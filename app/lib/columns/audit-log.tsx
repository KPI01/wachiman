import { createColumnHelper } from "@tanstack/react-table";
import type { AuditLogListItem } from "../database/audit-log.server";
import { formatTimestamp } from "../utils";
import {
  getAuditActionLabel,
  getAuditEntityLabel,
  getAuditSummaryLabel,
} from "../audit-log-presentation";

const auditLogColHelper = createColumnHelper<AuditLogListItem>();

function getChangedByLabel(log: AuditLogListItem) {
  if (log.changedByUsername) return log.changedByUsername;
  if (log.changedBy === "system") return "Sistema";

  const isUserId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(log.changedBy);
  return isUserId ? "Usuario no disponible" : log.changedBy;
}

export const auditLogColumns = [
  auditLogColHelper.accessor("createdAt", {
    header: "Fecha",
    cell: ({ getValue }) =>
      formatTimestamp({ date: getValue(), template: "dd/MM/yyyy HH:mm" }),
  }),
  auditLogColHelper.accessor("entityType", {
    header: "Entidad",
    cell: ({ getValue }) => getAuditEntityLabel(getValue()),
  }),
  auditLogColHelper.accessor("action", {
    header: "Acción",
    cell: ({ getValue }) => getAuditActionLabel(getValue()),
  }),
  auditLogColHelper.accessor("summary", {
    header: "Resumen",
    cell: ({ row, getValue }) =>
      getAuditSummaryLabel(
        getValue(),
        row.original.entityType,
        row.original.action,
      ),
  }),
  auditLogColHelper.accessor((row) => getChangedByLabel(row), {
    id: "changedBy",
    header: "Usuario",
  }),
];
