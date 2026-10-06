import { useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import DataTable from "~/components/ui/data-table";
import SiteDetailsForm from "~/components/models/site/site-details-form";
import { validateUserRole } from "~/lib/auth.server";
import { getManySites, updateSite } from "~/lib/services/sites.server";
import { formatTimestamp } from "~/lib/utils";
import type { Site } from "../../../db/schema";
import type { Route } from "./+types/sites";

const column = createColumnHelper<Site>();
const columns = [
  column.accessor("name", { header: "Nombre" }),
  column.accessor("slug", { header: "Abreviación" }),
  column.accessor("address", {
    header: "Dirección",
    cell: ({ getValue }) => getValue() || "-",
  }),
  column.accessor("createdAt", {
    header: "Creación",
    cell: ({ getValue }) =>
      formatTimestamp({ date: getValue(), template: "dd/MM/yyyy HH:mm" }),
  }),
];

export async function loader({ request }: Route.LoaderArgs) {
  await validateUserRole(request, "SECURITY_MANAGER");
  return { sites: await getManySites() };
}

export async function action({ request }: Route.ActionArgs) {
  await validateUserRole(request, "SECURITY_MANAGER");
  if (request.method.toUpperCase() !== "PATCH") {
    throw new Response("Método no permitido", { status: 405 });
  }

  const formData = await request.formData();
  return updateSite(Object.fromEntries(formData));
}

export default function SecuritySites({ loaderData }: Route.ComponentProps) {
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);

  return (
    <div className="flex flex-col gap-y-4">
      <h2 className="text-3xl font-bold">Centros</h2>
      <DataTable
        columns={columns}
        data={loaderData.sites}
        refreshDataKey="sites"
        globalFilterColumns={["name", "slug", "address"]}
        onRowClick={setSelectedSite}
        getRowLabel={(site) => `Abrir ficha del centro ${site.name}`}
        onRowsRefresh={(rows) =>
          setSelectedSite((current) =>
            current
              ? rows.find((site) => site.id === current.id) ?? current
              : null,
          )
        }
      />
      {selectedSite ? (
        <SiteDetailsForm
          site={selectedSite}
          actionPath="/security/sites"
          canDelete={false}
          open
          onOpenChange={(open) => {
            if (!open) setSelectedSite(null);
          }}
          showTrigger={false}
        />
      ) : null}
    </div>
  );
}
