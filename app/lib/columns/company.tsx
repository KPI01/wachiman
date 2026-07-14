import { createColumnHelper } from "@tanstack/react-table";
import type { Company } from "../../../prisma/generated/prisma/client";
import { formatTimestamp } from "../utils";
import CompanyDetailsForm from "~/components/models/company/company-details-form";
import DeleteCompanyBtn from "~/components/models/company/delete-company-btn";

const companyColHelper = createColumnHelper<Company>();

export const companyColumns = [
  companyColHelper.accessor("name", {
    header: "Nombre",
  }),
  companyColHelper.accessor("slug", {
    header: "Abreviación",
  }),
  companyColHelper.accessor("cif", {
    header: "CIF",
    cell: ({ getValue }) => getValue() || "-",
  }),
  companyColHelper.accessor("phone", {
    header: "Telefono",
    cell: ({ getValue }) => getValue() || "-",
  }),
  companyColHelper.accessor("email", {
    header: "Email",
    cell: ({ getValue }) => getValue() || "-",
  }),
  companyColHelper.accessor("createdAt", {
    header: "Creación",
    cell: ({ getValue }) =>
      formatTimestamp({ date: getValue(), template: "dd/MM/yyyy HH:mm" }),
  }),
  companyColHelper.display({
    id: "actions",
    cell: ({ row }) => (
      <div className="flex gap-3 items-center justify-end">
        <CompanyDetailsForm company={row.original} />
        <DeleteCompanyBtn companyId={row.original.id} />
      </div>
    ),
  }),
];
