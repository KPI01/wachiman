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
import { Separator } from "~/components/ui/separator";
import { catalogRecentFilter } from "~/components/ui/table-filter-presets";
import { useState } from "react";
import DepartmentDetailsForm from "~/components/models/department/department-details-form";

export async function loader({ request }: Route.LoaderArgs) {
  await validateUserRole(request, "ADMIN");

  const departments = getManyDepartments();

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
  const departments = loaderData.departments;
  type DepartmentRow = Awaited<typeof departments>[number];
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentRow | null>(null);

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex">
        <h2 className="text-3xl font-bold">Departamentos</h2>
        <CreateDepartmentForm errors={actionData?.errors} />
      </div>
      <DataTable
        columns={departmentColumns}
        data={departments}
        refreshDataKey="departments"
        globalFilterColumns={["name", "slug"]}
        quickFilters={catalogRecentFilter()}
        onRowClick={setSelectedDepartment}
        getRowLabel={(department) => `Abrir ficha del departamento ${department.name}`}
        onRowsRefresh={(rows) =>
          setSelectedDepartment((current) =>
            current ? rows.find((department) => department.id === current.id) ?? current : null,
          )
        }
      />
      {selectedDepartment ? (
        <DepartmentDetailsForm
          department={selectedDepartment}
          open
          onOpenChange={(open) => {
            if (!open) setSelectedDepartment(null);
          }}
          showTrigger={false}
        />
      ) : null}
    </div>
  );
}
