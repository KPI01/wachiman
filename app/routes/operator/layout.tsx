import { EllipsisIcon, LogOutIcon } from "lucide-react";
import { Outlet, useSubmit } from "react-router";
import { Button } from "~/components/ui/button";
import type { Route } from "./+types/layout";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import LogoBranding from "~/components/logo-branding";
import { validateUserRole } from "~/lib/auth.server";

export async function loader({ request }: Route.LoaderArgs) {
  return await validateUserRole(request, "ACCESS_OPERATOR");
}

export default function OperatorLayout({ loaderData }: Route.ComponentProps) {
  const submit = useSubmit();
  const handleLogout = () => {
    submit(null, {
      method: "POST",
      action: "/auth/logout",
    });
  };
  return (
    <div className="p-4">
      <title>Portero</title>
      <header className="mb-6 flex justify-between items-center border-b pb-3">
        <LogoBranding
          title="Control de Accesos"
          username={loaderData.fullName}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <EllipsisIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="min-w-fit" side="left">
            <DropdownMenuItem onClick={() => handleLogout()}>
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
