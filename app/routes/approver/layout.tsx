import { Outlet, useSubmit } from "react-router";
import LogoBranding from "~/components/logo-branding";
import type { Route } from "./+types/layout";
import { Button } from "~/components/ui/button";
import { validateUserRole } from "~/lib/auth.server";

export async function loader({ request }: Route.LoaderArgs) {
  return await validateUserRole(request, "ACCESS_APPROVER");
}

const MENUBAR_ITEMS = [];

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
      <title>Portero</title>
      <header className="mb-6 flex justify-between items-center border-b pb-3">
        <LogoBranding
          title="Control de Accesos"
          username={loaderData.fullName}
        />
        <Button type="button" onClick={() => handleLogout()}>
          Cerrar sesión
        </Button>
      </header>
      <Outlet />
    </div>
  );
}
