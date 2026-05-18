import DataTable from "~/components/ui/data-table";
import CreateAccessLogForm from "~/components/models/access-logs/create-access-log-form";
import { accessLogColumns } from "~/lib/columns/access-log";
import { getManyAccessLogs } from "~/lib/services/access-log.server";
import { getSessionSite } from "~/lib/session.server";
import type { Route } from "./+types/home";
import { validateUserRole } from "~/lib/auth.server";
import { createAccessLog } from "~/lib/services/access-log.server";
import { getFormData } from "~/lib/services/http.server";

export async function loader({ request }: Route.LoaderArgs) {
  await validateUserRole(request, "ACCESS_OPERATOR");
  const sessionSite = await getSessionSite(request);

  if (!sessionSite) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const accessLogs = await getManyAccessLogs({
    siteId: sessionSite.id,
    timestampField: "entryTimestamp",
    date: new Date(),
  });

  return {
    accessLogs,
    site: sessionSite,
  };
}

export async function action({ request }: Route.ActionArgs) {
  const user = await validateUserRole(request, "ACCESS_OPERATOR");
  const sessionSite = await getSessionSite(request);

  if (!sessionSite) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const data = await getFormData(request);

  const result = await createAccessLog(data, {
    authorUsername: user.username,
    lockedSiteId: sessionSite.id,
  });

  return {
    success: result.success,
    errors: result.errors,
  };
}

export default function OperatorHome({ loaderData }: Route.ComponentProps) {
  return (
    <div className="grid space-y-6">
      <div className="flex justify-end">
        <CreateAccessLogForm
          sites={[loaderData.site]}
          actionPath="/operator?index"
          lockedSiteId={loaderData.site.id}
          buttonLabel="Registrar acceso"
        />
      </div>

      <DataTable
        columns={accessLogColumns}
        data={loaderData.accessLogs ?? []}
        showGlobalFilter={false}
        showColumnVisibility={false}
        empty={{
          title: "No hay accesos registrados hoy",
          description:
            "Los accesos del centro para la fecha actual apareceran aqui.",
        }}
      />
    </div>
  );
}
