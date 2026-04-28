import DataTable from "~/components/ui/data-table";
import CreateAccessLog from "~/routes/access-logs/create";
import { accessLogColumns } from "~/lib/columns/access-log";
import { AccessLogEntity } from "~/lib/database/access-log.server";
import { getSessionSite } from "~/lib/session.server";
import type { Route } from "./+types/home";
import { validateUserRole } from "~/lib/auth.server";

export async function loader({ request }: Route.LoaderArgs) {
  await validateUserRole(request, "ACCESS_OPERATOR");
  const sessionSite = await getSessionSite(request);

  if (!sessionSite) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const accessLogs = await AccessLogEntity.findMany({
    siteId: sessionSite.id,
    timestampField: "entryTimestamp",
    date: new Date(),
  });

  return {
    accessLogs,
    site: sessionSite,
  };
}

export default function OperatorHome({ loaderData }: Route.ComponentProps) {
  return (
    <div className="grid space-y-6">
      <div className="flex justify-end">
        <CreateAccessLog
          sites={[loaderData.site]}
          actionPath="/access-logs"
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
