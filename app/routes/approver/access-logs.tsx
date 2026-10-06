import { useMemo } from "react";
import { useResolvedValue } from "~/hooks/use-resolved-value";
import type { AccessLogListItem } from "~/lib/database/access-log.server";
import { useAccessLogNotifications } from "~/hooks/use-access-log-notifications";
import DataTable from "~/components/ui/data-table";
import { validateUserRole } from "~/lib/auth.server";
import {
  ACCESS_LOG_GLOBAL_FILTER_COLUMNS,
  createAccessLogColumns,
} from "~/lib/columns/access-log";
import { getManyAccessLogs } from "~/lib/services/access-log.server";
import { parseLocalDate, parseLocalDateTime } from "~/lib/utils";
import type { Route } from "./+types/access-logs";
import type { GetManyAccessLogsInput } from "~/lib/services/access-log.server";
import { getQueryParams } from "~/lib/services/http.server";
import { getSessionSite } from "~/lib/session.server";
import { getManyAllowedAreas } from "~/lib/services/allowed-area.server";
import { ACCESS_LOG_ADVANCED_FILTERS, ACCESS_LOG_QUICK_FILTERS } from "~/components/ui/table-filter-presets";
import { isTableOnlyDataRequest } from "~/lib/table-query.server";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await validateUserRole(request, "ACCESS_APPROVER");
  const sessionSite = await getSessionSite(request);

  if (!sessionSite) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const query = getQueryParams(request, [
    "date",
    "dateFrom",
    "dateTo",
    "datePreset",
    "status",
    "q",
    "allowedAreaId",
    "legalId",
    "approvedBy",
    "vehicleQuery",
  ]);

  let mode: "single" | "range";
  let input: GetManyAccessLogsInput;

  if (query.dateFrom || query.dateTo) {
    mode = "range";
    const from = query.dateFrom ? parseLocalDateTime(query.dateFrom) ?? new Date(0) : new Date(0);
    const to = query.dateTo ? parseLocalDateTime(query.dateTo, true) ?? new Date() : new Date();
    input = {
      from,
      to,
      siteId: sessionSite.id,
    };
  } else if (query.datePreset === "all") {
    mode = "single";
    input = { siteId: sessionSite.id };
  } else if (query.datePreset === "7days") {
    mode = "range";
    const to = new Date();
    to.setHours(23, 59, 59, 999);
    const from = new Date(to);
    from.setDate(from.getDate() - 6);
    from.setHours(0, 0, 0, 0);
    input = { from, to, siteId: sessionSite.id };
  } else {
    mode = "single";
    const date = query.date ? parseLocalDate(query.date) : new Date();
    input = { date, siteId: sessionSite.id };
  }

  if (query.status === "INSIDE" || query.status === "OUTSIDE") {
    input.status = query.status;
  }
  input.query = query.q?.trim() || undefined;
  input.allowedAreaId = query.allowedAreaId || undefined;
  input.legalId = query.legalId || undefined;
  input.approvedBy = query.approvedBy || undefined;
  input.vehicleQuery = query.vehicleQuery || undefined;

  const resultMetadata = {
    mode,
    date: mode === "single" ? input.date : undefined,
    dateRange:
      mode === "range" ? { from: input.from, to: input.to } : undefined,
    status: query.status,
  };

  if (isTableOnlyDataRequest(request)) {
    return {
      ...resultMetadata,
      accessLogs: getManyAccessLogs(input),
      allowedAreas: [],
    };
  }

  const allowedAreas = await getManyAllowedAreas();
  const accessLogs = getManyAccessLogs(input);

  return {
    ...resultMetadata,
    accessLogs,
    allowedAreas,
  };
}

export default function ApproverAccessLogs({ loaderData }: Route.ComponentProps) {
  const [accessLogRows, setAccessLogRows] = useResolvedValue<AccessLogListItem[]>(
    loaderData.accessLogs as unknown as PromiseLike<AccessLogListItem[]>,
    [],
  );
  const columns = useMemo(
    () => createAccessLogColumns(loaderData.allowedAreas ?? []),
    [loaderData.allowedAreas],
  );

  useAccessLogNotifications(accessLogRows);

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-3xl font-bold">Registros de acceso</h2>
      <DataTable<AccessLogListItem>
        columns={columns}
        data={loaderData.accessLogs as unknown as PromiseLike<AccessLogListItem[]>}
        refreshDataKey="accessLogs"
        onRowsRefresh={setAccessLogRows}
        globalFilterColumns={ACCESS_LOG_GLOBAL_FILTER_COLUMNS}
        quickFilters={ACCESS_LOG_QUICK_FILTERS}
        advancedFilters={[
          ...ACCESS_LOG_ADVANCED_FILTERS,
          { param: "allowedAreaId", label: "Área autorizada", type: "select", options: (loaderData.allowedAreas ?? []).map((area) => ({ value: area.id, label: area.name })) },
        ]}
        serverFiltering
        refreshIntervalMs={5_000}
        additionalFilterParams={["date"]}
        empty={{
          title: "No hay registros de acceso",
        }}
      />
    </div>
  );
}
