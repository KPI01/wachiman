import { LogOutIcon } from "lucide-react";
import { Outlet, useSubmit } from "react-router";
import { Button } from "~/components/ui/button";
import type { Route } from "./+types/layout";
import LogoBranding from "~/components/logo-branding";
import { validateUserRole } from "~/lib/auth.server";

export async function loader({ request }: Route.LoaderArgs) {
  return await validateUserRole(request, "ACCESS_REQUESTER");
}

export default function RequesterLayout({ loaderData }: Route.ComponentProps) {
  const submit = useSubmit();
  const handleLogout = () => {
    submit(null, {
      method: "POST",
      action: "/auth/logout",
    });
  };
  return (
    <div className="p-4">
      <title>Solicitante de Accesos</title>
      <header className="mb-6 flex flex-col gap-3 border-b pb-3 sm:flex-row sm:items-center sm:justify-between">
        <LogoBranding
          title="Solicitudes de Acceso"
          username={loaderData.fullName}
        />
        <Button variant="outline" onClick={() => handleLogout()} title="Cerrar sesión">
          <LogOutIcon />
          <span className="sr-only md:not-sr-only">
            Cerrar sesion
          </span>
        </Button>
      </header>
      <Outlet />
    </div>
  );
}
