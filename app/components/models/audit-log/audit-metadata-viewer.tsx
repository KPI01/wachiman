import { ClipboardIcon, EyeIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import TableActionButton from "~/components/table-action-button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";
import type { AuditLogListItem } from "~/lib/database/audit-log.server";
import { formatTimestamp } from "~/lib/utils";

function MetadataValue({ value }: { value: unknown }) {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground">—</span>;
  }

  if (Array.isArray(value)) {
    return (
      <div className="flex min-w-0 flex-col gap-2 border-l pl-2 sm:pl-3">
        {value.map((item, index) => (
          <div key={index} className="flex min-w-0 flex-col gap-1">
            <span className="text-xs text-muted-foreground">[{index}]</span>
            <MetadataValue value={item} />
          </div>
        ))}
      </div>
    );
  }

  if (typeof value === "object") {
    return (
      <div className="flex min-w-0 flex-col gap-2 border-l pl-2 sm:pl-3">
        {Object.entries(value as Record<string, unknown>).map(([key, item]) => (
          <div
            key={key}
            className="grid min-w-0 grid-cols-1 gap-1 sm:grid-cols-[minmax(7rem,9rem)_minmax(0,1fr)] sm:gap-3"
          >
            <span className="min-w-0 break-words font-medium text-muted-foreground">
              {key}
            </span>
            <div className="min-w-0">
              <MetadataValue value={item} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return <span className="min-w-0 break-words">{String(value)}</span>;
}

export default function AuditMetadataViewer({
  log,
}: {
  log: AuditLogListItem;
}) {
  const [open, setOpen] = useState(false);
  const json = JSON.stringify(log.metadata ?? {}, null, 2);

  async function copyMetadata() {
    try {
      await navigator.clipboard.writeText(json);
      toast.success("Metadatos copiados");
    } catch {
      toast.error("No se pudieron copiar los metadatos");
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <TableActionButton
          label="Ver metadatos"
          icon={EyeIcon}
          variant="ghost"
        />
      </SheetTrigger>
      <SheetContent className="min-w-0 overflow-hidden data-[side=right]:w-full data-[side=right]:sm:max-w-2xl">
        <SheetHeader className="shrink-0 pr-12">
          <SheetTitle>Metadatos de auditoría</SheetTitle>
          <SheetDescription className="break-words">
            {log.entityType} · {log.action} · {formatTimestamp({ date: log.createdAt, template: "dd/MM/yyyy HH:mm:ss" })}
          </SheetDescription>
        </SheetHeader>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4">
          <div className="flex shrink-0 justify-end">
            <Button variant="outline" size="sm" type="button" onClick={copyMetadata}>
              <ClipboardIcon data-icon="inline-start" /> Copiar JSON
            </Button>
          </div>
          {log.metadata ? (
            <div className="flex min-w-0 flex-col gap-3 overflow-hidden rounded-md border p-3 text-sm">
              <MetadataValue value={log.metadata} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Este registro no tiene metadatos.</p>
          )}
          <details className="min-w-0 rounded-md border p-3">
            <summary className="cursor-pointer text-sm font-medium">Ver JSON sin formato</summary>
            <pre className="mt-3 max-h-96 max-w-full overflow-auto whitespace-pre text-xs text-muted-foreground">{json}</pre>
          </details>
        </div>
      </SheetContent>
    </Sheet>
  );
}
