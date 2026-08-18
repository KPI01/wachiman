import { createColumnHelper } from "@tanstack/react-table";
import type { Company, WorkCategory } from "../../../db/schema";
import type { ExternalWorkerListItem } from "../database/external-worker.server";
import { formatTimestamp } from "../utils";
import ExternalWorkerDetailsForm from "~/components/models/external-worker/external-worker-details-form";
import DeleteExternalWorkerBtn from "~/components/models/external-worker/delete-external-worker-btn";

type ExternalWorkerRow = ExternalWorkerListItem;

const externalWorkerColHelper = createColumnHelper<ExternalWorkerRow>();

export function getExternalWorkerColumns(
  companies: Company[],
  workCategories: WorkCategory[],
  actionPath: string,
) {
  return [
    externalWorkerColHelper.accessor("firstName", {
      header: "Nombre",
    }),
    externalWorkerColHelper.accessor("lastName", {
      header: "Apellidos",
    }),
    externalWorkerColHelper.accessor("legalId", {
      header: "DNI/NIE",
    }),
    externalWorkerColHelper.accessor("company.name", {
      id: "companyName",
      header: "Empresa",
      cell: ({ getValue }) => getValue() || "-",
    }),
    externalWorkerColHelper.accessor("workCategory.name", {
      id: "workCategoryName",
      header: "Categoria",
      cell: ({ getValue }) => getValue() || "-",
    }),
    externalWorkerColHelper.accessor("phoneNumber", {
      header: "Telefono",
      cell: ({ getValue }) => getValue() || "-",
    }),
    externalWorkerColHelper.accessor("createdAt", {
      header: "Creación",
      cell: ({ getValue }) =>
        formatTimestamp({ date: getValue(), template: "dd/MM/yyyy HH:mm" }),
    }),
    externalWorkerColHelper.display({
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <ExternalWorkerDetailsForm
            worker={row.original}
            companies={companies}
            workCategories={workCategories}
            actionPath={actionPath}
          />
          <DeleteExternalWorkerBtn
            workerId={row.original.id}
            actionPath={actionPath}
          />
        </div>
      ),
    }),
  ];
}
