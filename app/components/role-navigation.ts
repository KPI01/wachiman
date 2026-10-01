import {
  Building2Icon,
  ArchiveRestoreIcon,
  ClipboardCheckIcon,
  ClipboardListIcon,
  // Comentado: el flujo de documentación ya no se muestra.
  // FileArchiveIcon,
  GaugeIcon,
  HistoryIcon,
  KeyRoundIcon,
  LayoutDashboardIcon,
  Settings2Icon,
  ShieldCheckIcon,
  TagsIcon,
  UsersIcon,
} from "lucide-react";
import type { UserRole } from "../../db/enums";
import type { SidebarLinkItem } from "./app-sidebar";

const item = (label: string, href: string, icon: typeof LayoutDashboardIcon) => ({
  label,
  href,
  icon,
});

export const ROLE_NAVIGATION: Record<UserRole, SidebarLinkItem[]> = {
  ADMIN: [
    item("Inicio", "/admin", LayoutDashboardIcon),
    {
      label: "Maestros",
      children: [
        item("Usuarios", "/admin/users", UsersIcon),
        item("Centros", "/admin/sites", Building2Icon),
        item("Departamentos", "/admin/departments", TagsIcon),
        item("Empresas", "/admin/companies", Building2Icon),
        item("Tipos de trabajo", "/admin/work-categories", TagsIcon),
        item("Áreas autorizadas", "/admin/allowed-areas", TagsIcon),
      ],
    },
    {
      label: "Trabajadores",
      children: [
        item("Trabajadores externos", "/admin/external-workers", UsersIcon),
        // Comentado: el flujo de documentación ya no se muestra.
        // item("Documentación", "/admin/documents", FileArchiveIcon),
      ],
    },
    {
      label: "Eventos",
      children: [
        item("Registros de acceso", "/admin/access-logs", KeyRoundIcon),
        item("Solicitudes de acceso", "/admin/planned-access", ClipboardListIcon),
        item("Auditoría", "/admin/audit-log", HistoryIcon),
      ],
    },
    {
      label: "Sistema",
      children: [
        item("Configuración", "/admin/settings", Settings2Icon),
        item("Copias de seguridad", "/admin/backups", ArchiveRestoreIcon),
      ],
    },
  ],
  SECURITY_MANAGER: [
    item("Inicio", "/security", LayoutDashboardIcon),
    {
      label: "Operación",
      children: [
        item("Accesos", "/security/access-logs", KeyRoundIcon),
        item("Solicitudes", "/security/planned-access", ClipboardListIcon),
        item("Trabajadores", "/security/external-workers", UsersIcon),
      ],
    },
    {
      label: "Catálogos",
      children: [
        item("Empresas", "/security/companies", Building2Icon),
        item("Tipos de trabajo", "/security/work-categories", TagsIcon),
        item("Áreas autorizadas", "/security/allowed-areas", TagsIcon),
        // Comentado: el flujo de documentación ya no se muestra.
        // item("Documentación", "/security/documents", FileArchiveIcon),
      ],
    },
    item("Auditoría", "/security/audit-log", HistoryIcon),
  ],
  ACCESS_APPROVER: [
    item("Inicio", "/approver", LayoutDashboardIcon),
    {
      label: "Operación",
      children: [
        item("Solicitudes", "/approver/planned-access", ClipboardCheckIcon),
        item("Accesos", "/approver/access-logs", KeyRoundIcon),
        item("Trabajadores", "/approver/external-workers", UsersIcon),
      ],
    },
    {
      label: "Catálogos",
      children: [
        item("Empresas", "/approver/companies", Building2Icon),
        item("Tipos de trabajo", "/approver/work-categories", TagsIcon),
        item("Áreas autorizadas", "/approver/allowed-areas", TagsIcon),
        // Comentado: el flujo de documentación ya no se muestra.
        // item("Documentación", "/approver/documents", FileArchiveIcon),
      ],
    },
  ],
  ACCESS_REQUESTER: [
    item("Inicio", "/requester", LayoutDashboardIcon),
    item("Solicitudes", "/requester/planned-access", ClipboardListIcon),
  ],
  ACCESS_OPERATOR: [item("Inicio", "/operator", GaugeIcon)],
  ACCESS_MONITOR: [item("Inicio", "/monitor", ShieldCheckIcon)],
};
