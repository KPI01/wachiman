import { createColumnHelper } from "@tanstack/react-table";
import type { Department } from "../../../prisma/generated/prisma/client";
import { formatTimestamp } from "../utils";
import DepartmentDetailsForm from "~/components/models/department/department-details-form";
import DeleteDepartmentBtn from "~/components/models/department/delete-department-btn";

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
        <DepartmentDetailsForm department={row.original} />
        <DeleteDepartmentBtn departmentId={row.original.id} />
      </div>
    ),
  }),
];
