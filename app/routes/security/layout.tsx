import { LogOutIcon } from "lucide-react";
import { NavLink, Outlet, useNavigate, useSubmit } from "react-router";
import type { Route } from "./+types/layout";
import { validateUserRole } from "~/lib/auth.server";
import { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarTrigger } from "~/components/ui/menubar";
import { Separator } from "~/components/ui/separator";
import { Button } from "~/components/ui/button";
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from "~/components/ui/navigation-menu";
import { formatTimestamp } from "~/lib/utils";

export async function loader({ request }: Route.LoaderArgs) {
  return await validateUserRole(request, "SECURITY_MANAGER");
}

export default function SecurityLayout({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate()

  const submit = useSubmit();
  const handleLogout = () => {
    submit(null, {
      method: "POST",
      action: "/auth/logout",
    });
  };
  return (
    <div className="p-4">
      <title>Director de Seguridad</title>
      <header className="mb-6 flex items-center border-b pb-3">
        <div className="flex h-12 w-24 shrink-0 items-center justify-center">
          <img
            src="/logoFruveco.svg"
            alt="Logo de Fruveco"
            className="max-h-full max-w-full object-contain"
          />
        </div>
        <Separator orientation="vertical" className="mx-4" />
        <NavigationMenu className="border rounded-lg p-1">
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <NavLink to="/security">Dashboard</NavLink>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger>
                Accesos
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="w-48">
                  <NavigationMenuLink asChild>
                    <NavLink to={`/security/access-logs?date=${formatTimestamp({ date: new Date(), template: "yyyy-MM-dd" })}`}>
                      Ver todos los accesos
                    </NavLink>
                  </NavigationMenuLink>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
        <Button type="button" variant="outline" className="ms-auto" onClick={() => handleLogout()}>
          <LogOutIcon />
          <span className="sr-only md:not-sr-only">
            Cerrar sesion
          </span>
        </Button>
      </header>
      <Outlet />
    </div >
  );
}