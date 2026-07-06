import type { SessionUser } from "../session.server";
import type { UserRole } from "../../../prisma/generated/prisma/enums";

export type DashboardScope = "all-sites" | "session-site";

export const DASHBOARD_SCOPES = ["all-sites", "session-site"] as const;

const CROSS_SITE_ROLES: UserRole[] = [
  "ADMIN",
  "SECURITY_MANAGER",
  "ACCESS_MONITOR",
];

export function isValidScope(value: string | null): value is DashboardScope {
  return (
    value !== null &&
    (DASHBOARD_SCOPES as readonly string[]).includes(value)
  );
}

export type ResolvedDashboardScope =
  | { scope: "all-sites" }
  | { scope: "session-site"; siteId: string };

export async function resolveDashboardScope(
  sessionUser: SessionUser,
  requestedScope: string | null,
): Promise<ResolvedDashboardScope> {
  if (requestedScope === "all-sites") {
    if (!sessionUser.role || !CROSS_SITE_ROLES.includes(sessionUser.role)) {
      return { scope: "session-site", siteId: sessionUser.site.id };
    }
    return { scope: "all-sites" };
  }

  return { scope: "session-site", siteId: sessionUser.site.id };
}
