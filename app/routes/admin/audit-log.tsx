import DataTable from "~/components/ui/data-table";
import { auditLogColumns } from "~/lib/columns/audit-log";
import { validateUserRole } from "~/lib/auth.server";
import { getManyAuditLogs } from "~/lib/services/audit-log.server";
import type { Route } from "./+types/audit-log";
import {
  AUDIT_LOG_ADVANCED_FILTERS,
  AUDIT_LOG_QUICK_FILTERS,
} from "~/components/ui/table-filter-presets";
import { getAuditLogTableFilters } from "~/lib/table-query.server";
import { useState } from "react";
import AuditMetadataViewer from "~/components/models/audit-log/audit-metadata-viewer";

export async function loader({ request }: Route.LoaderArgs) {
  await validateUserRole(request, ["ADMIN", "SECURITY_MANAGER"]);

  const url = new URL(request.url);
  const entityType = url.searchParams.get("entityType") || undefined;
  const action = url.searchParams.get("action") || undefined;

  const logs = getManyAuditLogs({
    entityType,
    action,
    ...getAuditLogTableFilters(request),
  });

  return { logs };
}

export default function AuditLogIndex({
  loaderData,
}: Route.ComponentProps) {
  const logs = loaderData.logs ?? [];
  type AuditLogRow = Awaited<ReturnType<typeof getManyAuditLogs>>[number];
  const [selectedLog, setSelectedLog] = useState<AuditLogRow | null>(null);

  return (
    <div className="flex flex-col gap-y-4">
      <h2 className="text-3xl font-bold">Auditoria</h2>
      <DataTable
        columns={auditLogColumns}
        data={logs}
        refreshDataKey="logs"
        globalFilterColumns={["entityType", "action", "summary", "changedBy"]}
        filterPlaceholder="Buscar en registros y metadatos: fechas, IDs, DNI, nombres..."
        quickFilters={AUDIT_LOG_QUICK_FILTERS}
        advancedFilters={AUDIT_LOG_ADVANCED_FILTERS}
        serverFiltering
        onRowClick={setSelectedLog}
        getRowLabel={(log) => `Abrir detalle de auditoría: ${log.summary}`}
      />
      {selectedLog ? (
        <AuditMetadataViewer
          log={selectedLog}
          open
          onOpenChange={(open) => {
            if (!open) setSelectedLog(null);
          }}
          showTrigger={false}
        />
      ) : null}
    </div>
  );
}
