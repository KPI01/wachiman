import { createColumnHelper } from "@tanstack/react-table";
import type { User } from "../../../generated/prisma/client";
import { formatTimestamp } from "../utils";

const userColHelper = createColumnHelper<User>();

export const userColumns = [
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
];
