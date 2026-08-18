import { createColumnHelper } from "@tanstack/react-table";
import type { WorkCategory } from "../../../db/schema";
import { formatTimestamp } from "../utils";
import WorkCategoryDetailsForm from "~/components/models/work-category/work-category-details-form";
import DeleteWorkCategoryBtn from "~/components/models/work-category/delete-work-category-btn";

const workCategoryColHelper = createColumnHelper<WorkCategory>();

export const workCategoryColumns = [
  workCategoryColHelper.accessor("name", {
    header: "Nombre",
  }),
  workCategoryColHelper.accessor("description", {
    header: "Descripcion",
    cell: ({ getValue }) => getValue() || "-",
  }),
  workCategoryColHelper.accessor("requiresSpecialPermission", {
    header: "Req. Permiso Especial",
    cell: ({ getValue }) => (getValue() ? "Si" : "No"),
  }),
  workCategoryColHelper.accessor("createdAt", {
    header: "Creación",
    cell: ({ getValue }) =>
      formatTimestamp({ date: getValue(), template: "dd/MM/yyyy HH:mm" }),
  }),
  workCategoryColHelper.display({
    id: "actions",
    header: "Acciones",
    cell: ({ row }) => (
      <div className="flex items-center justify-end gap-1">
        <WorkCategoryDetailsForm workCategory={row.original} />
        <DeleteWorkCategoryBtn workCategoryId={row.original.id} />
      </div>
    ),
  }),
];
