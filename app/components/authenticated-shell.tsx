import { Outlet, useLocation, useNavigation } from "react-router";
import type { ReactNode } from "react";
import AppSidebar, { type SidebarLinkItem } from "~/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "~/components/ui/sidebar";
import { useAppConfig } from "~/lib/app-config";
import type { SessionUser } from "~/lib/session.server";
import NavigationPending from "~/components/ui/navigation-pending";
import PageLoadingSkeleton from "~/components/ui/page-loading-skeleton";

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
  const { appName, appLogo } = useAppConfig();
  const navigation = useNavigation();
  const location = useLocation();
  const isChangingPage =
    navigation.state === "loading" &&
    navigation.location?.pathname !== location.pathname;

  return (
    <SidebarProvider>
      <NavigationPending />
      <AppSidebar items={items} user={user} />
      <SidebarInset className="max-w-full overflow-auto bg-background p-4 md:p-7">
        <div className="mb-4 flex items-center gap-3 md:hidden">
          <SidebarTrigger />
          <img
            src={appLogo}
            alt={`Logo de ${appName}`}
            className="size-9 shrink-0 object-contain"
          />
          <div className="min-w-0">
            <p className="whitespace-normal break-words text-sm font-semibold leading-tight">
              {appName}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {title}
            </p>
          </div>
        </div>
        <div className="mx-auto w-full max-w-[1600px]">
          {isChangingPage ? <PageLoadingSkeleton /> : children ?? <Outlet />}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
