import { createColumnHelper } from "@tanstack/react-table";
import type { AllowedArea } from "../../../db/schema";
import { formatTimestamp } from "../utils";

const helper = createColumnHelper<AllowedArea & { siteName: string }>();

export const allowedAreaColumns = [
  helper.accessor("siteName", { header: "Centro" }),
  helper.accessor("name", { header: "Nombre" }),
  helper.accessor("createdAt", {
    header: "Creación",
    cell: ({ getValue }) => formatTimestamp({ date: getValue(), template: "dd/MM/yyyy HH:mm" }),
  }),
];
