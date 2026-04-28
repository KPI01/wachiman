import { EllipsisIcon, LogOutIcon } from "lucide-react";
import { Outlet, useSubmit } from "react-router";
import LogoBranding from "~/components/logo-branding";
import type { Route } from "./+types/layout";
import { validateUserRole } from "~/lib/auth.server";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await validateUserRole(request, "ACCESS_REQUESTER");

  return user;
}

export default function RequesterLayout({ loaderData }: Route.ComponentProps) {
  const submit = useSubmit();

  function handleLogout() {
    submit(null, {
      method: "POST",
      action: "/auth/logout",
    });
  }

  return (
    <div className="p-4">
      <title>Solicitudes de Acceso</title>
      <header className="mb-6 flex items-center justify-between border-b pb-3">
        <LogoBranding
          title="Solicitudes de Acceso"
          username={loaderData.fullName}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <EllipsisIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="min-w-fit" side="left">
            <DropdownMenuItem onClick={handleLogout}>
              <LogOutIcon />
              Cerrar sesion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
      <Outlet />
    </div>
  );
}
