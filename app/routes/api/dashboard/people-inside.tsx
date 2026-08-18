import type { Route } from "./+types/people-inside";
import { isAuthenticated } from "~/lib/auth.server";
import { getOpenAccessLogs } from "~/lib/services/access-log.server";
import { resolveDashboardScope } from "~/lib/services/dashboard.server";

export async function loader({ request }: Route.LoaderArgs) {
  const sessionUser = await isAuthenticated(request);

  const url = new URL(request.url);
  const resolved = await resolveDashboardScope(
    sessionUser,
    url.searchParams.get("scope"),
  );

  const accessLogs = await getOpenAccessLogs(
    resolved.scope === "session-site" ? { siteId: resolved.siteId } : {},
  );

  return { accessLogs };
}
