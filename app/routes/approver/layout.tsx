import { Outlet, redirect, useSubmit } from "react-router";
import LogoBranding from "~/components/logo-branding";
import { UserRole } from "../../../prisma/generated/prisma/enums";
import type { Route } from "./+types/layout";
import { getSessionUser } from "~/lib/session.server";
import { Button } from "~/components/ui/button";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getSessionUser(request);

  if (!user) {
    throw redirect("/login");
  }

  if (!user.role || user.role !== UserRole.ACCESS_APPROVER) {
    throw redirect("/unauthorized");
  }

  return user;
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
