import DataTable from "~/components/ui/data-table";
import { siteColumns } from "~/lib/columns/site";
import { validateUserRole } from "~/lib/auth.server";
import {
  createSite,
  deleteSite,
  getManySites,
  updateSite,
} from "~/lib/services/sites.server";
import type { Route } from "./+types/sites";
import CreateSiteForm from "~/components/models/site/create-site-form";
import { Separator } from "~/components/ui/separator";
import { catalogRecentFilter } from "~/components/ui/table-filter-presets";
import { useState } from "react";
import SiteDetailsForm from "~/components/models/site/site-details-form";

export async function loader({ request }: Route.LoaderArgs) {
  await validateUserRole(request, "ADMIN");

  const sites = getManySites();

  return { sites };
}

export async function action({ request }: Route.ActionArgs) {
  await validateUserRole(request, "ADMIN");
  const method = request.method.toUpperCase();
  const rawFormData = await request.formData();
  const jsonData = Object.fromEntries(rawFormData);

  if (method === "POST") {
    return await createSite(jsonData);
  }

  if (method === "PUT" || method === "PATCH") {
    return await updateSite(jsonData);
  }

  if (method === "DELETE") {
    return await deleteSite(jsonData);
  }
}

export default function IndexSites({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const sites = loaderData.sites;
  type SiteRow = Awaited<typeof sites>[number];
  const [selectedSite, setSelectedSite] = useState<SiteRow | null>(null);

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex">
        <h2 className="text-3xl font-bold">Centros</h2>
        <CreateSiteForm errors={actionData?.errors} />
      </div>
      <DataTable
        columns={siteColumns}
        data={sites}
        refreshDataKey="sites"
        globalFilterColumns={["name", "slug", "address"]}
        quickFilters={catalogRecentFilter()}
        onRowClick={setSelectedSite}
        getRowLabel={(site) => `Abrir ficha del centro ${site.name}`}
        onRowsRefresh={(rows) =>
          setSelectedSite((current) =>
            current ? rows.find((site) => site.id === current.id) ?? current : null,
          )
        }
      />
      {selectedSite ? (
        <SiteDetailsForm
          site={selectedSite}
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
