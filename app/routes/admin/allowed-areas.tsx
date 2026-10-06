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
import { catalogRecentFilter } from "~/components/ui/table-filter-presets";
import { useState } from "react";
import AllowedAreaDetailsForm from "~/components/models/allowed-area/allowed-area-details-form";

export async function loader({ request }: Route.LoaderArgs) {
  await validateUserRole(request, ["ADMIN", "SECURITY_MANAGER", "ACCESS_APPROVER"]);
  return { allowedAreas: getManyAllowedAreas() };
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
  const allowedAreas = loaderData.allowedAreas;
  type AllowedAreaRow = Awaited<typeof allowedAreas>[number];
  const [selectedAllowedArea, setSelectedAllowedArea] = useState<AllowedAreaRow | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex">
        <h2 className="text-3xl font-bold">Áreas autorizadas</h2>
        <CreateAllowedAreaForm errors={actionData?.errors} />
      </div>
      <DataTable
        columns={allowedAreaColumns}
        data={allowedAreas}
        refreshDataKey="allowedAreas"
        globalFilterColumns={["name"]}
        quickFilters={catalogRecentFilter()}
        onRowClick={setSelectedAllowedArea}
        getRowLabel={(area) => `Abrir ficha del área autorizada ${area.name}`}
        onRowsRefresh={(rows) =>
          setSelectedAllowedArea((current) =>
            current ? rows.find((area) => area.id === current.id) ?? current : null,
          )
        }
      />
      {selectedAllowedArea ? (
        <AllowedAreaDetailsForm
          allowedArea={selectedAllowedArea}
          open
          onOpenChange={(open) => {
            if (!open) setSelectedAllowedArea(null);
          }}
          showTrigger={false}
        />
      ) : null}
    </div>
  );
}
