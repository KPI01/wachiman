import { createColumnHelper } from "@tanstack/react-table";
import type { Department } from "../../../db/schema";
import { formatTimestamp } from "../utils";

const departmentColHelper = createColumnHelper<Department>();

export const departmentColumns = [
  departmentColHelper.accessor("name", {
    header: "Nombre",
  }),
  departmentColHelper.accessor("slug", {
    header: "Abreviación",
  }),
  departmentColHelper.accessor("createdAt", {
    header: "Creación",
    cell: ({ getValue }) =>
      formatTimestamp({ date: getValue(), template: "dd/MM/yyyy HH:mm" }),
  }),
];
