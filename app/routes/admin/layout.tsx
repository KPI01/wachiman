import { Outlet } from "react-router";
import { UserRole } from "../../../generated/prisma/enums";
import { requireRole } from "~/middleware/require-role";
import { requireSession } from "~/middleware/require-session";
import type { Route } from "./+types/layout";
import Logout from "../logout";

export const middleware: Route.MiddlewareFunction[] = [
  requireSession,
  requireRole([UserRole.ADMIN]),
];

export async function loader() {
  return null;
}

export default function AdminLayout() {
  return (
    <div>
      Este es el layout del administrador
      <Logout />
      <Outlet />
    </div>
  );
}
