import { Outlet } from "react-router";
import type { ReactNode } from "react";
import AppSidebar, { type SidebarLinkItem } from "~/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "~/components/ui/sidebar";
import LogoBranding from "~/components/logo-branding";
import { Button } from "~/components/ui/button";
import { Form } from "react-router";
import { LogOutIcon } from "lucide-react";
import type { SessionUser } from "~/lib/session.server";

type AuthenticatedShellProps = {
  title: string;
  user: SessionUser;
  items: SidebarLinkItem[];
  compact?: boolean;
  children?: ReactNode;
};

export default function AuthenticatedShell({
  title,
  user,
  items,
  compact = false,
  children,
}: AuthenticatedShellProps) {
  if (compact) {
    return (
      <div className="min-h-svh p-4">
        <title>{title}</title>
        <header className="mb-6 flex flex-col gap-3 border-b pb-3 sm:flex-row sm:items-center sm:justify-between">
          <LogoBranding title={title} username={user.fullName} />
          <Form method="post" action="/auth/logout">
            <Button variant="outline" type="submit" title="Cerrar sesión">
              <LogOutIcon data-icon="inline-start" />
              <span className="sr-only md:not-sr-only">Cerrar sesión</span>
            </Button>
          </Form>
        </header>
        {children ?? <Outlet />}
      </div>
    );
  }

  return (
    <SidebarProvider>
      <title>{title}</title>
      <AppSidebar title={title} items={items} />
      <SidebarInset className="max-w-full overflow-auto p-4 md:p-6">
        <div className="mb-4 flex items-center gap-3 md:hidden">
          <SidebarTrigger />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{title}</p>
            <p className="truncate text-xs text-muted-foreground">
              {user.fullName}
            </p>
          </div>
        </div>
        {children ?? <Outlet />}
      </SidebarInset>
    </SidebarProvider>
  );
}
