import { validateUserRole } from "~/lib/auth.server";
import type { Route } from "./+types/external-workers";
import { Separator } from "~/components/ui/separator";
import DataTable from "~/components/ui/data-table";
import { getExternalWorkerColumns } from "~/lib/columns/external-worker";
import CreateExternalWorkerForm from "~/components/models/external-worker/create-external-worker-form";
import {
  createExternalWorker,
  deleteExternalWorker,
  getManyExternalWorkers,
  updateExternalWorker,
} from "~/lib/services/external-worker.server";
import { getManyCompanies } from "~/lib/services/company.server";
import { getManyWorkCategories } from "~/lib/services/work-category.server";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await validateUserRole(request, [
    "ADMIN",
    "SECURITY_MANAGER",
    "ACCESS_APPROVER",
  ]);

  const [workers, companies, workCategories] = await Promise.all([
    getManyExternalWorkers(),
    getManyCompanies(),
    getManyWorkCategories(),
  ]);

  return { workers, companies, workCategories, userId: user.id };
}

export async function action({ request }: Route.ActionArgs) {
  const user = await validateUserRole(request, [
    "ADMIN",
    "SECURITY_MANAGER",
    "ACCESS_APPROVER",
  ]);

  const method = request.method.toUpperCase();
  const rawFormData = await request.formData();
  const jsonData = Object.fromEntries(rawFormData);

  if (method === "POST") {
    return await createExternalWorker(jsonData, user.id);
  }

  if (method === "PUT" || method === "PATCH") {
    return await updateExternalWorker(jsonData, user.id);
  }

  if (method === "DELETE") {
    return await deleteExternalWorker(jsonData, user.id);
  }
}

export default function ExternalWorkersIndex({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex">
        <h2 className="text-3xl font-bold">Trabajadores Externos</h2>
        <CreateExternalWorkerForm
          errors={actionData?.errors}
          companies={loaderData.companies}
          workCategories={loaderData.workCategories}
        />
      </div>
      <DataTable
        columns={getExternalWorkerColumns(
          loaderData.companies,
          loaderData.workCategories,
        )}
        data={loaderData.workers ?? []}
        globalFilterColumns={["firstName", "lastName", "legalId", "company.name", "workCategory.name"]}
      />
    </div>
  );
}
