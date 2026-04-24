import { Outlet, redirect } from "react-router";
import { UserRole } from "../../../prisma/generated/prisma/enums";
import { getSessionUser } from "~/lib/session.server";
import type { Route } from "./+types/layout";
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar";
import AppSidebar, { type SidebarLinkItem } from "~/components/app-sidebar";

const SIDEBAR_ITEMS: Array<SidebarLinkItem> = [
  {
    label: "Maestros",
    children: [
      { label: "Usuarios", href: "/admin/users" },
      { label: "Centros", href: "/admin/sites" },
      { label: "Departamentos", href: "/admin/departments" },
    ],
  },
  {
    label: "Eventos",
    children: [
      { label: "Registros de acceso", href: "/admin/access-logs" },
      { label: "Solicitudes de acceso", href: "/admin/planned-accesses" },
    ],
  },
];

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getSessionUser(request);

  if (!user) {
    throw redirect("/login");
  }

  if (!user.role || user.role !== UserRole.ADMIN) {
    throw redirect("/unauthorized");
  }

  return null;
}

export default function AdminLayout() {
  return (
    <SidebarProvider>
      <title>Administrador</title>
      <AppSidebar items={SIDEBAR_ITEMS} />
      <SidebarInset className="p-6 max-w-full overflow-auto">
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
