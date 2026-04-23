import { createColumnHelper } from "@tanstack/react-table";
import type {
  PlannedAccess,
  PlannedAccessPerson,
  PlannedAccessVehicle,
  User,
} from "../../../prisma/generated/prisma/client";
import { formatTimestamp } from "../utils";
import { PlannedAccessDetails } from "~/routes/admin/planned-accesses/detail";
import PlannedAccessStatusBadge from "~/components/models/planned-accesses/status-badge";

interface PlannedAccessRow extends PlannedAccess {
  approvedBy?: Pick<User, "id" | "fullName"> | null;
  plannedAccessPersons?: PlannedAccessPerson[];
  plannedAccessVehicles?: PlannedAccessVehicle[];
}

const plannedAccessColHelper = createColumnHelper<PlannedAccessRow>();

export function getPlannedAccessColumns() {
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
      cell: ({ getValue }) => <PlannedAccessStatusBadge status={getValue()} />,
    }),
    plannedAccessColHelper.accessor("approvedBy.fullName", {
      header: "Aprobado por",
      cell: ({ row }) => row.original.approvedBy?.fullName ?? "-",
    }),
    plannedAccessColHelper.accessor("plannedAccessPersons", {
      header: "Personas",
      cell: ({ row }) => row.original.plannedAccessPersons?.length ?? 0,
    }),
    plannedAccessColHelper.accessor("plannedAccessVehicles", {
      header: "Vehiculos",
      cell: ({ row }) => row.original.plannedAccessVehicles?.length ?? 0,
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
          <PlannedAccessDetails plannedAccess={row.original} />
        </div>
      ),
    }),
  ];
}
