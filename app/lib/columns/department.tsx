import { createColumnHelper } from "@tanstack/react-table";
import type { Department } from "../../../generated/prisma/client";
import { formatTimestamp } from "../utils";
import { DepartmentDetails } from "~/routes/admin/departments/detail";
import DeleteDepartment from "~/routes/admin/departments/delete";

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
  departmentColHelper.display({
    id: "actions",
    cell: ({ row }) => (
      <div className="flex gap-3 items-center justify-end">
        <DepartmentDetails department={row.original} />
        <DeleteDepartment departmentId={row.original.id} />
      </div>
    ),
  }),
];
