import { useEffect } from "react";
import { useRevalidator } from "react-router";
import { useAccessLogNotifications } from "~/hooks/use-access-log-notifications";
import DataTable from "~/components/ui/data-table";
import { validateUserRole } from "~/lib/auth.server";
import { accessLogColumns } from "~/lib/columns/access-log";
import { getManyAccessLogs } from "~/lib/services/access-log.server";
import { parseLocalDate } from "~/lib/utils";
import type { Route } from "./+types/access-logs";
import type { GetManyAccessLogsInput } from "~/lib/services/access-log.server";
import { getQueryParams } from "~/lib/services/http.server";
import { getSessionSite } from "~/lib/session.server";
import AccessLogFilters from "~/components/models/access-logs/access-log-filters";

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

  const accessLogs = await getManyAccessLogs(input);

  return {
    mode,
    date: mode === "single" ? input.date : undefined,
    dateRange:
      mode === "range" ? { from: input.from, to: input.to } : undefined,
    status: query.status,
    accessLogs,
  };
}

export default function ApproverAccessLogs({ loaderData }: Route.ComponentProps) {
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
      <h2 className="text-3xl font-bold">Registros de acceso</h2>
      <AccessLogFilters
        basePath="/approver/access-logs"
        mode={loaderData.mode}
        date={loaderData.date}
        dateRange={loaderData.dateRange}
        status={loaderData.status}
      />
      <DataTable
        columns={accessLogColumns}
        data={loaderData.accessLogs ?? []}
        empty={{
          title: "No hay registros de acceso",
        }}
      />
    </div>
  );
}
