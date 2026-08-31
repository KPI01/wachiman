import type { Route } from "./+types/last-access";
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

  const accessLog = await AccessLogEntity.findLatestEntry(
    resolved.scope === "session-site" ? { siteId: resolved.siteId } : {},
  );

  if (!accessLog) {
    return { accessLog: null };
  }

  return {
    accessLog: {
      id: accessLog.id,
      entryTimestamp: accessLog.entryTimestamp,
       siteName: accessLog.site?.name ?? "-",
      personFullName: [
        accessLog.firstNameSnapshot,
        accessLog.lastNameSnapshot,
      ]
        .filter(Boolean)
        .join(" "),
    },
  };
}
