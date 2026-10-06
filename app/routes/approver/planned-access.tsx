import CreatePlannedAccessForm from "~/components/models/planned-access/create-planned-access-form";
import DataTable from "~/components/ui/data-table";
import { plannedAccessColumns } from "~/lib/columns/planned-access";
import { validateUserRole } from "~/lib/auth.server";
import {
  getManyPlannedAccesses,
  createPlannedAccess,
  getPlannedAccessFormInput,
  updatePlannedAccessStatus,
} from "~/lib/services/planned-access.server";
import type { Route } from "./+types/planned-access";
import { getSessionSite } from "~/lib/session.server";
import { useMemo } from "react";
import { getManyWorkCategories } from "~/lib/services/work-category.server";
import { getManyAllowedAreas } from "~/lib/services/allowed-area.server";
import { getPlannedAccessTableFilters, isTableOnlyDataRequest } from "~/lib/table-query.server";
import { REQUESTER_PLANNED_ACCESS_ADVANCED_FILTERS, REQUESTER_PLANNED_ACCESS_QUICK_FILTERS } from "~/components/ui/table-filter-presets";
import type { AllowedAction } from "~/components/models/planned-access/planned-access-status-actions";
import PlannedAccessDetailsSheet, { getPlannedAccessRowLabel } from "~/components/models/planned-access/planned-access-details-sheet";
import { useSelectedPlannedAccess } from "~/components/models/planned-access/use-selected-planned-access";

const PLANNED_ACCESS_GLOBAL_FILTER_COLUMNS = [
  "companySnapshot",
  "visitReason",
  "personsDetails",
  "siteName",
  "requestedByName",
];

const APPROVER_ALLOWED_ACTIONS: AllowedAction[] = ["APPROVE", "REJECT", "CANCEL"];

export async function loader({ request }: Route.LoaderArgs) {
  const user = await validateUserRole(request, "ACCESS_APPROVER");
  const sessionSite = await getSessionSite(request);

  if (!sessionSite) {
    throw new Response("Unauthorized", { status: 401 });
  }

  if (isTableOnlyDataRequest(request)) {
    return {
      plannedAccesses: getManyPlannedAccesses({ ...getPlannedAccessTableFilters(request), siteId: sessionSite.id }),
      site: sessionSite,
      workCategories: [],
      allowedAreas: [],
    };
  }

  const [workCategories, allowedAreas] = await Promise.all([
    getManyWorkCategories(),
    getManyAllowedAreas(),
  ]);
  const plannedAccesses = getManyPlannedAccesses({ ...getPlannedAccessTableFilters(request), siteId: sessionSite.id });

  return { plannedAccesses, site: sessionSite, workCategories, allowedAreas };
}

export async function action({ request }: Route.ActionArgs) {
  const user = await validateUserRole(request, "ACCESS_APPROVER");
  const method = request.method.toUpperCase();
  const rawFormData = await request.formData();

  if (method !== "POST") {
    return null;
  }

  if (rawFormData.get("intent") !== "decision") {
    return createPlannedAccess(getPlannedAccessFormInput(rawFormData), {
      authorUsername: user.username,
      lockedSiteId: (await getSessionSite(request))?.id,
    });
  }

  const result = await updatePlannedAccessStatus(Object.fromEntries(rawFormData), {
    authorUsername: user.username,
    canApprove: true,
    lockedSiteId: (await getSessionSite(request))?.id,
  });
  return result;
}

export default function ApproverPlannedAccess({
  loaderData,
}: Route.ComponentProps) {
  const plannedAccesses = loaderData.plannedAccesses ?? [];
  const { selectedAccess, setSelectedAccess, reconcileSelection } =
    useSelectedPlannedAccess(plannedAccesses);
  const columns = useMemo(
    () => plannedAccessColumns(),
    [],
  );
  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold sm:text-3xl">Solicitudes de acceso</h2>
        <CreatePlannedAccessForm
          sites={[loaderData.site]}
          actionPath="/approver/planned-access"
          lockedSiteId={loaderData.site.id}
          workCategories={loaderData.workCategories ?? []}
          allowedAreas={loaderData.allowedAreas ?? []}
        />
      </div>
      <DataTable
        columns={columns}
        data={plannedAccesses}
        refreshDataKey="plannedAccesses"
        onRowClick={setSelectedAccess}
        getRowLabel={getPlannedAccessRowLabel}
        onRowsRefresh={reconcileSelection}
        globalFilterColumns={PLANNED_ACCESS_GLOBAL_FILTER_COLUMNS}
        quickFilters={REQUESTER_PLANNED_ACCESS_QUICK_FILTERS}
        advancedFilters={REQUESTER_PLANNED_ACCESS_ADVANCED_FILTERS}
        serverFiltering
        refreshIntervalMs={5_000}
        empty={{
          title: "No hay solicitudes de acceso",
          description: "Las solicitudes de acceso del centro apareceran aqui.",
        }}
        filterPlaceholder="Escribe aqui para empezar a buscar..."
      />
      <PlannedAccessDetailsSheet
        plannedAccess={selectedAccess}
        onClose={() => setSelectedAccess(null)}
        actionPath="/approver/planned-access"
        allowedActions={APPROVER_ALLOWED_ACTIONS}
        sites={[loaderData.site]}
        workCategories={loaderData.workCategories ?? []}
        allowedAreas={loaderData.allowedAreas ?? []}
      />
    </div>
  );
}
