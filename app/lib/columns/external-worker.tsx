import { createColumnHelper } from "@tanstack/react-table";
import type {
  Company,
  WorkCategory,
} from "../../../prisma/generated/prisma/client";
import type { ExternalWorkerListItem } from "../database/external-worker.server";
import { formatTimestamp } from "../utils";
import ExternalWorkerDetailsForm from "~/components/models/external-worker/external-worker-details-form";
import DeleteExternalWorkerBtn from "~/components/models/external-worker/delete-external-worker-btn";

type ExternalWorkerRow = ExternalWorkerListItem;

const externalWorkerColHelper = createColumnHelper<ExternalWorkerRow>();

export function getExternalWorkerColumns(
  companies: Company[],
  workCategories: WorkCategory[],
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
      header: "Empresa",
      cell: ({ getValue }) => getValue() || "-",
    }),
    externalWorkerColHelper.accessor("workCategory.name", {
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
      cell: ({ row }) => (
        <div className="flex gap-3 items-center justify-end">
          <ExternalWorkerDetailsForm
            worker={row.original}
            companies={companies}
            workCategories={workCategories}
          />
          <DeleteExternalWorkerBtn workerId={row.original.id} />
        </div>
      ),
    }),
  ];
}
