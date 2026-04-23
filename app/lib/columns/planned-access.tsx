import { createColumnHelper } from "@tanstack/react-table";
import type { PlannedAccess, User } from "../../../prisma/generated/prisma/client";
import { formatTimestamp } from "../utils";
import { PlannedAccessDetails } from "~/routes/admin/planned-accesses/detail";
import { PLANNED_ACCESS_STATUS_LABELS } from "~/lib/models/planned-access";

interface PlannedAccessRow extends PlannedAccess {
  approvedBy?: Pick<User, "id" | "fullName"> | null;
  _count?: {
    plannedAccessPersons: number;
    plannedAccessVehicles: number;
  };
}

const plannedAccessColHelper = createColumnHelper<PlannedAccessRow>();

export function getPlannedAccessColumns(users: Pick<User, "id" | "fullName">[]) {
  return [
    plannedAccessColHelper.accessor("expectedStartDate", {
      header: "Inicio previsto",
      cell: ({ getValue }) =>
        formatTimestamp({ date: getValue(), template: "dd/MM/yyyy HH:mm" }),
    }),
    plannedAccessColHelper.accessor("expectedEndDate", {
      header: "Fin previsto",
      cell: ({ getValue }) =>
        getValue()
          ? formatTimestamp({ date: getValue()!, template: "dd/MM/yyyy HH:mm" })
          : "-",
    }),
    plannedAccessColHelper.accessor("status", {
      header: "Estado",
      cell: ({ getValue }) => PLANNED_ACCESS_STATUS_LABELS[getValue()],
    }),
    plannedAccessColHelper.accessor("approvedBy.fullName", {
      header: "Aprobado por",
      cell: ({ row }) => row.original.approvedBy?.fullName ?? "-",
    }),
    plannedAccessColHelper.accessor("_count.plannedAccessPersons", {
      header: "Personas",
      cell: ({ row }) => row.original._count?.plannedAccessPersons ?? 0,
    }),
    plannedAccessColHelper.accessor("_count.plannedAccessVehicles", {
      header: "Vehiculos",
      cell: ({ row }) => row.original._count?.plannedAccessVehicles ?? 0,
    }),
    plannedAccessColHelper.accessor("createdAt", {
      header: "Creación",
      cell: ({ getValue }) =>
        formatTimestamp({ date: getValue(), template: "dd/MM/yyyy HH:mm" }),
    }),
    plannedAccessColHelper.display({
      id: "actions",
      cell: ({ row }) => (
        <div className="flex gap-3 items-center justify-end">
          <PlannedAccessDetails
            plannedAccess={row.original}
            users={users}
          />
        </div>
      ),
    }),
  ];
}
