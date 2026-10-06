import { useState } from "react";
import type { ReactNode } from "react";
import { ClipboardIcon, EyeIcon } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import TableActionButton from "~/components/table-action-button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import type { AuditLogListItem } from "~/lib/database/audit-log.server";
import { formatTimestamp } from "~/lib/utils";
import {
  getAuditActionLabel,
  getAuditEntityLabel,
  getAuditSummaryLabel,
} from "~/lib/audit-log-presentation";

type Metadata = Record<string, unknown>;
type ChangeKind = "added" | "removed" | "updated";
type AuditChange = {
  path: string[];
  kind: ChangeKind;
  before?: unknown;
  after?: unknown;
};
type ComparisonMode = "created" | "deleted" | "partial" | "updated";
type AuditComparison = {
  before: unknown;
  after: unknown;
  mode: ComparisonMode;
};

const FIELD_LABELS: Record<string, string> = {
  actorName: "Usuario",
  allowedAreaId: "Área autorizada (ID)",
  companyId: "Empresa (ID)",
  companySnapshot: "Empresa",
  contentHash: "Huella del archivo",
  decision: "Decisión",
  decisionReason: "Motivo de la decisión",
  earlyArrivalToleranceMinutes: "Antelación permitida (minutos)",
  evidence: "Evidencias",
  evidenceSnapshot: "Evidencias registradas",
  firstName: "Nombre",
  expectedEndDatetime: "Fin previsto",
  expectedStartDatetime: "Inicio previsto",
  expiryBasis: "Criterio de vencimiento",
  externalWorkerId: "Trabajador externo (ID)",
  fileName: "Nombre del archivo",
  firstNameSnapshot: "Nombre",
  holderFiscalAddress: "Dirección fiscal",
  holderLegalName: "Razón social",
  holderTaxId: "Identificación fiscal",
  lastNameSnapshot: "Apellidos",
  legalIdSnapshot: "Documento de identidad",
  legalId: "Documento de identidad",
  lastName: "Apellidos",
  middleName: "Segundo nombre",
  middleNameSnapshot: "Segundo nombre",
  notes: "Notas",
  persons: "Visitantes",
  phoneNumber: "Teléfono",
  reason: "Motivo",
  recordType: "Tipo de registro",
  secondLastNameSnapshot: "Segundo apellido",
  secondLastName: "Segundo apellido",
  selfApproval: "Solicitud propia",
  siteId: "Centro (ID)",
  status: "Estado",
  validUntil: "Fecha de vencimiento",
  visitReason: "Motivo de la visita",
  workCategoryId: "Tipo de trabajo (ID)",
};

const KIND_LABELS: Record<ChangeKind, string> = {
  added: "Añadido",
  removed: "Eliminado",
  updated: "Modificado",
};

const KIND_STYLES: Record<ChangeKind, string> = {
  added:
    "border-emerald-200 bg-emerald-50/70 dark:border-emerald-900 dark:bg-emerald-950/35",
  removed:
    "border-rose-200 bg-rose-50/70 dark:border-rose-900 dark:bg-rose-950/35",
  updated: "border-primary/20 bg-primary/5",
};

function isRecord(value: unknown): value is Metadata {
  return typeof value === "object" && value !== null && !Array.isArray(value) && !(value instanceof Date);
}

function isDeepEqual(first: unknown, second: unknown) {
  return JSON.stringify(first) === JSON.stringify(second);
}

function getFieldLabel(key: string) {
  const knownLabel = FIELD_LABELS[key];
  if (knownLabel) return knownLabel;

  const words = key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
    .toLocaleLowerCase("es-ES");
  return words ? words.charAt(0).toLocaleUpperCase("es-ES") + words.slice(1) : key;
}

function getRecordLabel(value: Metadata, index: number) {
  const personName = [
    value.firstNameSnapshot,
    value.middleNameSnapshot,
    value.lastNameSnapshot,
    value.secondLastNameSnapshot,
  ]
    .filter((part): part is string => typeof part === "string" && Boolean(part))
    .join(" ");

  if (personName) return `Visitante: ${personName}`;
  if (typeof value.name === "string") return value.name;
  if (typeof value.fileName === "string") return value.fileName;
  return `Elemento ${index + 1}`;
}

