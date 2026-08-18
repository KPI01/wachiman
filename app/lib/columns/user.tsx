import { createColumnHelper } from "@tanstack/react-table";
import type { Department, Site, User } from "../../../db/schema";
import { formatTimestamp } from "../utils";
import UserDetails from "~/components/models/user/user-details-form";
import TrashUserBtn from "~/components/models/user/trash-user-btn";
import ResetPasswordForm from "~/components/models/user/reset-password-form";

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
      header: "Acciones",
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <UserDetails
            user={row.original}
            sites={sites}
            departments={departments}
          />
          <ResetPasswordForm userId={row.original.id} />
          <TrashUserBtn userId={row.original.id} />
        </div>
      ),
    }),
  ];
}
