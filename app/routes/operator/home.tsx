import DataTable from "~/components/ui/data-table";
import CreateAccessLog from "~/routes/access-logs/create";
import { accessLogColumns } from "~/lib/columns/access-log";
import { getAccessLogs } from "~/lib/database/access-log";
import { formatTimestamp } from "~/lib/utils";
import { getSessionSite } from "~/lib/session";
import type { Route } from "./+types/home";

export async function loader({ request }: Route.LoaderArgs) {
  const sessionSite = await getSessionSite(request);

  if (!sessionSite) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const accessLogs = await getAccessLogs({
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
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <h2 className="text-xl font-bold">Accesos</h2>

        <CreateAccessLog
          sites={[loaderData.site]}
          actionPath="/access-logs"
          lockedSiteId={loaderData.site.id}
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
