import type { Route } from "./+types/today-access-count";
import { isAuthenticated } from "~/lib/auth.server";
import { AccessLogEntity } from "~/lib/database/access-log.server";
import { resolveDashboardScope } from "~/lib/services/dashboard.server";

export async function loader({ request }: Route.LoaderArgs) {
  const sessionUser = await isAuthenticated(request);

  const url = new URL(request.url);
  const resolved = await resolveDashboardScope(
    sessionUser,
    url.searchParams.get("scope"),
  );

  const count = await AccessLogEntity.countByEntryDate({
    date: new Date(),
    ...(resolved.scope === "session-site"
      ? { siteId: resolved.siteId }
      : {}),
  });

  return { count };
}
