import { createColumnHelper } from "@tanstack/react-table";
import type { DocumentStatus } from "../../../db/enums";
import { Badge } from "~/components/ui/badge";
import {
  DOCUMENT_STATUS_LABELS,
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_RECORD_TYPE_LABELS,
} from "~/lib/models/worker-document";
import { formatTimestamp } from "~/lib/utils";
import type { WorkerDocumentWithWorker } from "~/lib/database/worker-document.server";
import { ExternalLinkIcon } from "lucide-react";

const colHelper = createColumnHelper<WorkerDocumentWithWorker>();

const STATUS_VARIANT: Record<DocumentStatus, "default" | "destructive" | "outline"> = {
  PENDING_REVIEW: "outline",
  VALIDATED: "default",
  REJECTED: "destructive",
  EXPIRED: "destructive",
  ARCHIVED: "outline",
};

export const workerDocumentColumns = () => [
  colHelper.accessor("externalWorker.lastName", {
    header: "Trabajador",
    cell: ({ row }) => (
      <span>
        {row.original.externalWorker.firstName}{" "}
        {row.original.externalWorker.lastName}
      </span>
    ),
  }),
  colHelper.accessor("externalWorker.legalId", {
    header: "DNI/NIE",
  }),
  colHelper.accessor("externalWorker.company.name", {
    id: "companyName",
    header: "Empresa",
  }),
  colHelper.accessor("documentType", {
    header: "Tipo",
    cell: ({ getValue }) => DOCUMENT_TYPE_LABELS[getValue()],
  }),
  colHelper.accessor("recordType", {
    header: "Evidencia",
    cell: ({ getValue }) => DOCUMENT_RECORD_TYPE_LABELS[getValue()],
  }),
  colHelper.accessor("status", {
    header: "Estado",
    cell: ({ getValue }) => {
      const status = getValue();
      return (
        <Badge variant={STATUS_VARIANT[status]}>
          {DOCUMENT_STATUS_LABELS[status]}
        </Badge>
      );
    },
  }),
  colHelper.accessor("validUntil", {
    header: "Vigencia",
    cell: ({ getValue }) => {
      const validUntil = getValue();
      return validUntil
        ? formatTimestamp({ date: validUntil, template: "dd/MM/yyyy" })
        : "Sin vencimiento";
    },
  }),
  colHelper.accessor("fileName", {
    header: "Archivo",
    cell: ({ row, getValue }) => (
      <a
        href={`/api/external-workers/${row.original.externalWorkerId}/documents/${row.original.id}/file`}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 text-primary hover:underline max-w-48 truncate"
      >
        {getValue()}
        <ExternalLinkIcon className="size-3 shrink-0" />
      </a>
    ),
  }),
  colHelper.accessor("notes", {
    header: "Notas",
    cell: ({ getValue }) => getValue() || "-",
  }),
  colHelper.accessor("createdAt", {
    header: "Subido",
    cell: ({ getValue }) =>
      formatTimestamp({ date: getValue(), template: "dd/MM/yyyy HH:mm" }),
  }),
];
