import type { DocumentStatus } from "../../../../db/enums";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  DOCUMENT_STATUS_LABELS,
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_RECORD_TYPE_LABELS,
} from "~/lib/models/worker-document";
import { formatTimestamp } from "~/lib/utils";
import type { WorkerDocumentListItem } from "~/lib/database/worker-document.server";
import DeleteWorkerDocumentBtn from "./delete-worker-document-btn";
import ReviewWorkerDocumentBtn from "./review-worker-document-btn";
import UpdateWorkerDocumentBtn from "./update-worker-document-btn";
import { DownloadIcon, ExternalLinkIcon } from "lucide-react";

const STATUS_VARIANT: Record<DocumentStatus, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING_REVIEW: "secondary",
  VALIDATED: "default",
  REJECTED: "destructive",
  EXPIRED: "destructive",
  ARCHIVED: "outline",
};

type WorkerDocumentListProps = {
  documents: WorkerDocumentListItem[];
  workerId: string;
  canReviewDocuments: boolean;
};

export default function WorkerDocumentList({
  documents,
  workerId,
  canReviewDocuments,
}: WorkerDocumentListProps) {
  if (documents.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No hay documentos registrados.
      </p>
    );
  }

  return (
    <div className="rounded-md border">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-3 py-2 text-left font-medium">Tipo</th>
              <th className="px-3 py-2 text-left font-medium">Evidencia</th>
              <th className="px-3 py-2 text-left font-medium">Estado</th>
              <th className="px-3 py-2 text-left font-medium">Archivo</th>
              <th className="px-3 py-2 text-left font-medium">Vigencia</th>
              <th className="px-3 py-2 text-left font-medium">Seguimiento</th>
              <th className="px-3 py-2 text-left font-medium">Notas</th>
              <th className="px-3 py-2 text-right font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr key={doc.id} className="border-b">
                <td className="px-3 py-2 font-medium">
                  {DOCUMENT_TYPE_LABELS[doc.documentType]}
                </td>
                <td className="px-3 py-2">
                  {DOCUMENT_RECORD_TYPE_LABELS[doc.recordType]}
                </td>
                <td className="px-3 py-2">
                  <Badge variant={STATUS_VARIANT[doc.status]}>
                    {DOCUMENT_STATUS_LABELS[doc.status]}
                  </Badge>
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground">
                  {doc.refresherDueAt
                    ? `Reciclaje: ${formatTimestamp({ date: doc.refresherDueAt, template: "dd/MM/yyyy" })}`
                    : doc.reviewDueAt
                      ? `Revision: ${formatTimestamp({ date: doc.reviewDueAt, template: "dd/MM/yyyy" })}`
                      : "-"}
                </td>
                <td className="px-3 py-2">
                  <a
                    href={`/api/external-workers/${workerId}/documents/${doc.id}/file`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    {doc.fileName}
                    <ExternalLinkIcon className="size-3" />
                  </a>
                </td>
                <td className="px-3 py-2">
                  {doc.validUntil
                    ? formatTimestamp({
                        date: doc.validUntil,
                        template: "dd/MM/yyyy",
                      })
                    : "Sin vencimiento"}
                </td>
                <td className="px-3 py-2 text-muted-foreground max-w-48 truncate">
                  {doc.notes || "-"}
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" asChild>
                      <a
                        href={`/api/external-workers/${workerId}/documents/${doc.id}/file`}
                        download={doc.fileName}
                      >
                        <DownloadIcon />
                      </a>
                    </Button>
                    {doc.status === "PENDING_REVIEW" ? (
                      <UpdateWorkerDocumentBtn
                        document={doc}
                        workerId={workerId}
                      />
                    ) : null}
                    {canReviewDocuments && doc.status === "PENDING_REVIEW" ? (
                      <ReviewWorkerDocumentBtn
                        document={doc}
                        workerId={workerId}
                      />
                    ) : null}
                    {canReviewDocuments && doc.status !== "ARCHIVED" ? (
                      <DeleteWorkerDocumentBtn
                        documentId={doc.id}
                        workerId={workerId}
                      />
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
