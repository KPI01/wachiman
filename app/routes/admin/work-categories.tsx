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

export async function loader({ request }: Route.LoaderArgs) {
  await validateUserRole(request, [
    "ADMIN",
    "SECURITY_MANAGER",
    "ACCESS_APPROVER",
  ]);

  const workCategories = await getManyWorkCategories();

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
  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex">
        <h2 className="text-3xl font-bold">Categorias Laborales</h2>
        <CreateWorkCategoryForm errors={actionData?.errors} />
      </div>
      <Separator />
      <DataTable
        columns={workCategoryColumns}
        data={loaderData.workCategories ?? []}
        globalFilterColumns={["name", "description"]}
      />
    </div>
  );
}
