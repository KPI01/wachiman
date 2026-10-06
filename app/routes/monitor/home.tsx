import DataTable from "~/components/ui/data-table";
import type { Route } from "./+types/home";
import { validateUserRole } from "~/lib/auth.server";
import { getOpenAccessLogs } from "~/lib/services/access-log.server";
import { getAccessLogColumns } from "~/lib/columns/access-log";
import { useMemo } from "react";
import { useAccessLogNotifications } from "~/hooks/use-access-log-notifications";
import { useResolvedValue } from "~/hooks/use-resolved-value";
import type { AccessLogListItem } from "~/lib/database/access-log.server";
import StaleAccessWarning from "~/components/models/access-logs/stale-access-warning";

export async function loader({ request }: Route.LoaderArgs) {
  await validateUserRole(request, "ACCESS_MONITOR");

  const accessLogs = getOpenAccessLogs();

  return { accessLogs };
}

export default function MonitorHome({ loaderData }: Route.ComponentProps) {
  const columns = useMemo(() => getAccessLogColumns("createdBy"), []);
  const [accessLogRows, setAccessLogRows] = useResolvedValue<AccessLogListItem[]>(
    loaderData.accessLogs as unknown as PromiseLike<AccessLogListItem[]>,
    [],
  );
  useAccessLogNotifications(accessLogRows);

  return (
    <div className="grid space-y-6">
      <StaleAccessWarning accessLogs={accessLogRows} />
      <DataTable<AccessLogListItem>
        columns={columns}
        data={loaderData.accessLogs as unknown as PromiseLike<AccessLogListItem[]>}
        refreshDataKey="accessLogs"
        onRowsRefresh={setAccessLogRows}
        showGlobalFilter={false}
        showColumnVisibility={false}
        refreshIntervalMs={5_000}
        empty={{
          title: "No existen registros",
          description:
            "No existen registros de personas que se encuentren, actualmente, dentro de las instalaciones",
        }}
      />
    </div>
  );
}
