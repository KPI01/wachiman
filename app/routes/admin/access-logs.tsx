import DataTable from "~/components/ui/data-table";
import { accessLogColumns } from "~/lib/columns/access-log";
import CreateAccessLog from "~/components/models/access-logs/create-access-log-form";
import type { Route } from "./+types/access-logs";
import { validateUserRole } from "~/lib/auth.server";
import { createAccessLog, getManyAccessLogs } from "~/lib/services/access-log.server";
import { getManySites } from "~/lib/services/sites.server";

export async function loader({ request }: Route.LoaderArgs) {
  await validateUserRole(request, "ADMIN");

  const [accessLogs, sites] = await Promise.all([getManyAccessLogs(), getManySites()]);

  return { accessLogs, sites };
}

export async function action({ request }: Route.ActionArgs) {
  await validateUserRole(request, "ADMIN");

  const user = await validateUserRole(request, "ADMIN");
  const rawFormData = await request.formData();
  const jsonData = Object.fromEntries(rawFormData);

  return await createAccessLog(jsonData, { authorUsername: user.username });
}

export default function IndexAccessLogs({ loaderData }: Route.ComponentProps) {
  return (
    <div className="grid space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Registros de acceso</h2>

        <CreateAccessLog sites={loaderData.sites ?? []} actionPath="/admin/access-logs" />
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
