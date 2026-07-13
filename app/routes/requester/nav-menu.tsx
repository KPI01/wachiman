import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "~/components/ui/navigation-menu";
import { NavLink } from "react-router";

const NAV_LINKS: Array<{ id: string; title: string; href: string }> = [
  {
    id: "planned-access",
    title: "Solicitudes",
    href: "/requester/planned-access",
  },
];

export default function RequesterNavMenu() {
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
