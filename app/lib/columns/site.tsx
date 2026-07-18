import { createColumnHelper } from "@tanstack/react-table";
import type { Site } from "../../../db/schema";
import { formatTimestamp } from "../utils";
import SiteDetailsForm from "~/components/models/site/site-details-form";
import DeleteSiteBtn from "~/components/models/site/delete-site-btn";

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
        <SiteDetailsForm site={row.original} />
        <DeleteSiteBtn siteId={row.original.id} />
      </div>
    ),
  }),
];
