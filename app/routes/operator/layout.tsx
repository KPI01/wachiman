import { Outlet } from "react-router";
import { UserRole } from "../../../generated/prisma/enums";
import { type SidebarLinkItem } from "~/components/app-sidebar";
import { requireRole } from "~/middleware/require-role";
import { requireSession } from "~/middleware/require-session";
import type { Route } from "./+types/layout";
import AppMenubar, { type MenubarItem } from "~/components/app-menubar";
import { Separator } from "~/components/ui/separator";
import { formatTimestamp } from "~/lib/utils";

const MENUBAR_ITEMS: Array<MenubarItem> = [];

export const middleware: Route.MiddlewareFunction[] = [
  requireSession,
  requireRole([UserRole.ACCESS_OPERATOR]),
];

export async function loader() {
  return null;
}

export default function OperatorLayout() {
  const currentDate = new Date();
  return (
    <div className="p-4 flex flex-col gap-y-4">
      <div className="flex justify-between items-center">
        <div>
          <span className="text-3xl font-bold">Fruveco</span>
        </div>
        <AppMenubar items={MENUBAR_ITEMS} />
        <div className="text-muted-foreground">
          Fecha:{" "}
          {formatTimestamp({ date: currentDate, template: "dd/MM/yyyy" })}
        </div>
      </div>
      <Separator />
      <Outlet />
    </div>
  );
}
