import { Outlet } from "react-router";
import { UserRole } from "../../../generated/prisma/enums";
import AppSidebar, { type SidebarLinkItem } from "~/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar";
import { requireRole } from "~/middleware/require-role";
import { requireSession } from "~/middleware/require-session";
import type { Route } from "./+types/layout";

const SIDEBAR_ITEMS: Array<SidebarLinkItem> = [
  {
    label: "Accesos",
    children: [{ label: "Accesos del dia", href: "/operator" }],
  },
];

export const middleware: Route.MiddlewareFunction[] = [
  requireSession,
  requireRole([UserRole.ACCESS_OPERATOR]),
];

export async function loader() {
  return null;
}

export default function OperatorLayout() {
  return (
    <div className="p-4">
      <Outlet />
    </div>
  );
}