function getArrayChanges(
  before: unknown[],
  after: unknown[],
  path: string[],
): AuditChange[] {
  const hasIds = [...before, ...after].every(
    (item) => isRecord(item) && (typeof item.id === "string" || typeof item.id === "number"),
  );

  if (!hasIds) {
    return [
      {
        path,
        kind: before.length === 0 ? "added" : after.length === 0 ? "removed" : "updated",
        before,
        after,
      },
    ];
  }

  const beforeById = new Map(
    before.map((item) => [(item as Metadata).id, item as Metadata]),
  );
  const afterById = new Map(
    after.map((item) => [(item as Metadata).id, item as Metadata]),
  );
  const allIds = [...new Set([...beforeById.keys(), ...afterById.keys()])];

  return allIds.flatMap((id, index) => {
    const previous = beforeById.get(id);
    const current = afterById.get(id);
    const label = getRecordLabel(current ?? previous!, index);
    const itemPath = [...path, label];

    if (!previous) {
      return [{ path: itemPath, kind: "added", after: current }];
    }
    if (!current) {
      return [{ path: itemPath, kind: "removed", before: previous }];
    }

    return getObjectChanges(previous, current, itemPath).filter(
      (change) => change.path.at(-1) !== "id",
    );
  });
}

function getObjectChanges(
  before: Metadata,
  after: Metadata,
  path: string[] = [],
): AuditChange[] {
  const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])];

  return keys.flatMap((key) => {
    if (key === "id") return [];
    return getValueChanges(
      before[key],
      after[key],
      [...path, getFieldLabel(key)],
    );
  });
}

function getPartialChanges(
  before: unknown,
  changes: unknown,
  path: string[] = [],
): AuditChange[] {
  if (isRecord(changes)) {
    const previous = isRecord(before) ? before : {};
    return Object.entries(changes).flatMap(([key, value]) =>
      getPartialChanges(previous[key], value, [...path, getFieldLabel(key)]),
    );
  }

  if (Array.isArray(changes) && Array.isArray(before)) {
    return getArrayChanges(before, changes, path);
  }

  if (isDeepEqual(before, changes)) return [];
  return [
    {
      path,
      kind: before === undefined ? "added" : "updated",
      before,
      after: changes,
    },
  ];
}

function getValueChanges(
  before: unknown,
  after: unknown,
  path: string[],
): AuditChange[] {
  if (isDeepEqual(before, after)) return [];

  if (isRecord(before) && isRecord(after)) {
    return getObjectChanges(before, after, path);
  }

  if (Array.isArray(before) && Array.isArray(after)) {
    return getArrayChanges(before, after, path);
  }

  if (before === undefined) return [{ path, kind: "added", after }];
  if (after === undefined) return [{ path, kind: "removed", before }];
  return [{ path, kind: "updated", before, after }];
}

function getAddedChanges(value: unknown, path: string[] = []): AuditChange[] {
  if (isRecord(value)) {
    const entries = Object.entries(value).filter(([key]) => key !== "id");
    return entries.length
      ? entries.flatMap(([key, item]) => getAddedChanges(item, [...path, getFieldLabel(key)]))
      : [{ path, kind: "added", after: value }];
  }
  if (Array.isArray(value)) {
    return getArrayChanges([], value, path);
  }
  return [{ path, kind: "added", after: value }];
}

function getRemovedChanges(value: unknown, path: string[] = []): AuditChange[] {
  if (isRecord(value)) {
    const entries = Object.entries(value).filter(([key]) => key !== "id");
    return entries.length
      ? entries.flatMap(([key, item]) => getRemovedChanges(item, [...path, getFieldLabel(key)]))
      : [{ path, kind: "removed", before: value }];
  }
  if (Array.isArray(value)) {
    return getArrayChanges(value, [], path);
  }
  return [{ path, kind: "removed", before: value }];
}

function getAuditComparison(metadata: Metadata, action: string): AuditComparison | null {
  const normalizedAction = action.toUpperCase();
  const nextStatus = normalizedAction === "PLANNED_ACCESS_APPROVED"
    ? "APPROVED"
    : normalizedAction === "PLANNED_ACCESS_REJECTED"
      ? "REJECTED"
      : normalizedAction === "PLANNED_ACCESS_CANCELED"
        ? "CANCELED"
        : null;

  if (nextStatus) {
    const previousStatus = metadata.previousStatus ?? "PENDING_APPROVAL";
    return {
      before: { status: previousStatus },
      after: {
        status: nextStatus,
        ...(typeof metadata.reason === "string" ? { reason: metadata.reason } : {}),
      },
      mode: "updated",
    };
  }

  const beforeKey = Object.hasOwn(metadata, "before")
    ? "before"
    : Object.hasOwn(metadata, "previous")
      ? "previous"
      : null;

  if (!beforeKey) {
    const isCreation =
      normalizedAction === "CREATE" ||
      normalizedAction.endsWith("_CREATED") ||
      normalizedAction === "DOCUMENT_UPLOADED";
    if (!isCreation || metadata.demo === true) return null;

    const createdData = isRecord(metadata.data)
      ? metadata.data
      : Object.fromEntries(
          Object.entries(metadata).filter(
            ([key]) => !["actorName", "demo", "sequence"].includes(key),
          ),
        );
    return Object.keys(createdData).length
      ? { before: null, after: createdData, mode: "created" }
      : null;
  }

  const before = metadata[beforeKey];
  const afterKey = Object.hasOwn(metadata, "after")
    ? "after"
    : Object.hasOwn(metadata, "updated")
      ? "updated"
      : null;

  if (afterKey) {
    return { before, after: metadata[afterKey], mode: "updated" };
  }

  if (Object.hasOwn(metadata, "changes")) {
    return {
      before,
      after: mergeChanges(before, metadata.changes),
      mode: "partial",
    };
  }

  if (action.toUpperCase() === "DELETE") {
    return { before, after: null, mode: "deleted" };
  }
  return null;
}

