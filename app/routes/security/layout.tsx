import { LogOutIcon } from "lucide-react";
import { Outlet, useSubmit, NavLink } from "react-router";
import type { Route } from "./+types/layout";
import { validateUserRole } from "~/lib/auth.server";
import { Separator } from "~/components/ui/separator";
import { Button } from "~/components/ui/button";
import SecurityNavMenu from "./nav-menu";
import LogoBranding from "~/components/logo-branding";

export async function loader({ request }: Route.LoaderArgs) {
  return await validateUserRole(request, "SECURITY_MANAGER");
}

export default function SecurityLayout({ loaderData }: Route.ComponentProps) {
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
      <header className="mb-6 flex flex-col gap-3 border-b pb-3 sm:flex-row sm:items-center">
        <LogoBranding
          title="Aprobador de accesos"
          username={loaderData.fullName}
          href="/security"
        />
        <Separator orientation="vertical" className="mx-4 hidden sm:block" />
        <SecurityNavMenu />
        <Button
          type="button"
          variant="outline"
          className="sm:ms-auto"
          onClick={() => handleLogout()}
        >
          <LogOutIcon />
          <span className="sr-only md:not-sr-only">Cerrar sesion</span>
        </Button>
      </header>
      <Outlet />
    </div>
  );
}
