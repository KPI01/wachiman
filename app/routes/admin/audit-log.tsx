import DataTable from "~/components/ui/data-table";
import { auditLogColumns } from "~/lib/columns/audit-log";
import { validateUserRole } from "~/lib/auth.server";
import { getManyAuditLogs } from "~/lib/services/audit-log.server";
import type { Route } from "./+types/audit-log";
import { Separator } from "~/components/ui/separator";

export async function loader({ request }: Route.LoaderArgs) {
  await validateUserRole(request, ["ADMIN", "SECURITY_MANAGER"]);

  const url = new URL(request.url);
  const entityType = url.searchParams.get("entityType") || undefined;
  const action = url.searchParams.get("action") || undefined;

  const logs = await getManyAuditLogs({ entityType, action });

  return { logs };
}

export default function AuditLogIndex({
  loaderData,
}: Route.ComponentProps) {
  return (
    <div className="flex flex-col gap-y-4">
      <h2 className="text-3xl font-bold">Auditoria</h2>
      <DataTable
        columns={auditLogColumns}
        data={loaderData.logs ?? []}
        globalFilterColumns={["entityType", "action", "summary", "changedBy"]}
      />
    </div>
  );
}
