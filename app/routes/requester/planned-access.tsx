import CreatePlannedAccessForm from "~/components/models/planned-access/create-planned-access-form";
import DataTable from "~/components/ui/data-table";
import { plannedAccessColumns } from "~/lib/columns/planned-access";
import { validateUserRole } from "~/lib/auth.server";
import {
  createPlannedAccess,
  getManyPlannedAccesses,
  getPlannedAccessFormInput,
  updatePlannedAccess,
  updatePlannedAccessStatus,
} from "~/lib/services/planned-access.server";
import type { Route } from "./+types/planned-access";
import { getSessionDepartment, getSessionSite } from "~/lib/session.server";
import type { AllowedAction } from "~/components/models/planned-access/planned-access-status-actions";
import PlannedAccessDetailsSheet, { getPlannedAccessRowLabel } from "~/components/models/planned-access/planned-access-details-sheet";
import { useSelectedPlannedAccess } from "~/components/models/planned-access/use-selected-planned-access";
import { redirect } from "react-router";
import { getManyWorkCategories } from "~/lib/services/work-category.server";
import { getManyAllowedAreas } from "~/lib/services/allowed-area.server";
import { getPlannedAccessTableFilters, isTableOnlyDataRequest } from "~/lib/table-query.server";
import { REQUESTER_PLANNED_ACCESS_ADVANCED_FILTERS, REQUESTER_PLANNED_ACCESS_QUICK_FILTERS } from "~/components/ui/table-filter-presets";

const REQUESTER_ALLOWED_ACTIONS: AllowedAction[] = ["EDIT", "CANCEL"];

const PLANNED_ACCESS_GLOBAL_FILTER_COLUMNS = [
  "companySnapshot",
  "visitReason",
  "personsDetails",
];

export async function loader({ request }: Route.LoaderArgs) {
  const user = await validateUserRole(request, "ACCESS_REQUESTER");
  const department = await getSessionDepartment(request);
  const site = await getSessionSite(request);

  if (!department || !site) {
    throw new Response("Unauthorized", { status: 401 });
  }

  if (isTableOnlyDataRequest(request)) {
    return {
      plannedAccesses: getManyPlannedAccesses({
        ...getPlannedAccessTableFilters(request),
        departmentId: department.id,
        siteId: site.id,
      }),
      site,
      workCategories: [],
      allowedAreas: [],
      userId: user.id,
    };
  }

  const [workCategories, allowedAreas] = await Promise.all([
    getManyWorkCategories(),
    getManyAllowedAreas(),
  ]);
  const plannedAccesses = getManyPlannedAccesses({
    ...getPlannedAccessTableFilters(request),
    departmentId: department.id,
    siteId: site.id,
  });

  return {
    plannedAccesses,
    site,
    workCategories,
    allowedAreas,
    userId: user.id,
  };
}

export async function action({ request }: Route.ActionArgs) {
  const user = await validateUserRole(request, "ACCESS_REQUESTER");
  const site = await getSessionSite(request);

  if (!site) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const method = request.method.toUpperCase();
  const rawFormData = await request.formData();

  if (method === "POST") {
    if (rawFormData.get("intent") === "edit") {
      return updatePlannedAccess(Object.fromEntries(rawFormData), {
        authorUsername: user.username,
        lockedSiteId: site.id,
        requestedById: user.id,
      });
    }
    if (rawFormData.has("status")) {
      const result = await updatePlannedAccessStatus(Object.fromEntries(rawFormData), {
        authorUsername: user.username,
        canApprove: false,
        lockedSiteId: site.id,
        requestedById: user.id,
      });
      return result;
    }
    return await createPlannedAccess(getPlannedAccessFormInput(rawFormData), {
      authorUsername: user.username,
      lockedSiteId: site.id,
    });
  }

  return null;
}

export default function RequesterPlannedAccess({
  loaderData,
}: Route.ComponentProps) {
  const plannedAccesses = loaderData.plannedAccesses ?? [];
  const { selectedAccess, setSelectedAccess, reconcileSelection } =
    useSelectedPlannedAccess(plannedAccesses);
  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-2xl font-bold sm:text-3xl">Solicitudes de acceso</h2>
        </div>
        <CreatePlannedAccessForm
          sites={[loaderData.site]}
          actionPath="/requester/planned-access"
          lockedSiteId={loaderData.site.id}
          workCategories={loaderData.workCategories ?? []}
          allowedAreas={loaderData.allowedAreas ?? []}
        />
      </div>
      <DataTable
        columns={plannedAccessColumns({ includeApprovedBy: false, includeSite: false })}
        data={plannedAccesses}
        refreshDataKey="plannedAccesses"
        onRowClick={setSelectedAccess}
        getRowLabel={getPlannedAccessRowLabel}
        onRowsRefresh={reconcileSelection}
        globalFilterColumns={PLANNED_ACCESS_GLOBAL_FILTER_COLUMNS}
        quickFilters={REQUESTER_PLANNED_ACCESS_QUICK_FILTERS}
        stackQuickFilterGroups
        advancedFilters={REQUESTER_PLANNED_ACCESS_ADVANCED_FILTERS}
        serverFiltering
        fitColumns
        refreshIntervalMs={5_000}
        empty={{
          title: "No hay solicitudes de acceso",
          description: "Las solicitudes de acceso de tu departamento apareceran aqui.",
        }}
        filterPlaceholder="Escribe aqui para empezar a buscar..."
      />
      <PlannedAccessDetailsSheet
        plannedAccess={selectedAccess}
        onClose={() => setSelectedAccess(null)}
        actionPath="/requester/planned-access"
        allowedActions={
          selectedAccess?.requestedById === loaderData.userId
            ? REQUESTER_ALLOWED_ACTIONS
            : []
        }
        showSiteRiskInformation={false}
        sites={[loaderData.site]}
        workCategories={loaderData.workCategories ?? []}
        allowedAreas={loaderData.allowedAreas ?? []}
      />
    </div>
  );
}
