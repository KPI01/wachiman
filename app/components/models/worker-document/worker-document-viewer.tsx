import { FileSearchIcon, ExternalLinkIcon, DownloadIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";
import type { WorkerDocumentListItem } from "~/lib/database/worker-document.server";
import {
  DOCUMENT_STATUS_LABELS,
  DOCUMENT_TYPE_LABELS,
} from "~/lib/models/worker-document";
import { formatTimestamp } from "~/lib/utils";

const STATUS_VARIANT = {
  PENDING_REVIEW: "secondary",
  VALIDATED: "default",
  REJECTED: "destructive",
  EXPIRED: "destructive",
  ARCHIVED: "outline",
} as const;

export default function WorkerDocumentViewer({
  workerId,
}: {
  workerId: string;
}) {
  const [open, setOpen] = useState(false);
  const [documents, setDocuments] = useState<WorkerDocumentListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDocuments(null);
    setError(null);
  }, [workerId]);

  useEffect(() => {
    if (!open || documents !== null) return;

    let cancelled = false;
    setError(null);
    fetch(`/api/external-workers/${workerId}/documents`)
      .then(async (response) => {
        if (!response.ok) throw new Error("No se pudo cargar la documentación.");
        return (await response.json()) as WorkerDocumentListItem[];
      })
      .then((data) => {
        if (!cancelled) setDocuments(data);
      })
      .catch((reason: unknown) => {
        if (!cancelled) {
          setError(reason instanceof Error ? reason.message : "No se pudo cargar la documentación.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [documents, open, workerId]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <FileSearchIcon data-icon="inline-start" />
          Ver documentación
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Documentación del trabajador</SheetTitle>
          <SheetDescription>
            Consulta los documentos registrados sin modificar su estado.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-3 px-4 pb-4">
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {documents === null && !error ? (
            <p className="text-sm text-muted-foreground">Cargando documentación…</p>
          ) : documents?.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay documentos registrados.</p>
          ) : (
            documents?.map((document) => (
              <div key={document.id} className="flex flex-col gap-2 rounded-md border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">{DOCUMENT_TYPE_LABELS[document.documentType]}</span>
                  <Badge variant={STATUS_VARIANT[document.status]}>
                    {DOCUMENT_STATUS_LABELS[document.status]}
                  </Badge>
                </div>
                <dl className="grid gap-1 text-sm text-muted-foreground">
                  <div className="flex justify-between gap-3">
                    <dt>Archivo</dt><dd className="truncate text-right">{document.fileName}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt>Vigencia</dt>
                    <dd>{document.validUntil ? formatTimestamp({ date: document.validUntil, template: "dd/MM/yyyy" }) : "Sin vencimiento"}</dd>
                  </div>
                </dl>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <a href={`/api/external-workers/${workerId}/documents/${document.id}/file`} target="_blank" rel="noreferrer">
                      <ExternalLinkIcon data-icon="inline-start" /> Visualizar
                    </a>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <a href={`/api/external-workers/${workerId}/documents/${document.id}/file?download=1`} download={document.fileName}>
                      <DownloadIcon data-icon="inline-start" /> Descargar
                    </a>
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
