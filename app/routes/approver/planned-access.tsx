import DataTable from "~/components/ui/data-table";
import { plannedAccessColumns } from "~/lib/columns/planned-access";
import { validateUserRole } from "~/lib/auth.server";
import {
  getManyPlannedAccesses,
  updatePlannedAccessStatus,
} from "~/lib/services/planned-access.server";
import type { Route } from "./+types/planned-access";
import { getSessionSite } from "~/lib/session.server";
import { redirect } from "react-router";

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

  const plannedAccesses = await getManyPlannedAccesses({
    siteId: sessionSite.id,
  });

  return { plannedAccesses };
}

export async function action({ request }: Route.ActionArgs) {
  const user = await validateUserRole(request, "ACCESS_APPROVER");
  const method = request.method.toUpperCase();
  const rawFormData = await request.formData();

  if (method === "POST" || method === "PUT" || method === "PATCH") {
    const result = await updatePlannedAccessStatus(Object.fromEntries(rawFormData), {
      authorUsername: user.username,
      canApprove: true,
      lockedSiteId: (await getSessionSite(request))?.id,
    });
    return result.success ? redirect("/approver/planned-access") : result;
  }

  return null;
}

export default function ApproverPlannedAccess({
  loaderData,
}: Route.ComponentProps) {
  const columns = plannedAccessColumns({
    actionPath: "/approver/planned-access",
  });
  return (
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
  );
}
