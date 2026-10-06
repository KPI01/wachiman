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
        item("Empresa titular", "/admin/holder-company", Building2Icon),
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
      label: "Maestros",
      children: [
        item("Centros", "/security/sites", Building2Icon),
        item("Empresas", "/security/companies", Building2Icon),
        item("Empresa titular", "/security/holder-company", Building2Icon),
        item("Tipos de trabajo", "/security/work-categories", TagsIcon),
        item("Áreas autorizadas", "/security/allowed-areas", TagsIcon),
      ],
    },
    {
      label: "Trabajadores",
      children: [
        item("Trabajadores externos", "/security/external-workers", UsersIcon),
        // Comentado: el flujo de documentación ya no se muestra.
        // item("Documentación", "/security/documents", FileArchiveIcon),
      ],
    },
    {
      label: "Eventos",
      children: [
        item("Registros de acceso", "/security/access-logs", KeyRoundIcon),
        item("Solicitudes de acceso", "/security/planned-access", ClipboardListIcon),
        item("Auditoría", "/security/audit-log", HistoryIcon),
      ],
    },
  ],
  ACCESS_APPROVER: [
    item("Inicio", "/approver", LayoutDashboardIcon),
    {
      label: "Maestros",
      children: [
        item("Empresas", "/approver/companies", Building2Icon),
        item("Tipos de trabajo", "/approver/work-categories", TagsIcon),
        item("Áreas autorizadas", "/approver/allowed-areas", TagsIcon),
      ],
    },
    {
      label: "Trabajadores",
      children: [
        item("Trabajadores externos", "/approver/external-workers", UsersIcon),
        // Comentado: el flujo de documentación ya no se muestra.
        // item("Documentación", "/approver/documents", FileArchiveIcon),
      ],
    },
    {
      label: "Eventos",
      children: [
        item("Solicitudes de acceso", "/approver/planned-access", ClipboardCheckIcon),
        item("Registros de acceso", "/approver/access-logs", KeyRoundIcon),
      ],
    },
  ],
  ACCESS_REQUESTER: [
    item("Solicitudes de acceso", "/requester/planned-access", ClipboardListIcon),
  ],
  ACCESS_OPERATOR: [item("Inicio", "/operator", GaugeIcon)],
  ACCESS_MONITOR: [item("Inicio", "/monitor", ShieldCheckIcon)],
};
