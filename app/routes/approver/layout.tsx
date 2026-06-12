import { LogOutIcon } from "lucide-react";
import { Outlet, useNavigate, useSubmit } from "react-router";
import type { Route } from "./+types/layout";
import { validateUserRole } from "~/lib/auth.server";
import { Separator } from "~/components/ui/separator";
import { Button } from "~/components/ui/button";
import ApproverNavMenu from "./nav-menu";

export async function loader({ request }: Route.LoaderArgs) {
  return await validateUserRole(request, "ACCESS_APPROVER");
}

export default function ApproverLayout({ loaderData }: Route.ComponentProps) {
  const submit = useSubmit();
  const handleLogout = () => {
    submit(null, {
      method: "POST",
      action: "/auth/logout",
    });
  };
  return (
    <div className="p-4">
      <title>Aprobador de Accesos</title>
      <header className="mb-6 flex flex-col gap-3 border-b pb-3 sm:flex-row sm:items-center">
        <div className="flex h-12 w-24 shrink-0 items-center justify-center">
          <img
            src="/logoFruveco.svg"
            alt="Logo de Fruveco"
            className="max-h-full max-w-full object-contain"
          />
        </div>
        <Separator orientation="vertical" className="mx-4 hidden sm:block" />
        <ApproverNavMenu />
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
