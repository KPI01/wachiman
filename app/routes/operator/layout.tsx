import { LogOutIcon } from "lucide-react";
import { Outlet, useSubmit } from "react-router";
import { Button } from "~/components/ui/button";
import type { Route } from "./+types/layout";
import LogoBranding from "~/components/logo-branding";
import { validateUserRole } from "~/lib/auth.server";
import { Separator } from "~/components/ui/separator";

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
      <header className="flex gap-3 justify-between items-center">
        <LogoBranding
          title="Control de Accesos"
          username={loaderData.fullName}
        />
        <Button
          variant="outline"
          onClick={() => handleLogout()}
          title="Cerrar sesión"
        >
          <LogOutIcon />
          <span className="sr-only md:not-sr-only">Cerrar sesion</span>
        </Button>
      </header>
      <Separator className="my-4" />
      <Outlet />
    </div>
  );
}
