import { Outlet } from "react-router";
import { UserRole } from "../../../generated/prisma/enums";
import { requireRole } from "~/middleware/require-role";
import { requireSession } from "~/middleware/require-session";
import type { Route } from "./+types/layout";
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar";
import AppSidebar, { type SidebarLinkItem } from "~/components/app-sidebar";

const SIDEBAR_ITEMS: Array<SidebarLinkItem> = [
  { label: "Usuarios", href: "/admin/users" },
];

export const middleware: Route.MiddlewareFunction[] = [
  requireSession,
  requireRole([UserRole.ADMIN]),
];

export async function loader() {
  return null;
}

export default function AdminLayout() {
  return (
    <SidebarProvider>
      <AppSidebar items={SIDEBAR_ITEMS} />
      <SidebarInset className="p-6 max-w-full overflow-auto">
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
