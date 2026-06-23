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

export async function loader({ request }: Route.LoaderArgs) {
  await validateUserRole(request, "ADMIN");

  const sites = await getManySites();

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
  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex">
        <h2 className="text-3xl font-bold">Centros</h2>
        <CreateSiteForm errors={actionData?.errors} />
      </div>
      <Separator />
      <DataTable
        columns={siteColumns}
        data={loaderData.sites ?? []}
        globalFilterColumns={["name", "slug", "address"]}
      />
    </div>
  );
}
