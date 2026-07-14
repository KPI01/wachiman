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
    id: "planned-access",
    title: "Solicitudes",
    href: "/approver/planned-access",
  },
  {
    id: "access-logs",
    title: "Accesos",
    href: `/approver/access-logs?date=${formatTimestamp({ date: new Date(), template: "yyyy-MM-dd" })}`,
  },
  {
    id: "external-workers",
    title: "Trabajadores",
    href: "/approver/external-workers",
  },
  {
    id: "companies",
    title: "Empresas",
    href: "/approver/companies",
  },
  {
    id: "work-categories",
    title: "Categorias",
    href: "/approver/work-categories",
  },
];

export default function ApproverNavMenu() {
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
