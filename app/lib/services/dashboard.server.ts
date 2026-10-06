import type { SessionUser } from "../session.server";
import type { UserRole } from "../../../db/enums";
import { AccessLogEntity } from "../database/access-log.server";
import { SiteEntity } from "../database/site.server";

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

export async function getLatestAccessesBySite(
  resolvedScope: ResolvedDashboardScope,
) {
  const siteId =
    resolvedScope.scope === "session-site" ? resolvedScope.siteId : undefined;

  const [sites, latestEntries] = await Promise.all([
    siteId
      ? SiteEntity.findById(siteId).then((site) => (site ? [site] : []))
      : SiteEntity.findMany(),
    AccessLogEntity.findLatestEntriesBySite({ siteId }),
  ]);

  const entriesBySiteId = new Map(
    latestEntries.map((entry) => [entry.siteId, entry]),
  );

  return sites
    .map((site) => {
      const entry = entriesBySiteId.get(site.id);
      return {
        siteId: site.id,
        siteName: site.name,
        accessLog: entry
          ? {
              id: entry.id,
              entryTimestamp: entry.entryTimestamp,
              personFullName: [
                entry.firstNameSnapshot,
                entry.middleNameSnapshot,
                entry.lastNameSnapshot,
                entry.secondLastNameSnapshot,
              ]
                .filter(Boolean)
                .join(" "),
            }
          : null,
      };
    })
    .sort((left, right) => {
      if (!left.accessLog) {
        return right.accessLog
          ? 1
          : left.siteName.localeCompare(right.siteName, "es");
      }
      if (!right.accessLog) return -1;
      const byTimestamp =
        right.accessLog.entryTimestamp.getTime() -
        left.accessLog.entryTimestamp.getTime();
      return byTimestamp || left.siteName.localeCompare(right.siteName, "es");
    });
}

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
