import { Outlet } from "react-router";
import type { Route } from "./+types/layout";
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar";
import AppSidebar, { type SidebarLinkItem } from "~/components/app-sidebar";
import { validateUserRole } from "~/lib/auth.server";

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
      { label: "Solicitudes de acceso", href: "/admin/planned-access" },
    ],
  },
];

export async function loader({ request }: Route.LoaderArgs) {
  await validateUserRole(request, "ADMIN");
  return null;
}

export default function AdminLayout() {
  return (
    <SidebarProvider>
      <title>Administrador</title>
      <AppSidebar title="Control de Accesos" items={SIDEBAR_ITEMS} />
      <SidebarInset className="p-6 max-w-full overflow-auto">
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
