import { Outlet } from "react-router";
import type { ReactNode } from "react";
import AppSidebar, { type SidebarLinkItem } from "~/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "~/components/ui/sidebar";
import { useAppConfig } from "~/lib/app-config";
import type { SessionUser } from "~/lib/session.server";

type AuthenticatedShellProps = {
  title: string;
  user: SessionUser;
  items: SidebarLinkItem[];
  children?: ReactNode;
};

export default function AuthenticatedShell({
  title,
  user,
  items,
  children,
}: AuthenticatedShellProps) {
  const { appName } = useAppConfig();

  return (
    <SidebarProvider>
      <title>{title}</title>
      <AppSidebar items={items} user={user} />
      <SidebarInset className="max-w-full overflow-auto p-4 md:p-6">
        <div className="mb-4 flex items-center gap-3 md:hidden">
          <SidebarTrigger />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{appName}</p>
            <p className="truncate text-xs text-muted-foreground">
              {title}
            </p>
          </div>
        </div>
        {children ?? <Outlet />}
      </SidebarInset>
    </SidebarProvider>
  );
}
