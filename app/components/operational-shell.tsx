import type { ReactNode } from "react";
import { Outlet } from "react-router";
import UserMenu from "~/components/user-menu";
import { useAppConfig } from "~/lib/app-config";
import type { SessionUser } from "~/lib/session.server";

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

  return (
    <div className="min-h-svh">
      <title>{title}</title>
      <header className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="truncate text-xl font-bold">{appName}</p>
          <p className="truncate text-sm text-muted-foreground">{title}</p>
        </div>
        <UserMenu user={user} />
      </header>
      <main className="p-4 md:p-6">{children ?? <Outlet />}</main>
    </div>
  );
}