function mergeChanges(before: unknown, changes: unknown): unknown {
  if (!isRecord(changes)) return changes;
  const previous = isRecord(before) ? before : {};
  return Object.fromEntries(
    Object.entries(changes).map(([key, value]) => [
      key,
      isRecord(value) && isRecord(previous[key])
        ? mergeChanges(previous[key], value)
        : value,
    ]),
  );
}

function getDisplayValue(value: unknown): string {
  if (value === undefined || value === null || value === "") return "Sin valor";
  if (typeof value === "boolean") return value ? "Sí" : "No";
  if (value instanceof Date) {
    return formatTimestamp({ date: value, template: "dd/MM/yyyy HH:mm:ss" });
  }
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return formatTimestamp({ date, template: "dd/MM/yyyy HH:mm:ss" });
    }
  }
  if (Array.isArray(value)) {
    return `${value.length} ${value.length === 1 ? "elemento" : "elementos"}`;
  }
  if (isRecord(value)) {
    const label = getRecordLabel(value, 0);
    return label.startsWith("Elemento ")
      ? `${Object.keys(value).length} campos`
      : label;
  }
  return String(value);
}

function ValuePanel({
  title,
  value,
  tone,
}: {
  title: string;
  value: unknown;
  tone: "removed" | "added";
}) {
  const styles = tone === "removed"
    ? "border-rose-200 bg-rose-50/70 dark:border-rose-900 dark:bg-rose-950/35"
    : "border-emerald-200 bg-emerald-50/70 dark:border-emerald-900 dark:bg-emerald-950/35";

  return (
    <div className={`min-w-0 rounded-md border px-3 py-2 ${styles}`}>
      <p className="mb-1 text-xs font-medium text-muted-foreground">{title}</p>
      <p className={tone === "removed" ? "break-words line-through decoration-destructive/60" : "break-words"}>
        {getDisplayValue(value)}
      </p>
    </div>
  );
}

