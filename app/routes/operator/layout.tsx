import { EllipsisIcon, LogOutIcon } from "lucide-react";
import { Outlet, redirect, useSubmit } from "react-router";
import { UserRole } from "../../../prisma/generated/prisma/enums";
import { Button } from "~/components/ui/button";
import { getSessionUser } from "~/lib/session.server";
import type { Route } from "./+types/layout";
import { Separator } from "~/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getSessionUser(request);

  if (!user) {
    throw redirect("/login");
  }

  if (!user.role || user.role !== UserRole.ACCESS_OPERATOR) {
    throw redirect("/unauthorized");
  }

  return user;
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
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-24 shrink-0 items-center justify-center">
            <img
              src="/logoFruveco.svg"
              alt="Logo de Fruveco"
              className="max-h-full max-w-full object-contain"
            />
          </div>
          <Separator orientation="vertical" />
          <div className="flex flex-col">
            <h2 className="text-xl font-bold uppercase tracking-tight">
              Control de Accesos
            </h2>
            <div className="text-foreground/50">
              <span>Usuario:</span> {loaderData.fullName}
            </div>
          </div>
        </div>
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
