import { validateUserRole } from "~/lib/auth.server";
import type { Route } from "./+types/external-workers";
import { Separator } from "~/components/ui/separator";
import DataTable from "~/components/ui/data-table";
import { getExternalWorkerColumns } from "~/lib/columns/external-worker";
import CreateExternalWorkerForm from "~/components/models/external-worker/create-external-worker-form";
import { useMemo, useState } from "react";
import {
  createExternalWorker,
  deleteExternalWorker,
  getManyExternalWorkers,
  updateExternalWorker,
} from "~/lib/services/external-worker.server";
import { getManyCompanies } from "~/lib/services/company.server";
import { getManyWorkCategories } from "~/lib/services/work-category.server";
import { EXTERNAL_WORKER_QUICK_FILTERS } from "~/components/ui/table-filter-presets";
import { isTableOnlyDataRequest } from "~/lib/table-query.server";
import ExternalWorkerDetailsForm from "~/components/models/external-worker/external-worker-details-form";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await validateUserRole(request, [
    "ADMIN",
    "SECURITY_MANAGER",
    "ACCESS_APPROVER",
  ]);

  const url = new URL(request.url);
  const recentAfter = url.searchParams.get("recent") === "30days"
    ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1_000)
    : undefined;
  const workerFilters = {
    query: url.searchParams.get("q")?.trim() || undefined,
    companyId: url.searchParams.get("companyId") || undefined,
    workCategoryId: url.searchParams.get("workCategoryId") || undefined,
    createdAfter: recentAfter,
  };

  if (isTableOnlyDataRequest(request)) {
    return {
      workers: getManyExternalWorkers(workerFilters),
      companies: [],
      workCategories: [],
      userId: user.id,
    };
  }

  const [companies, workCategories] = await Promise.all([
    getManyCompanies(),
    getManyWorkCategories(),
  ]);
  const workers = getManyExternalWorkers(workerFilters);

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
  const columns = useMemo(
    () => getExternalWorkerColumns(),
    [],
  );
  const workers = loaderData.workers;
  type WorkerRow = Awaited<typeof workers>[number];
  const [selectedWorker, setSelectedWorker] = useState<WorkerRow | null>(null);

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex">
        <h2 className="text-3xl font-bold">Trabajadores Externos</h2>
        <CreateExternalWorkerForm
          errors={actionData?.errors}
          companies={loaderData.companies}
          workCategories={loaderData.workCategories}
          actionPath="."
        />
      </div>
      <DataTable
        columns={columns}
        data={workers}
        refreshDataKey="workers"
        globalFilterColumns={[
          "names",
          "surnames",
          "legalId",
          "companyName",
          "workCategoryName",
        ]}
        quickFilters={EXTERNAL_WORKER_QUICK_FILTERS}
        advancedFilters={[
          { param: "companyId", label: "Empresa", type: "select", options: loaderData.companies.map((company) => ({ value: company.id, label: company.name })) },
          { param: "workCategoryId", label: "Tipo de trabajo", type: "select", options: loaderData.workCategories.map((category) => ({ value: category.id, label: category.name })) },
        ]}
        serverFiltering
        onRowClick={setSelectedWorker}
        getRowLabel={(worker) =>
          `Abrir ficha de ${[worker.firstName, worker.middleName, worker.lastName, worker.secondLastName].filter(Boolean).join(" ")}`
        }
        onRowsRefresh={(rows) =>
          setSelectedWorker((current) =>
            current ? rows.find((worker) => worker.id === current.id) ?? current : null,
          )
        }
      />
      {selectedWorker ? (
        <ExternalWorkerDetailsForm
          worker={selectedWorker}
          companies={loaderData.companies}
          workCategories={loaderData.workCategories}
          actionPath="."
          open
          onOpenChange={(open) => {
            if (!open) setSelectedWorker(null);
          }}
          showTrigger={false}
        />
      ) : null}
    </div>
  );
}
