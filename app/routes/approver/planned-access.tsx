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

const PLANNED_ACCESS_GLOBAL_FILTER_COLUMNS = [
  "companySnapshot",
  "visitReason",
  "personsDetails",
  "siteName",
  "requestedByName",
];

export async function loader({ request }: Route.LoaderArgs) {
  const user = await validateUserRole(request, "ACCESS_APPROVER");
  const sessionSite = await getSessionSite(request);

  if (!sessionSite) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const [plannedAccesses, workCategories, allowedAreas] = await Promise.all([
    getManyPlannedAccesses({ siteId: sessionSite.id }),
    getManyWorkCategories(),
    getManyAllowedAreas(),
  ]);

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
  const columns = useMemo(
    () => plannedAccessColumns({
      actionPath: "/approver/planned-access",
      allowedActions: ["APPROVE", "REJECT", "CANCEL"],
      sites: [loaderData.site],
      workCategories: loaderData.workCategories ?? [],
      allowedAreas: loaderData.allowedAreas ?? [],
    }),
    [loaderData.site, loaderData.workCategories, loaderData.allowedAreas],
  );
  return (
    <div className="grid space-y-6">
      <div className="flex items-center justify-end">
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
        data={loaderData.plannedAccesses ?? []}
        globalFilterColumns={PLANNED_ACCESS_GLOBAL_FILTER_COLUMNS}
        empty={{
          title: "No hay solicitudes de acceso",
          description: "Las solicitudes de acceso del centro apareceran aqui.",
        }}
        filterPlaceholder="Escribe aqui para empezar a buscar..."
      />
    </div>
  );
}
