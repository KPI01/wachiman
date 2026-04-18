import { createSite, getSites } from "~/lib/database/site";
import type { Route } from "./+types";
import DataTable from "~/components/ui/data-table";
import { siteColumns } from "~/lib/columns/site";
import CreateSite from "./create";
import z from "zod";
import { createSiteSchema } from "~/lib/schemas/site";

export async function loader() {
  const sites = await getSites();

  return { sites };
}

export async function action({ request }: Route.ActionArgs) {
  const start = performance.now();

  try {
    const rawFormData = await request.formData();
    const jsonData = Object.fromEntries(rawFormData);
    const { error, data, success } = await createSiteSchema.safeParseAsync(jsonData);

    if (error) {
      return { errors: z.treeifyError(error) };
    }

    await createSite(data);

    return { success };
  } finally {
    console.log(`[/admin/sites] ${(performance.now() - start).toFixed(2)}ms`);
  }
}

export default function IndexSites({ loaderData }: Route.ComponentProps) {
  return (
    <div className="grid space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Centros</h2>

        <CreateSite />
      </div>
      <DataTable
        columns={siteColumns}
        data={loaderData.sites ?? []}
        globalFilterColumns={["name", "slug", "address"]}
      />
    </div>
  );
}
