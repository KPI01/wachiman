import DataTable from "~/components/ui/data-table";
import { handleCreateAccessLog } from "~/lib/access-log-action";
import { accessLogColumns } from "~/lib/columns/access-log";
import { getAccessLogs } from "~/lib/database/access-log";
import { getSites } from "~/lib/database/site";
import CreateAccessLog from "./create";
import type { Route } from "./+types/index";

export async function loader() {
  const [accessLogs, sites] = await Promise.all([getAccessLogs(), getSites()]);

  return { accessLogs, sites };
}

export async function action({ request }: Route.ActionArgs) {
  const start = performance.now();

  try {
    return await handleCreateAccessLog(request);
  } finally {
    console.log(`[/access-logs] ${(performance.now() - start).toFixed(2)}ms`);
  }
}

export default function IndexAccessLogs({ loaderData }: Route.ComponentProps) {
  return (
    <div className="grid space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Registros de acceso</h2>

        <CreateAccessLog sites={loaderData.sites ?? []} />
      </div>
      <DataTable
        columns={accessLogColumns}
        data={loaderData.accessLogs ?? []}
        globalFilterColumns={[
          "fullNameSnapshot",
          "legalIdSnapshot",
          "companyNameSnapshot",
          "vehicleDetails",
        ]}
        empty={{
          title: "No hay accesos registrados",
          description: "Los registros de acceso creados apareceran aqui.",
        }}
        filterPlaceholder="Escribe aqui para empezar a buscar..."
      />
    </div>
  );
}
