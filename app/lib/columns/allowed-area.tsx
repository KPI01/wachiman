import { createColumnHelper } from "@tanstack/react-table";
import type { AllowedArea } from "../../../db/schema";
import { formatTimestamp } from "../utils";
import AllowedAreaDetailsForm from "~/components/models/allowed-area/allowed-area-details-form";
import DeleteAllowedAreaBtn from "~/components/models/allowed-area/delete-allowed-area-btn";

const helper = createColumnHelper<AllowedArea>();

export const allowedAreaColumns = [
  helper.accessor("name", { header: "Nombre" }),
  helper.accessor("createdAt", {
    header: "Creación",
    cell: ({ getValue }) => formatTimestamp({ date: getValue(), template: "dd/MM/yyyy HH:mm" }),
  }),
  helper.display({
    id: "actions",
    header: "Acciones",
    cell: ({ row }) => (
      <div className="flex items-center justify-end gap-1">
        <AllowedAreaDetailsForm allowedArea={row.original} />
        <DeleteAllowedAreaBtn allowedAreaId={row.original.id} />
      </div>
    ),
  }),
];