function ChangeCard({ change }: { change: AuditChange }) {
  const heading = change.path.filter(Boolean).join(" · ") || "Datos del registro";

  return (
    <article className={`min-w-0 space-y-3 rounded-lg border p-3 ${KIND_STYLES[change.kind]}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="min-w-0 break-words text-sm font-medium">{heading}</h4>
        <Badge variant="outline">{KIND_LABELS[change.kind]}</Badge>
      </div>
      {change.kind === "updated" ? (
        <div className="grid min-w-0 gap-2 sm:grid-cols-2">
          <ValuePanel title="Antes" value={change.before} tone="removed" />
          <ValuePanel title="Después" value={change.after} tone="added" />
        </div>
      ) : (
        <ValuePanel
          title={change.kind === "added" ? "Valor añadido" : "Valor eliminado"}
          value={change.kind === "added" ? change.after : change.before}
          tone={change.kind}
        />
      )}
    </article>
  );
}

function MetadataRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(7.5rem,0.35fr)_minmax(0,1fr)] border-b last:border-b-0">
      <dt className="bg-muted/40 px-3 py-2 text-sm font-medium">{label}</dt>
      <dd className="min-w-0 break-words px-3 py-2 text-sm">{children || "—"}</dd>
    </div>
  );
}

function JsonPanel({ title, value, tone }: { title: string; value: unknown; tone?: "removed" | "added" }) {
  const styles = tone === "removed"
    ? "border-rose-200 bg-rose-50/50 dark:border-rose-900 dark:bg-rose-950/25"
    : tone === "added"
      ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/25"
      : "border-border bg-muted/20";

  return (
    <div className={`min-w-0 overflow-hidden rounded-md border ${styles}`}>
      <h4 className="border-b px-3 py-2 text-xs font-medium">{title}</h4>
      <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words p-3 font-mono text-xs">
        {JSON.stringify(value ?? null, null, 2)}
      </pre>
    </div>
  );
}

export default function AuditMetadataViewer({
  log,
  open,
  onOpenChange,
  showTrigger = true,
}: {
  log: AuditLogListItem;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
}) {
  const [localOpen, setLocalOpen] = useState(false);
  const isOpen = open ?? localOpen;
  const setIsOpen = onOpenChange ?? setLocalOpen;
  const metadata = log.metadata ?? {};
  const json = JSON.stringify(metadata, null, 2);
  const comparison = getAuditComparison(metadata, log.action);
  const changes = comparison
    ? comparison.mode === "partial"
      ? getPartialChanges(comparison.before, metadata.changes)
      : comparison.mode === "created"
        ? getAddedChanges(comparison.after)
        : comparison.mode === "deleted"
          ? getRemovedChanges(comparison.before)
          : getValueChanges(comparison.before, comparison.after, [])
    : [];
  const actorName = metadata.actorName;
  const actor = typeof actorName === "string" ? actorName : log.changedBy;
  const summary = getAuditSummaryLabel(log.summary, log.entityType, log.action);

  async function copyMetadata() {
    try {
      await navigator.clipboard.writeText(json);
      toast.success("Metadatos copiados");
    } catch {
      toast.error("No se pudieron copiar los metadatos");
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {showTrigger ? (
        <DialogTrigger asChild>
          <TableActionButton
            label="Ver detalles de auditoría"
            icon={EyeIcon}
            variant="ghost"
          />
        </DialogTrigger>
      ) : null}
      <DialogContent className="w-[calc(100vw-2rem)] max-w-4xl gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 gap-2 border-b px-6 py-5 pr-14">
          <DialogTitle className="text-xl">Detalle de auditoría</DialogTitle>
          <DialogDescription>
            Información del evento y cambios registrados.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 min-w-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
          <section className="space-y-3">
            <h3 className="text-sm font-semibold">Información del registro</h3>
            <dl className="overflow-hidden rounded-lg border">
              <MetadataRow label="Fecha">
                {formatTimestamp({ date: log.createdAt, template: "dd/MM/yyyy HH:mm:ss" })}
              </MetadataRow>
              <MetadataRow label="Acción">{getAuditActionLabel(log.action)}</MetadataRow>
              <MetadataRow label="Usuario">{actor}</MetadataRow>
              <MetadataRow label="Entidad">{getAuditEntityLabel(log.entityType)}</MetadataRow>
              <MetadataRow label="ID del registro">{log.entityId}</MetadataRow>
              <MetadataRow label="Resumen">{summary}</MetadataRow>
            </dl>
          </section>

          <section className="space-y-3 border-t pt-5">
            <div>
              <h3 className="text-sm font-semibold">Cambios realizados</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Diferencias entre los valores anteriores y los nuevos.
              </p>
            </div>
            {changes.length ? (
              <div className="space-y-3">
                {changes.map((change, index) => (
                  <ChangeCard
                    key={`${change.path.join("-")}-${index}`}
                    change={change}
                  />
                ))}
              </div>
            ) : (
              <p className="rounded-lg border border-dashed px-4 py-5 text-sm text-muted-foreground">
                Este evento no incluye una comparación entre valores anteriores y nuevos.
              </p>
            )}
          </section>

          <section className="space-y-3 border-t pt-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold">JSON del registro</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Datos originales del evento para una revisión detallada.
                </p>
              </div>
              <Button variant="outline" size="sm" type="button" onClick={copyMetadata}>
                <ClipboardIcon data-icon="inline-start" /> Copiar JSON
              </Button>
            </div>
            {comparison ? (
              <div className="grid min-w-0 gap-3 lg:grid-cols-2">
                <JsonPanel title="Antes" value={comparison.before} tone="removed" />
                <JsonPanel title="Después" value={comparison.after} tone="added" />
              </div>
            ) : (
              <JsonPanel title="Metadatos completos" value={metadata} />
            )}
            <details className="min-w-0 rounded-md border">
              <summary className="cursor-pointer px-3 py-2 text-sm font-medium">
                Ver JSON completo del evento
              </summary>
              <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words border-t p-3 font-mono text-xs">
                {json}
              </pre>
            </details>
          </section>
        </div>
        <div className="flex shrink-0 justify-end border-t bg-background px-6 py-4">
          <DialogClose asChild>
            <Button type="button" variant="outline">Cerrar</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
