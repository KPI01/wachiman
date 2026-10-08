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
import { getManySites } from "~/lib/services/sites.server";
import { getSessionSite } from "~/lib/session.server";
import { useLocation } from "react-router";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await validateUserRole(request, ["ADMIN", "SECURITY_MANAGER", "ACCESS_APPROVER"]);
  const site = user.role === "ACCESS_APPROVER" ? await getSessionSite(request) : null;
  if (user.role === "ACCESS_APPROVER" && !site) throw new Response("Unauthorized", { status: 401 });
  return { allowedAreas: getManyAllowedAreas(site?.id), sites: site ? [site] : await getManySites() };
}

export async function action({ request }: Route.ActionArgs) {
  const user = await validateUserRole(request, ["ADMIN", "SECURITY_MANAGER", "ACCESS_APPROVER"]);
  const site = user.role === "ACCESS_APPROVER" ? await getSessionSite(request) : null;
  if (user.role === "ACCESS_APPROVER" && !site) throw new Response("Unauthorized", { status: 401 });
  const input = Object.fromEntries(await request.formData());
  const method = request.method.toUpperCase();

  if (method === "POST") return createAllowedArea(input, site?.id);
  if (method === "PATCH" || method === "PUT") return updateAllowedArea(input, site?.id);
  if (method === "DELETE") return deleteAllowedArea(input, site?.id);
  return null;
}

export default function AllowedAreasIndex({ loaderData, actionData }: Route.ComponentProps) {
  const allowedAreas = loaderData.allowedAreas;
  const { pathname } = useLocation();
  type AllowedAreaRow = Awaited<typeof allowedAreas>[number];
  const [selectedAllowedArea, setSelectedAllowedArea] = useState<AllowedAreaRow | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex">
        <h2 className="text-3xl font-bold">Áreas autorizadas</h2>
        <CreateAllowedAreaForm sites={loaderData.sites} errors={actionData?.errors} actionPath={pathname} />
      </div>
      <DataTable
        columns={allowedAreaColumns}
        data={allowedAreas}
        refreshDataKey="allowedAreas"
        globalFilterColumns={["name", "siteName"]}
        filterPlaceholder="Buscar por centro o área..."
        advancedFilters={[{
          param: "siteId", label: "Centro", type: "select", columnId: "siteId",
          options: loaderData.sites.map((site) => ({ value: site.id, label: site.name })),
        }]}
        quickFilters={catalogRecentFilter()}
        onRowClick={setSelectedAllowedArea}
        getRowLabel={(area) => `Abrir ficha del área autorizada ${area.name} del centro ${area.siteName}`}
        onRowsRefresh={(rows) =>
          setSelectedAllowedArea((current) =>
            current ? rows.find((area) => area.id === current.id) ?? current : null,
          )
        }
      />
      {selectedAllowedArea ? (
        <AllowedAreaDetailsForm
          allowedArea={selectedAllowedArea}
          siteName={selectedAllowedArea.siteName}
          actionPath={pathname}
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
