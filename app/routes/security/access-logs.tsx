import { useState } from "react";
import { useNavigate } from "react-router";
import CreateAccessLog from "~/components/models/access-logs/create-access-log-form";
import DataTable from "~/components/ui/data-table";
import { DatePicker } from "~/components/ui/date-picker";
import { DateRangePicker } from "~/components/ui/date-range-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";
import { validateUserRole } from "~/lib/auth.server";
import { accessLogColumns } from "~/lib/columns/access-log";
import {
  createAccessLog,
  getManyAccessLogs,
} from "~/lib/services/access-log.server";
import { getManySites } from "~/lib/services/sites.server";
import { formatTimestamp, parseLocalDate } from "~/lib/utils";
import type { Route } from "./+types/access-logs";
import type { GetAccessLogsInput } from "~/lib/database/access-log.server";
import { getFormData, getQueryParams } from "~/lib/services/http.server";

export async function loader({ request }: Route.LoaderArgs) {
  await validateUserRole(request, "SECURITY_MANAGER");

  const query = getQueryParams(request, ["date", "dateFrom", "dateTo"]);

  let mode: "single" | "range";
  let input: GetAccessLogsInput;

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

  const [accessLogs, sites] = await Promise.all([
    getManyAccessLogs(input),
    getManySites(),
  ]);

  return {
    mode,
    date: mode === "single" ? input.date : undefined,
    dateRange:
      mode === "range" ? { from: input.from, to: input.to } : undefined,
    accessLogs,
    sites,
  };
}

export async function action({ request }: Route.ActionArgs) {
  const user = await validateUserRole(request, "SECURITY_MANAGER");
  const data = await getFormData(request);

  const result = await createAccessLog(data, { authorUsername: user.username });
}

export default function IndexAccessLogs({ loaderData }: Route.ComponentProps) {
  const navigation = useNavigate();
  const [filterMode, setFilterMode] = useState<"single" | "range">(
    loaderData.mode,
  );

  const handleModeChange = (mode: "single" | "range") => {
    setFilterMode(mode);
    if (mode === "single") {
      const today = formatTimestamp({
        date: new Date(),
        template: "yyyy-MM-dd",
      });
      navigation(`/security/access-logs?date=${today}`);
    } else {
      navigation(`/security/access-logs`);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-end mb-4">
        <div className="grid space-y-2">
          <div className="font-semibold">Filtros:</div>
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
                    `/security/access-logs?date=${formatTimestamp({ date: v, template: "yyyy-MM-dd" })}`,
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
                      `/admin/access-logs?dateFrom=${from}&dateTo=${to}`,
                    );
                  }
                }}
              />
            )}
          </div>
        </div>
        <CreateAccessLog
          sites={loaderData.sites ?? []}
          actionPath="/security/access-logs"
        />
      </div>
      <Separator className="my-4" />
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
