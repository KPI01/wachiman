import { useEffect } from "react";
import { useRevalidator } from "react-router";
import { useAccessLogNotifications } from "~/hooks/use-access-log-notifications";
import CreateAccessLog from "~/components/models/access-logs/create-access-log-form";
import DataTable from "~/components/ui/data-table";
import { validateUserRole } from "~/lib/auth.server";
import {
  ACCESS_LOG_COLUMN_FILTER_ACTIONS,
  ACCESS_LOG_GLOBAL_FILTER_COLUMNS,
  accessLogColumns,
} from "~/lib/columns/access-log";
import {
  createAccessLog,
  getManyAccessLogs,
} from "~/lib/services/access-log.server";
import { getManySites } from "~/lib/services/sites.server";
import { parseLocalDate } from "~/lib/utils";
import type { Route } from "./+types/access-logs";
import type { GetManyAccessLogsInput } from "~/lib/services/access-log.server";
import { getFormData, getQueryParams } from "~/lib/services/http.server";
import AccessLogFilters from "~/components/models/access-logs/access-log-filters";

export async function loader({ request }: Route.LoaderArgs) {
  await validateUserRole(request, "SECURITY_MANAGER");

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
    };
  } else {
    mode = "single";
    const date = query.date ? parseLocalDate(query.date) : new Date();
    input = { date };
  }

  if (query.status === "INSIDE" || query.status === "OUTSIDE") {
    input.status = query.status;
  }

  const [accessLogs, sites] = await Promise.all([
    getManyAccessLogs(input),
    getManySites(),
  ]);

  return {
    mode,
    date: mode === "single" ? input.date : undefined,
    dateRange:
      mode === "range" ? { from: input.from, to: input.to } : undefined,
    status: query.status,
    accessLogs,
    sites,
  };
}

export async function action({ request }: Route.ActionArgs) {
  const user = await validateUserRole(request, "SECURITY_MANAGER");
  const data = await getFormData(request);

  const result = await createAccessLog(data, { authorUsername: user.username });
  return result;
}

export default function IndexAccessLogs({ loaderData }: Route.ComponentProps) {
  const revalidator = useRevalidator();

  useAccessLogNotifications(loaderData.accessLogs ?? []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (
        document.visibilityState === "visible" &&
        revalidator.state === "idle"
      ) {
        revalidator.revalidate();
      }
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [revalidator]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-3xl font-bold">Registros de acceso</h2>
        <div className="w-full sm:w-auto">
          <CreateAccessLog
            sites={loaderData.sites ?? []}
            actionPath="/security/access-logs"
          />
        </div>
      </div>
      <DataTable
        columns={accessLogColumns}
        data={loaderData.accessLogs ?? []}
        globalFilterColumns={ACCESS_LOG_GLOBAL_FILTER_COLUMNS}
        columnHeaderActions={{
          ...ACCESS_LOG_COLUMN_FILTER_ACTIONS,
          entryTimestamp: (
            <AccessLogFilters
              basePath="/security/access-logs"
              filter="period"
              mode={loaderData.mode}
              date={loaderData.date}
              dateRange={loaderData.dateRange}
              status={loaderData.status}
            />
          ),
          exitTimestamp: (
            <AccessLogFilters
              basePath="/security/access-logs"
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
