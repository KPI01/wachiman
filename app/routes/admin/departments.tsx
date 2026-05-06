import DataTable from "~/components/ui/data-table";
import { departmentColumns } from "~/lib/columns/department";
import { validateUserRole } from "~/lib/auth.server";
import {
  createDepartment,
  deleteDepartment,
  getManyDepartments,
  updateDepartment,
} from "~/lib/services/departments.server";
import CreateDepartmentForm from "~/components/models/department/create-department-form";
import type { Route } from "./+types/departments";

export async function loader({ request }: Route.LoaderArgs) {
  await validateUserRole(request, "ADMIN");

  const departments = await getManyDepartments();

  return { departments };
}

export async function action({ request }: Route.ActionArgs) {
  await validateUserRole(request, "ADMIN");
  const method = request.method.toUpperCase();
  const rawFormData = await request.formData();
  const jsonData = Object.fromEntries(rawFormData);

  if (method === "POST") {
    return await createDepartment(jsonData);
  }

  if (method === "PUT" || method === "PATCH") {
    return await updateDepartment(jsonData);
  }

  if (method === "DELETE") {
    return await deleteDepartment(jsonData);
  }
}

export default function IndexDepartments({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  return (
    <div className="grid space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Departamentos</h2>

        <CreateDepartmentForm errors={actionData?.errors} />
      </div>
      <DataTable
        columns={departmentColumns}
        data={loaderData.departments ?? []}
        globalFilterColumns={["name", "slug"]}
      />
    </div>
  );
}
