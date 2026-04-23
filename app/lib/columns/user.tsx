import { createColumnHelper } from "@tanstack/react-table";
import type { Department, Site, User } from "../../../prisma/generated/prisma/client";
import { formatTimestamp } from "../utils";
import { UserDetails } from "~/routes/admin/users/detail";
import TrashUser from "~/routes/admin/users/trash";

const userColHelper = createColumnHelper<User>();

export function getUserColumns(sites: Site[], departments: Department[]) {
  return [
    userColHelper.accessor("fullName", {
      header: "Nombre completo",
    }),
    userColHelper.accessor("username", {
      header: "Nombre de usuario",
    }),
    userColHelper.accessor("isActive", {
      header: "Activo",
      cell: ({ getValue }) => (getValue() ? "S" : "N"),
    }),
    userColHelper.accessor("createdAt", {
      header: "Creación",
      cell: ({ getValue }) =>
        formatTimestamp({ date: getValue(), template: "dd/MM/yyyy HH:mm" }),
    }),
    userColHelper.display({
      id: "actions",
      cell: ({ row }) => (
        <div className="flex gap-3 items-center justify-end">
          <UserDetails
            user={row.original}
            sites={sites}
            departments={departments}
          />
          <TrashUser userId={row.original.id} />
        </div>
      ),
    }),
  ];
}
