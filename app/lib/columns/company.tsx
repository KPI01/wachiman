import { createColumnHelper } from "@tanstack/react-table";
import type { Company } from "../../../db/schema";
import { formatTimestamp } from "../utils";

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
];
