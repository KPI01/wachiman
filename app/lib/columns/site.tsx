import { createColumnHelper } from "@tanstack/react-table";
import type { Site } from "../../../db/schema";
import { formatTimestamp } from "../utils";

const siteColHelper = createColumnHelper<Site>();

export const siteColumns = [
  siteColHelper.accessor("name", {
    header: "Nombre",
  }),
  siteColHelper.accessor("slug", {
    header: "Abreviación",
  }),
  siteColHelper.accessor("address", {
    header: "Direccion",
    cell: ({ getValue }) => getValue() || "-",
  }),
  siteColHelper.accessor("createdAt", {
    header: "Creación",
    cell: ({ getValue }) =>
      formatTimestamp({ date: getValue(), template: "dd/MM/yyyy HH:mm" }),
  }),
];
