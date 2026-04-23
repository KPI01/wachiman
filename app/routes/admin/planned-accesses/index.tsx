import { PlannedAccessEntity } from "~/lib/database/planned-access.server";
import { UserEntity } from "~/lib/database/user.server";
import type { Route } from "./+types";
import DataTable from "~/components/ui/data-table";
import { getPlannedAccessColumns } from "~/lib/columns/planned-access";
import CreatePlannedAccess from "./create";
import z from "zod";
import { createPlannedAccessSchema } from "~/lib/schemas/planned-access";

export async function loader() {
  const [plannedAccesses, users] = await Promise.all([
    PlannedAccessEntity.findMany(),
    UserEntity.getAll(),
  ]);

  return { plannedAccesses, users };
}

export async function action({ request }: Route.ActionArgs) {
  const start = performance.now();

  try {
    const rawFormData = await request.formData();
    const jsonData = Object.fromEntries(rawFormData);
    const { error, data, success } =
      await createPlannedAccessSchema.safeParseAsync(jsonData);

    if (error) {
      return { errors: z.treeifyError(error) };
    }

    await PlannedAccessEntity.create(data);

    return { success };
  } finally {
    console.log(`[/admin/planned-accesses] ${(performance.now() - start).toFixed(2)}ms`);
  }
}

export default function IndexPlannedAccesses({ loaderData, actionData }: Route.ComponentProps) {
  return (
    <div className="grid space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Accesos planificados</h2>

        <CreatePlannedAccess
          users={loaderData.users ?? []}
          errors={actionData?.errors}
        />
      </div>
      <DataTable
        columns={getPlannedAccessColumns(
          loaderData.users ?? [],
        )}
        data={loaderData.plannedAccesses ?? []}
        globalFilterColumns={["status", "approvedBy.fullName"]}
      />
    </div>
  );
}
