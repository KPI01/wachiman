import { createColumnHelper } from "@tanstack/react-table";
import type { AuditLogListItem } from "../database/audit-log.server";
import { formatTimestamp } from "../utils";
import AuditMetadataViewer from "~/components/models/audit-log/audit-metadata-viewer";

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
  auditLogColHelper.display({
    id: "metadata",
    header: "Metadatos",
    enableHiding: false,
    cell: ({ row }) => <AuditMetadataViewer log={row.original} />,
  }),
];
