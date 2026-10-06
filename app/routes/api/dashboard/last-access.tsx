import type { Route } from "./+types/last-access";
import { validateUserRole } from "~/lib/auth.server";
import {
  getLatestAccessesBySite,
  resolveDashboardScope,
} from "~/lib/services/dashboard.server";

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

  return { sites: await getLatestAccessesBySite(resolved) };
}
