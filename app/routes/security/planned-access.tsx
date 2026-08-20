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

const PLANNED_ACCESS_GLOBAL_FILTER_COLUMNS = [
  "companySnapshot",
  "visitReason",
  "personsDetails",
  "siteName",
  "requestedByName",
];

export async function loader({ request }: Route.LoaderArgs) {
  await validateUserRole(request, "SECURITY_MANAGER");

  const [plannedAccesses, sites, workCategories, allowedAreas] = await Promise.all([
    getManyPlannedAccesses(),
    getManySites(),
    getManyWorkCategories(),
    getManyAllowedAreas(),
  ]);

  return { plannedAccesses, sites, workCategories, allowedAreas };
}

export async function action({ request }: Route.ActionArgs) {
  const user = await validateUserRole(request, "SECURITY_MANAGER");
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

export default function SecurityPlannedAccess({
  loaderData,
}: Route.ComponentProps) {
  const columns = useMemo(
     () => plannedAccessColumns({ actionPath: "/security/planned-access", sites: loaderData.sites ?? [], workCategories: loaderData.workCategories ?? [], allowedAreas: loaderData.allowedAreas ?? [] }),
     [loaderData.sites, loaderData.workCategories, loaderData.allowedAreas],
  );
  return (
    <div className="grid space-y-6">
      <div className="flex items-center justify-end">
        <CreatePlannedAccessForm
          sites={loaderData.sites ?? []}
          workCategories={loaderData.workCategories ?? []}
          allowedAreas={loaderData.allowedAreas ?? []}
          actionPath="/security/planned-access"
        />
      </div>
      <DataTable
        columns={columns}
        data={loaderData.plannedAccesses ?? []}
        globalFilterColumns={PLANNED_ACCESS_GLOBAL_FILTER_COLUMNS}
        empty={{
          title: "No hay solicitudes de acceso",
          description: "Las solicitudes de acceso apareceran aqui.",
        }}
        filterPlaceholder="Escribe aqui para empezar a buscar..."
      />
    </div>
  );
}
