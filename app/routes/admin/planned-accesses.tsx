import { useMemo } from "react";
import type { Route } from "./+types/planned-accesses";
import DataTable from "~/components/ui/data-table";
import { getPlannedAccessColumns } from "~/lib/columns/planned-access";
import CreatePlannedAccess from "~/components/models/planned-accesses/create-planned-access-form";
import { validateUserRole } from "~/lib/auth.server";
import {
  createPlannedAccess,
  getManyPlannedAccesses,
  updatePlannedAccess,
} from "~/lib/services/planned-accessess.server";

export async function loader({ request }: Route.LoaderArgs) {
  await validateUserRole(request, "ADMIN");

  const plannedAccesses = await getManyPlannedAccesses();

  return { plannedAccesses };
}

export async function action({ request }: Route.ActionArgs) {
  await validateUserRole(request, "ADMIN");
  const method = request.method.toUpperCase();
  const formData = await request.formData();

  if (method === "POST") {
    return await createPlannedAccess(formData);
  }

  if (method === "PUT" || method === "PATCH") {
    return await updatePlannedAccess(formData);
  }
}

export default function PlannedAccesses({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const columns = useMemo(() => getPlannedAccessColumns(), []);

  return (
    <div className="grid space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Solicitudes de Acceso</h2>

        <CreatePlannedAccess errors={actionData?.errors} />
      </div>
      <DataTable
        columns={columns}
        data={loaderData.plannedAccesses ?? []}
        globalFilterColumns={["status"]}
      />
    </div>
  );
}
