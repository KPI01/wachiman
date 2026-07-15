import { Outlet } from "react-router";
import type { Route } from "./+types/layout";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "~/components/ui/sidebar";
import AppSidebar, { type SidebarLinkItem } from "~/components/app-sidebar";
import { validateUserRole } from "~/lib/auth.server";

const SIDEBAR_ITEMS: Array<SidebarLinkItem> = [
  {
    label: "Maestros",
    children: [
      { label: "Usuarios", href: "/admin/users" },
      { label: "Centros", href: "/admin/sites" },
      { label: "Departamentos", href: "/admin/departments" },
      { label: "Empresas", href: "/admin/companies" },
      { label: "Categorias laborales", href: "/admin/work-categories" },
    ],
  },
  {
    label: "Trabajadores",
    children: [
      { label: "Trabajadores externos", href: "/admin/external-workers" },
      { label: "Documentacion", href: "/admin/documents" },
    ],
  },
  {
    label: "Eventos",
    children: [
      { label: "Registros de acceso", href: "/admin/access-logs" },
      { label: "Solicitudes de acceso", href: "/admin/planned-access" },
      { label: "Auditoria", href: "/admin/audit-log" },
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
      <AppSidebar title={process.env.APP_NAME} items={SIDEBAR_ITEMS} />
      <SidebarInset className="p-4 md:p-6 max-w-full overflow-auto">
        <div className="flex items-center gap-2 mb-4 md:hidden">
          <SidebarTrigger />
        </div>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
