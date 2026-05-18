import DataTable from "~/components/ui/data-table";
import { accessLogColumns } from "~/lib/columns/access-log";
import CreateAccessLog from "~/components/models/access-logs/create-access-log-form";
import type { Route } from "./+types/access-logs";
import { validateUserRole } from "~/lib/auth.server";
import {
  createAccessLog,
  getManyAccessLogs,
} from "~/lib/services/access-log.server";
import { getManySites } from "~/lib/services/sites.server";
import { getFormData, getQueryParams } from "~/lib/services/http.server";
import type { GetManyAccessLogsInput } from "~/lib/services/access-log.server";
import { formatTimestamp, parseLocalDate } from "~/lib/utils";
import { useNavigate, useRevalidator } from "react-router";
import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { DatePicker } from "~/components/ui/date-picker";
import { DateRangePicker } from "~/components/ui/date-range-picker";

export async function loader({ request }: Route.LoaderArgs) {
  await validateUserRole(request, "ADMIN");

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
  await validateUserRole(request, "ADMIN");

  const user = await validateUserRole(request, "ADMIN");
  const data = await getFormData(request);

  return await createAccessLog(data, { authorUsername: user.username });
}

export default function IndexAccessLogs({ loaderData }: Route.ComponentProps) {
  const navigation = useNavigate();
  const revalidator = useRevalidator();
  const [filterMode, setFilterMode] = useState<"single" | "range">(
    loaderData.mode,
  );

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

  const handleModeChange = (mode: "single" | "range") => {
    setFilterMode(mode);
    if (mode === "single") {
      const today = formatTimestamp({
        date: new Date(),
        template: "yyyy-MM-dd",
      });
      navigation(`/admin/access-logs?date=${today}`);
    } else {
      navigation(`/admin/access-logs`);
    }
  };

  const handleStatusChange = (status: string) => {
    const statusParam = status === "ALL" ? "" : `&status=${status}`;
    if (filterMode === "range" && loaderData.dateRange) {
      const from = formatTimestamp({
        date: loaderData.dateRange.from,
        template: "yyyy-MM-dd",
      });
      const to = formatTimestamp({
        date: loaderData.dateRange.to,
        template: "yyyy-MM-dd",
      });
      navigation(
        `/admin/access-logs?dateFrom=${from}&dateTo=${to}${statusParam}`,
      );
    } else {
      const today = formatTimestamp({
        date: loaderData.date ?? new Date(),
        template: "yyyy-MM-dd",
      });
      navigation(`/admin/access-logs?date=${today}${statusParam}`);
    }
  };

  return (
    <div className="grid space-y-6">
      <h2 className="text-3xl font-bold">Registros de acceso</h2>
      <div className="flex items-center justify-between">
        <div className="text-accent-foreground flex items-end gap-3">
          <Select
            value={filterMode}
            onValueChange={(v) => handleModeChange(v as "single" | "range")}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single">Fecha específica</SelectItem>
              <SelectItem value="range">Rango de fechas</SelectItem>
            </SelectContent>
          </Select>
          {filterMode === "single" ? (
            <DatePicker
              value={loaderData.date}
              onChange={(v) =>
                navigation(
                  `/admin/access-logs?date=${formatTimestamp({ date: v, template: "yyyy-MM-dd" })}${loaderData.status ? `&status=${loaderData.status}` : ""}`,
                )
              }
            />
          ) : (
            <DateRangePicker
              value={loaderData.dateRange}
              onChange={(range) => {
                if (range?.from && range.to) {
                  const from = formatTimestamp({
                    date: range.from,
                    template: "yyyy-MM-dd",
                  });
                  const to = formatTimestamp({
                    date: range.to,
                    template: "yyyy-MM-dd",
                  });
                  navigation(
                    `/admin/access-logs?dateFrom=${from}&dateTo=${to}${loaderData.status ? `&status=${loaderData.status}` : ""}`,
                  );
                }
              }}
            />
          )}
          <Select
            value={loaderData.status ?? "ALL"}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos</SelectItem>
              <SelectItem value="INSIDE">Dentro</SelectItem>
              <SelectItem value="OUTSIDE">Fuera</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <CreateAccessLog
          sites={loaderData.sites ?? []}
          actionPath="/admin/access-logs"
        />
      </div>
      <DataTable
        columns={accessLogColumns}
        data={loaderData.accessLogs ?? []}
        globalFilterColumns={[
          "fullNameSnapshot",
          "legalIdSnapshot",
          "companyNameSnapshot",
          "vehicleDetails",
        ]}
        empty={{
          title: "No hay accesos registrados",
          description: "Los registros de acceso creados apareceran aqui.",
        }}
        filterPlaceholder="Escribe aqui para empezar a buscar..."
      />
    </div>
  );
}
