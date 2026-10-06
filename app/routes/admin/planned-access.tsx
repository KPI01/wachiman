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
import { getManySites } from "~/lib/services/sites.server";
import type { Route } from "./+types/planned-access";
import { useMemo } from "react";
import { getManyWorkCategories } from "~/lib/services/work-category.server";
import { getManyAllowedAreas } from "~/lib/services/allowed-area.server";
import { getPlannedAccessTableFilters } from "~/lib/table-query.server";
import { PLANNED_ACCESS_ADVANCED_FILTERS, PLANNED_ACCESS_QUICK_FILTERS } from "~/components/ui/table-filter-presets";
import { isTableOnlyDataRequest } from "~/lib/table-query.server";
import PlannedAccessDetailsSheet, { getPlannedAccessRowLabel } from "~/components/models/planned-access/planned-access-details-sheet";
import { useSelectedPlannedAccess } from "~/components/models/planned-access/use-selected-planned-access";

const PLANNED_ACCESS_GLOBAL_FILTER_COLUMNS = [
  "companySnapshot",
  "visitReason",
  "personsDetails",
  "siteName",
  "requestedByName",
];

export async function loader({ request }: Route.LoaderArgs) {
  await validateUserRole(request, "ADMIN");

  if (isTableOnlyDataRequest(request)) {
    return {
      plannedAccesses: getManyPlannedAccesses(getPlannedAccessTableFilters(request)),
      sites: [],
      workCategories: [],
      allowedAreas: [],
    };
  }

  const [sites, workCategories, allowedAreas] = await Promise.all([
    getManySites(),
    getManyWorkCategories(),
    getManyAllowedAreas(),
  ]);
  const plannedAccesses = getManyPlannedAccesses(getPlannedAccessTableFilters(request));

  return { plannedAccesses, sites, workCategories, allowedAreas };
}

export async function action({ request }: Route.ActionArgs) {
  const user = await validateUserRole(request, "ADMIN");
  const method = request.method.toUpperCase();
  const rawFormData = await request.formData();

  if (method === "POST") {
    if (rawFormData.get("intent") === "edit") {
      return updatePlannedAccess(Object.fromEntries(rawFormData), {
        authorUsername: user.username,
      });
    }
    if (rawFormData.get("intent") === "decision") {
      return updatePlannedAccessStatus(Object.fromEntries(rawFormData), {
        authorUsername: user.username,
        canApprove: true,
      });
    }
    return await createPlannedAccess(getPlannedAccessFormInput(rawFormData), {
      authorUsername: user.username,
    });
  }

  return null;
}

export default function PlannedAccessIndex({
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
    <div className="grid space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl sm:text-3xl font-bold">Solicitudes de acceso</h2>

         <CreatePlannedAccessForm
           sites={loaderData.sites ?? []}
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
        quickFilters={PLANNED_ACCESS_QUICK_FILTERS}
        advancedFilters={[
          ...PLANNED_ACCESS_ADVANCED_FILTERS,
          { param: "siteId", label: "Centro", type: "select", options: (loaderData.sites ?? []).map((site) => ({ value: site.id, label: site.name })) },
        ]}
        serverFiltering
        refreshIntervalMs={5_000}
        empty={{
          title: "No hay solicitudes de acceso",
          description: "Las solicitudes de acceso creadas apareceran aqui.",
        }}
        filterPlaceholder="Escribe aqui para empezar a buscar..."
      />
      <PlannedAccessDetailsSheet
        plannedAccess={selectedAccess}
        onClose={() => setSelectedAccess(null)}
        actionPath="/admin/planned-access"
        canChangeSite
        sites={loaderData.sites ?? []}
        workCategories={loaderData.workCategories ?? []}
        allowedAreas={loaderData.allowedAreas ?? []}
      />
    </div>
  );
}
