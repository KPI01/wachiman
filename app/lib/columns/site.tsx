import { createColumnHelper } from "@tanstack/react-table";
import type { Site } from "../../../generated/prisma/client";
import { formatTimestamp } from "../utils";
import { SiteDetails } from "~/routes/admin/sites/detail";
import DeleteSite from "~/routes/admin/sites/delete";

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
  siteColHelper.display({
    id: "actions",
    cell: ({ row }) => (
      <div className="flex gap-3 items-center justify-end">
        <SiteDetails site={row.original} />
        <DeleteSite siteId={row.original.id} />
      </div>
    ),
  }),
];
