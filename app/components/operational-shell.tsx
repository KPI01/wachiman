import type { ReactNode } from "react";
import { Outlet, useLocation, useNavigation } from "react-router";
import UserMenu from "~/components/user-menu";
import { useAppConfig } from "~/lib/app-config";
import type { SessionUser } from "~/lib/session.server";
import NavigationPending from "~/components/ui/navigation-pending";
import PageLoadingSkeleton from "~/components/ui/page-loading-skeleton";

type OperationalShellProps = {
  title: string;
  user: SessionUser;
  children?: ReactNode;
};

export default function OperationalShell({
  title,
  user,
  children,
}: OperationalShellProps) {
  const { appName } = useAppConfig();
  const navigation = useNavigation();
  const location = useLocation();
  const isChangingPage =
    navigation.state === "loading" &&
    navigation.location?.pathname !== location.pathname;

  return (
    <div className="min-h-svh">
      <NavigationPending />
      <title>{title}</title>
      <header className="border-b bg-card">
        <div className="flex w-full flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between md:px-7 lg:px-10">
          <div className="min-w-0">
            <p className="truncate text-xl font-semibold">{appName}</p>
            <p className="truncate text-xs text-muted-foreground">
              Centro: {user.site.name}
            </p>
          </div>
          <UserMenu user={user} />
        </div>
      </header>
      <main className="w-full max-w-none px-8 py-4 md:px-12 md:py-5 lg:px-16 lg:py-7 xl:px-20">
        {isChangingPage ? <PageLoadingSkeleton /> : children ?? <Outlet />}
      </main>
    </div>
  );
}
