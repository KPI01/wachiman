import { useEffect, useMemo, useRef } from "react";
import { useRevalidator } from "react-router";
import { useAccessLogNotifications } from "~/hooks/use-access-log-notifications";
import DataTable from "~/components/ui/data-table";
import { validateUserRole } from "~/lib/auth.server";
import {
  ACCESS_LOG_COLUMN_FILTER_ACTIONS,
  ACCESS_LOG_GLOBAL_FILTER_COLUMNS,
  createAccessLogColumns,
} from "~/lib/columns/access-log";
import { getManyAccessLogs } from "~/lib/services/access-log.server";
import { parseLocalDate } from "~/lib/utils";
import type { Route } from "./+types/access-logs";
import type { GetManyAccessLogsInput } from "~/lib/services/access-log.server";
import { getQueryParams } from "~/lib/services/http.server";
import { getSessionSite } from "~/lib/session.server";
import AccessLogFilters from "~/components/models/access-logs/access-log-filters";
import { getManyAllowedAreas } from "~/lib/services/allowed-area.server";

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
    "status",
  ]);

  let mode: "single" | "range";
  let input: GetManyAccessLogsInput;

  if (query.dateFrom && query.dateTo) {
    mode = "range";
    input = {
      from: parseLocalDate(query.dateFrom),
      to: parseLocalDate(query.dateTo),
      siteId: sessionSite.id,
    };
  } else {
    mode = "single";
    const date = query.date ? parseLocalDate(query.date) : new Date();
    input = { date, siteId: sessionSite.id };
  }

  if (query.status === "INSIDE" || query.status === "OUTSIDE") {
    input.status = query.status;
  }

  const [accessLogs, allowedAreas] = await Promise.all([
    getManyAccessLogs(input),
    getManyAllowedAreas(),
  ]);

  return {
    mode,
    date: mode === "single" ? input.date : undefined,
    dateRange:
      mode === "range" ? { from: input.from, to: input.to } : undefined,
    status: query.status,
    accessLogs,
    allowedAreas,
  };
}

export default function ApproverAccessLogs({ loaderData }: Route.ComponentProps) {
  const revalidator = useRevalidator();
  const revalidatorRef = useRef(revalidator);
  revalidatorRef.current = revalidator;
  const columns = useMemo(
    () => createAccessLogColumns(loaderData.allowedAreas ?? []),
    [loaderData.allowedAreas],
  );

  useAccessLogNotifications(loaderData.accessLogs ?? []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      const currentRevalidator = revalidatorRef.current;

      if (
        document.visibilityState === "visible" &&
        currentRevalidator.state === "idle"
      ) {
        currentRevalidator.revalidate();
      }
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-3xl font-bold">Registros de acceso</h2>
      <DataTable
        columns={columns}
        data={loaderData.accessLogs ?? []}
        globalFilterColumns={ACCESS_LOG_GLOBAL_FILTER_COLUMNS}
        columnHeaderActions={{
          ...ACCESS_LOG_COLUMN_FILTER_ACTIONS,
          entryTimestamp: (
            <AccessLogFilters
              basePath="/approver/access-logs"
              filter="period"
              mode={loaderData.mode}
              date={loaderData.date}
              dateRange={loaderData.dateRange}
              status={loaderData.status}
            />
          ),
          exitTimestamp: (
            <AccessLogFilters
              basePath="/approver/access-logs"
              filter="status"
              mode={loaderData.mode}
              date={loaderData.date}
              dateRange={loaderData.dateRange}
              status={loaderData.status}
            />
          ),
        }}
        empty={{
          title: "No hay registros de acceso",
        }}
      />
    </div>
  );
}
