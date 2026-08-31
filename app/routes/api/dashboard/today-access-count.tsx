import type { Route } from "./+types/today-access-count";
import { validateUserRole } from "~/lib/auth.server";
import { AccessLogEntity } from "~/lib/database/access-log.server";
import { resolveDashboardScope } from "~/lib/services/dashboard.server";

export async function loader({ request }: Route.LoaderArgs) {
  const sessionUser = await validateUserRole(request, [
    "ADMIN",
    "SECURITY_MANAGER",
    "ACCESS_APPROVER",
    "ACCESS_MONITOR",
  ]);

  const url = new URL(request.url);
  const resolved = await resolveDashboardScope(
    sessionUser,
    url.searchParams.get("scope"),
  );

  const sites = await AccessLogEntity.countByEntryDateGroupedBySite(new Date());
  const filteredSites = resolved.scope === "session-site"
    ? sites.filter((site) => site.siteId === resolved.siteId)
    : sites;

  return {
    count: filteredSites.reduce((total, site) => total + site.count, 0),
    sites: filteredSites,
  };
}
