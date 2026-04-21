import { Outlet, redirect } from "react-router";
import { UserRole } from "../../../generated/prisma/enums";
import AppSidebar, { type SidebarLinkItem } from "~/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar";
import { getSessionUser } from "~/lib/session.server";
import type { Route } from "./+types/layout";

const SIDEBAR_ITEMS: Array<SidebarLinkItem> = [
  {
    label: "Accesos",
    children: [{ label: "Accesos del dia", href: "/operator" }],
  },
];

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getSessionUser(request);

  if (!user) {
    throw redirect("/login");
  }

  if (!user.role || user.role !== UserRole.ACCESS_OPERATOR) {
    throw redirect("/unauthorized");
  }

  return null;
}

export default function OperatorLayout() {
  return (
    <div className="p-4">
      <Outlet />
    </div>
  );
}
