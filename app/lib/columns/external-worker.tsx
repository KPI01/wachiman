import { createColumnHelper } from "@tanstack/react-table";
import type { ExternalWorkerListItem } from "../database/external-worker.server";
import { formatTimestamp } from "../utils";

type ExternalWorkerRow = ExternalWorkerListItem;

const externalWorkerColHelper = createColumnHelper<ExternalWorkerRow>();

export function getExternalWorkerColumns() {
  return [
    externalWorkerColHelper.accessor(
      (worker) => [worker.firstName, worker.middleName].filter(Boolean).join(" "),
      {
        id: "names",
        header: "Nombres",
      },
    ),
    externalWorkerColHelper.accessor(
      (worker) => [worker.lastName, worker.secondLastName].filter(Boolean).join(" "),
      {
        id: "surnames",
        header: "Apellidos",
      },
    ),
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
      header: "Tipo de trabajo",
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
  ];
}
