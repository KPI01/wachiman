import CreatePlannedAccessForm from "~/components/models/planned-access/create-planned-access-form";
import DataTable from "~/components/ui/data-table";
import { plannedAccessColumns } from "~/lib/columns/planned-access";
import { validateUserRole } from "~/lib/auth.server";
import {
  createPlannedAccess,
  getManyPlannedAccesses,
  getPlannedAccessFormInput,
  updatePlannedAccessStatus,
} from "~/lib/services/planned-access.server";
import { getManySites } from "~/lib/services/sites.server";
import type { Route } from "./+types/planned-access";

const PLANNED_ACCESS_GLOBAL_FILTER_COLUMNS = [
  "companySnapshot",
  "visitReason",
  "personsDetails",
  "siteName",
  "requestedByName",
];

const columns = plannedAccessColumns({
  actionPath: "/admin/planned-access",
});

export async function loader({ request }: Route.LoaderArgs) {
  await validateUserRole(request, "ADMIN");

  const [plannedAccesses, sites] = await Promise.all([
    getManyPlannedAccesses(),
    getManySites(),
  ]);

  return { plannedAccesses, sites };
}

export async function action({ request }: Route.ActionArgs) {
  const user = await validateUserRole(request, "ADMIN");
  const method = request.method.toUpperCase();
  const rawFormData = await request.formData();

  if (method === "POST") {
    return await createPlannedAccess(getPlannedAccessFormInput(rawFormData), {
      authorUsername: user.username,
    });
  }

  if (method === "PUT" || method === "PATCH") {
    return await updatePlannedAccessStatus(Object.fromEntries(rawFormData), {
      authorUsername: user.username,
    });
  }

  return null;
}

export default function PlannedAccessIndex({
  loaderData,
}: Route.ComponentProps) {
  return (
    <div className="grid space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl sm:text-3xl font-bold">Solicitudes de acceso</h2>

        <CreatePlannedAccessForm sites={loaderData.sites ?? []} />
      </div>
      <DataTable
        columns={columns}
        data={loaderData.plannedAccesses ?? []}
        globalFilterColumns={PLANNED_ACCESS_GLOBAL_FILTER_COLUMNS}
        empty={{
          title: "No hay solicitudes de acceso",
          description: "Las solicitudes de acceso creadas apareceran aqui.",
        }}
        filterPlaceholder="Escribe aqui para empezar a buscar..."
      />
    </div>
  );
}
