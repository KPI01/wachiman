import DataTable from "~/components/ui/data-table";
import { allowedAreaColumns } from "~/lib/columns/allowed-area";
import { validateUserRole } from "~/lib/auth.server";
import {
  createAllowedArea,
  deleteAllowedArea,
  getManyAllowedAreas,
  updateAllowedArea,
} from "~/lib/services/allowed-area.server";
import type { Route } from "./+types/allowed-areas";
import CreateAllowedAreaForm from "~/components/models/allowed-area/create-allowed-area-form";

export async function loader({ request }: Route.LoaderArgs) {
  await validateUserRole(request, ["ADMIN", "SECURITY_MANAGER", "ACCESS_APPROVER"]);
  return { allowedAreas: await getManyAllowedAreas() };
}

export async function action({ request }: Route.ActionArgs) {
  await validateUserRole(request, ["ADMIN", "SECURITY_MANAGER", "ACCESS_APPROVER"]);
  const input = Object.fromEntries(await request.formData());
  const method = request.method.toUpperCase();

  if (method === "POST") return createAllowedArea(input);
  if (method === "PATCH" || method === "PUT") return updateAllowedArea(input);
  if (method === "DELETE") return deleteAllowedArea(input);
  return null;
}

export default function AllowedAreasIndex({ loaderData, actionData }: Route.ComponentProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex">
        <h2 className="text-3xl font-bold">Áreas autorizadas</h2>
        <CreateAllowedAreaForm errors={actionData?.errors} />
      </div>
      <DataTable
        columns={allowedAreaColumns}
        data={loaderData.allowedAreas ?? []}
        globalFilterColumns={["name"]}
      />
    </div>
  );
}
