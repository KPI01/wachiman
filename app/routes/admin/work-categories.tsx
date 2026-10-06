import DataTable from "~/components/ui/data-table";
import { workCategoryColumns } from "~/lib/columns/work-category";
import { validateUserRole } from "~/lib/auth.server";
import {
  createWorkCategory,
  deleteWorkCategory,
  getManyWorkCategories,
  updateWorkCategory,
} from "~/lib/services/work-category.server";
import type { Route } from "./+types/work-categories";
import CreateWorkCategoryForm from "~/components/models/work-category/create-work-category-form";
import { Separator } from "~/components/ui/separator";
import { catalogRecentFilter } from "~/components/ui/table-filter-presets";
import { useState } from "react";
import WorkCategoryDetailsForm from "~/components/models/work-category/work-category-details-form";

export async function loader({ request }: Route.LoaderArgs) {
  await validateUserRole(request, [
    "ADMIN",
    "SECURITY_MANAGER",
    "ACCESS_APPROVER",
  ]);

  const workCategories = getManyWorkCategories();

  return { workCategories };
}

export async function action({ request }: Route.ActionArgs) {
  await validateUserRole(request, [
    "ADMIN",
    "SECURITY_MANAGER",
    "ACCESS_APPROVER",
  ]);

  const method = request.method.toUpperCase();
  const rawFormData = await request.formData();
  const jsonData = Object.fromEntries(rawFormData);

  if (method === "POST") {
    return await createWorkCategory(jsonData);
  }

  if (method === "PUT" || method === "PATCH") {
    return await updateWorkCategory(jsonData);
  }

  if (method === "DELETE") {
    return await deleteWorkCategory(jsonData);
  }
}

export default function WorkCategoriesIndex({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const workCategories = loaderData.workCategories;
  type WorkCategoryRow = Awaited<typeof workCategories>[number];
  const [selectedWorkCategory, setSelectedWorkCategory] = useState<WorkCategoryRow | null>(null);

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex">
        <h2 className="text-3xl font-bold">Tipos de trabajo</h2>
        <CreateWorkCategoryForm errors={actionData?.errors} />
      </div>
      <DataTable
        columns={workCategoryColumns}
        data={workCategories}
        refreshDataKey="workCategories"
        globalFilterColumns={["name", "description"]}
        quickFilters={catalogRecentFilter()}
        onRowClick={setSelectedWorkCategory}
        getRowLabel={(category) => `Abrir ficha del tipo de trabajo ${category.name}`}
        onRowsRefresh={(rows) =>
          setSelectedWorkCategory((current) =>
            current ? rows.find((category) => category.id === current.id) ?? current : null,
          )
        }
      />
      {selectedWorkCategory ? (
        <WorkCategoryDetailsForm
          workCategory={selectedWorkCategory}
          open
          onOpenChange={(open) => {
            if (!open) setSelectedWorkCategory(null);
          }}
          showTrigger={false}
        />
      ) : null}
    </div>
  );
}
