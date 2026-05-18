import DataTable from "~/components/ui/data-table";
import type { Route } from "./+types/home";
import { validateUserRole } from "~/lib/auth.server";
import { getManyAccessLogs } from "~/lib/services/access-log.server";
import { getAccessLogColumns } from "~/lib/columns/access-log";
import { useMemo } from "react";

export async function loader({ request }: Route.LoaderArgs) {
  await validateUserRole(request, "ACCESS_MONITOR");

  const accessLogs = await getManyAccessLogs({
    date: new Date(),
    status: "INSIDE",
  });

  return { accessLogs };
}

export default function MonitorHome({ loaderData }: Route.ComponentProps) {
  const columns = useMemo(() => getAccessLogColumns("createdBy"), []);

  return (
    <div className="grid space-y-6">
      <DataTable
        columns={columns}
        data={loaderData.accessLogs}
        showGlobalFilter={false}
        showColumnVisibility={false}
        empty={{
          title: "No existen registros",
          description:
            "No existen registros de personas que se encuentren, actualmente, dentro de las instalaciones",
        }}
      />
    </div>
  );
}
