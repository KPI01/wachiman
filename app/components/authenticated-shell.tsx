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
  const { appName } = useAppConfig();
  const navigation = useNavigation();
  const location = useLocation();
  const isChangingPage =
    navigation.state === "loading" &&
    navigation.location?.pathname !== location.pathname;

  return (
    <SidebarProvider>
      <NavigationPending />
      <title>{title}</title>
      <AppSidebar items={items} user={user} />
      <SidebarInset className="max-w-full overflow-auto bg-background p-4 md:p-7">
        <div className="mb-4 flex items-center gap-3 md:hidden">
          <SidebarTrigger />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{appName}</p>
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
