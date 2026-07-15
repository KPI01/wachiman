import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "~/components/ui/navigation-menu";
import { formatTimestamp } from "~/lib/utils";
import { NavLink } from "react-router";

const NAV_LINKS: Array<{ id: string; title: string; href: string }> = [
  {
    id: "access-logs",
    title: "Accesos",
    href: `/security/access-logs?date=${formatTimestamp({ date: new Date(), template: "yyyy-MM-dd" })}`,
  },
  {
    id: "planned-access",
    title: "Solicitudes",
    href: "/security/planned-access",
  },
  {
    id: "external-workers",
    title: "Trabajadores",
    href: "/security/external-workers",
  },
  {
    id: "companies",
    title: "Empresas",
    href: "/security/companies",
  },
  {
    id: "work-categories",
    title: "Categorias",
    href: "/security/work-categories",
  },
  {
    id: "documents",
    title: "Documentacion",
    href: "/security/documents",
  },
  {
    id: "audit-log",
    title: "Auditoria",
    href: "/security/audit-log",
  },
];

export default function SecurityNavMenu() {
  return (
    <NavigationMenu className="border rounded-lg p-1">
      <NavigationMenuList>
        {NAV_LINKS.map((link) => (
          <NavigationMenuItem key={link.id}>
            <NavigationMenuLink asChild>
              <NavLink to={link.href}>{link.title}</NavLink>
            </NavigationMenuLink>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
