import z from "zod";
import DataTable from "~/components/ui/data-table";
import { departmentColumns } from "~/lib/columns/department";
import { DepartmentEntity } from "~/lib/database/department.server";
import { createDepartmentSchema } from "~/lib/schemas/department";
import type { Route } from "./+types";
import CreateDepartment from "./create";
import { validateUserRole } from "~/lib/auth.server";

export async function loader({ request }: Route.LoaderArgs) {
  await validateUserRole(request, "ADMIN");

  const departments = await DepartmentEntity.findAll();

  return { departments };
}

export async function action({ request }: Route.ActionArgs) {
  const start = performance.now();

  try {
    await validateUserRole(request, "ADMIN");
    const rawFormData = await request.formData();
    const jsonData = Object.fromEntries(rawFormData);
    const { error, data, success } =
      await createDepartmentSchema.safeParseAsync(jsonData);

    if (error) {
      return { errors: z.treeifyError(error) };
    }

    await DepartmentEntity.create(data);

    return { success };
  } finally {
    console.log(
      `[/admin/departments] ${(performance.now() - start).toFixed(2)}ms`,
    );
  }
}

export default function IndexDepartments({ loaderData, actionData }: Route.ComponentProps) {
  return (
    <div className="grid space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Departamentos</h2>

        <CreateDepartment errors={actionData?.errors} />
      </div>
      <DataTable
        columns={departmentColumns}
        data={loaderData.departments ?? []}
        globalFilterColumns={["name", "slug"]}
      />
    </div>
  );
}
