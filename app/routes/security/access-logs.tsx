import { useMemo } from "react";
import { useResolvedValue } from "~/hooks/use-resolved-value";
import type { AccessLogListItem } from "~/lib/database/access-log.server";
import { useAccessLogNotifications } from "~/hooks/use-access-log-notifications";
import CreateAccessLog from "~/components/models/access-logs/create-access-log-form";
import CreateVehicleAccessLogForm from "~/components/models/access-logs/create-vehicle-access-log-form";
import DataTable from "~/components/ui/data-table";
import { validateUserRole } from "~/lib/auth.server";
import {
  ACCESS_LOG_GLOBAL_FILTER_COLUMNS,
  createAccessLogColumns,
} from "~/lib/columns/access-log";
import {
  createAccessLog,
  createVehicleAccessLogs,
  getManyAccessLogs,
} from "~/lib/services/access-log.server";
import { getManySites } from "~/lib/services/sites.server";
import { parseLocalDate, parseLocalDateTime } from "~/lib/utils";
import type { Route } from "./+types/access-logs";
import type { GetManyAccessLogsInput } from "~/lib/services/access-log.server";
import { getFormData, getQueryParams } from "~/lib/services/http.server";
import { getManyAllowedAreas } from "~/lib/services/allowed-area.server";
import { getGlobalAppSettings } from "~/lib/services/app-settings.server";
import { getManyCompanies } from "~/lib/services/company.server";
import { ACCESS_LOG_ADVANCED_FILTERS, ACCESS_LOG_QUICK_FILTERS } from "~/components/ui/table-filter-presets";
import { isTableOnlyDataRequest } from "~/lib/table-query.server";

export async function loader({ request }: Route.LoaderArgs) {
  await validateUserRole(request, "SECURITY_MANAGER");

  const query = getQueryParams(request, [
    "date",
    "dateFrom",
    "dateTo",
    "datePreset",
    "status",
    "q",
    "siteId",
    "companyName",
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
    };
  } else if (query.datePreset === "all") {
    mode = "single";
    input = {};
  } else if (query.datePreset === "7days") {
    mode = "range";
    const to = new Date();
    to.setHours(23, 59, 59, 999);
    const from = new Date(to);
    from.setDate(from.getDate() - 6);
    from.setHours(0, 0, 0, 0);
    input = { from, to };
  } else {
    mode = "single";
    const date = query.date ? parseLocalDate(query.date) : new Date();
    input = { date };
  }

  if (query.status === "INSIDE" || query.status === "OUTSIDE") {
    input.status = query.status;
  }
  input.query = query.q?.trim() || undefined;
  input.siteId = query.siteId || undefined;
  input.companyName = query.companyName || undefined;
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
      sites: [],
      allowedAreas: [],
      holder: undefined,
      companies: [],
    };
  }

  const [sites, allowedAreas, settings, companies] = await Promise.all([
    getManySites(),
    getManyAllowedAreas(),
    getGlobalAppSettings(),
    getManyCompanies(),
  ]);
  const accessLogs = getManyAccessLogs(input);

  return {
    ...resultMetadata,
    accessLogs,
    sites,
    allowedAreas,
    holder: settings ? { legalName: settings.holderLegalName ?? "", taxId: settings.holderTaxId ?? "", fiscalAddress: settings.holderFiscalAddress ?? "" } : undefined,
    companies,
  };
}

export async function action({ request }: Route.ActionArgs) {
  const user = await validateUserRole(request, "SECURITY_MANAGER");
  const data = await getFormData(request);

  if (data.intent === "vehicle-access") {
    return await createVehicleAccessLogs(data, { authorUsername: user.username });
  }

  const result = await createAccessLog(data, { authorUsername: user.username });
  return result;
}

export default function IndexAccessLogs({ loaderData }: Route.ComponentProps) {
  const [accessLogRows, setAccessLogRows, accessLogsReady] = useResolvedValue<AccessLogListItem[]>(
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-3xl font-bold">Registros de acceso</h2>
        <div className="flex w-full flex-wrap justify-end gap-2 sm:w-auto">
          <CreateAccessLog
            sites={loaderData.sites ?? []}
            allowedAreas={loaderData.allowedAreas ?? []}
            actionPath="/security/access-logs"
            ready={accessLogsReady}
            holder={loaderData.holder}
            companies={loaderData.companies ?? []}
            dailyRiskAcknowledgements={accessLogRows.map((log) => ({ legalIdSnapshot: log.legalIdSnapshot, companyId: log.companyId, siteId: log.siteId, riskAcknowledgedAt: log.riskAcknowledgedAt }))}
          />
          <CreateVehicleAccessLogForm
            sites={loaderData.sites ?? []}
            allowedAreas={loaderData.allowedAreas ?? []}
            actionPath="/security/access-logs"
            holder={loaderData.holder}
            companies={loaderData.companies ?? []}
          />
        </div>
      </div>
      <DataTable<AccessLogListItem>
        columns={columns}
        data={loaderData.accessLogs as unknown as PromiseLike<AccessLogListItem[]>}
        refreshDataKey="accessLogs"
        onRowsRefresh={setAccessLogRows}
        globalFilterColumns={ACCESS_LOG_GLOBAL_FILTER_COLUMNS}
        quickFilters={ACCESS_LOG_QUICK_FILTERS}
        advancedFilters={[
          ...ACCESS_LOG_ADVANCED_FILTERS,
          { param: "siteId", label: "Centro", type: "select", options: (loaderData.sites ?? []).map((site) => ({ value: site.id, label: site.name })) },
          { param: "companyName", label: "Empresa", type: "select", options: [...new Set((loaderData.companies ?? []).map((company) => company.name))].map((name) => ({ value: name, label: name })) },
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
