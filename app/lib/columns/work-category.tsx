import { createColumnHelper } from "@tanstack/react-table";
import type { WorkCategory } from "../../../db/schema";
import { formatTimestamp } from "../utils";

const workCategoryColHelper = createColumnHelper<WorkCategory>();

export const workCategoryColumns = [
  workCategoryColHelper.accessor("name", {
    header: "Nombre",
  }),
  workCategoryColHelper.accessor("description", {
    header: "Descripcion",
    cell: ({ getValue }) => getValue() || "-",
  }),
  // Comentado: los requisitos documentales ya no se muestran.
  // workCategoryColHelper.accessor("requiresSpecialPermission", {
  //   header: "Req. Permiso Especial",
  //   cell: ({ getValue }) => (getValue() ? "Si" : "No"),
  // }),
  workCategoryColHelper.accessor("createdAt", {
    header: "Creación",
    cell: ({ getValue }) =>
      formatTimestamp({ date: getValue(), template: "dd/MM/yyyy HH:mm" }),
  }),
];
