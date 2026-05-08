import { LogOutIcon } from "lucide-react";
import { Outlet, useSubmit } from "react-router";
import { Button } from "~/components/ui/button";
import type { Route } from "./+types/layout";
import LogoBranding from "~/components/logo-branding";
import { validateUserRole } from "~/lib/auth.server";

export async function loader({ request }: Route.LoaderArgs) {
  return await validateUserRole(request, "ACCESS_MONITOR");
}

export default function MonitorLayout({ loaderData }: Route.ComponentProps) {
  const submit = useSubmit();
  const handleLogout = () => {
    submit(null, {
      method: "POST",
      action: "/auth/logout",
    });
  };
  return (
    <div className="p-4">
      <title>Monitor de Accesos</title>
      <header className="mb-6 flex justify-between items-center border-b pb-3">
        <LogoBranding
          title="Monitor de Accesos"
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