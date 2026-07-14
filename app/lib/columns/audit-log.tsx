import { createColumnHelper } from "@tanstack/react-table";
import type { AuditLogListItem } from "../database/audit-log.server";
import { formatTimestamp } from "../utils";

const auditLogColHelper = createColumnHelper<AuditLogListItem>();

export const auditLogColumns = [
  auditLogColHelper.accessor("createdAt", {
    header: "Fecha",
    cell: ({ getValue }) =>
      formatTimestamp({ date: getValue(), template: "dd/MM/yyyy HH:mm:ss" }),
  }),
  auditLogColHelper.accessor("entityType", {
    header: "Entidad",
  }),
  auditLogColHelper.accessor("action", {
    header: "Acción",
  }),
  auditLogColHelper.accessor("summary", {
    header: "Resumen",
  }),
  auditLogColHelper.accessor("changedBy", {
    header: "Usuario",
  }),
];
