import { SiteEntity } from "~/lib/database/site.server";
import type { Route } from "./+types";
import DataTable from "~/components/ui/data-table";
import { siteColumns } from "~/lib/columns/site";
import CreateSite from "./create";
import z from "zod";
import { createSiteSchema } from "~/lib/schemas/site";
import { validateUserRole } from "~/lib/auth.server";

export async function loader({ request }: Route.LoaderArgs) {
  await validateUserRole(request, "ADMIN");

  const sites = await SiteEntity.findMany();

  return { sites };
}

export async function action({ request }: Route.ActionArgs) {
  const start = performance.now();

  try {
    await validateUserRole(request, "ADMIN");
    const rawFormData = await request.formData();
    const jsonData = Object.fromEntries(rawFormData);
    const { error, data, success } = await createSiteSchema.safeParseAsync(jsonData);

    if (error) {
      return { errors: z.treeifyError(error) };
    }

    await SiteEntity.create(data);

    return { success };
  } finally {
    console.log(`[/admin/sites] ${(performance.now() - start).toFixed(2)}ms`);
  }
}

export default function IndexSites({ loaderData, actionData }: Route.ComponentProps) {
  return (
    <div className="grid space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Centros</h2>

        <CreateSite errors={actionData?.errors} />
      </div>
      <DataTable
        columns={siteColumns}
        data={loaderData.sites ?? []}
        globalFilterColumns={["name", "slug", "address"]}
      />
    </div>
  );
}
