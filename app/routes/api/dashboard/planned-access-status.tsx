import type { Route } from "./+types/planned-access-status";
import { isAuthenticated } from "~/lib/auth.server";
import { PlannedAccessEntity } from "~/lib/database/planned-access.server";
import { resolveDashboardScope } from "~/lib/services/dashboard.server";

const DASHBOARD_STATUSES = [
  "PENDING_APPROVAL",
  "APPROVED",
  "PARTIALLY_USED",
] as const;

export async function loader({ request }: Route.LoaderArgs) {
  const sessionUser = await isAuthenticated(request);

  const url = new URL(request.url);
  const resolved = await resolveDashboardScope(
    sessionUser,
    url.searchParams.get("scope"),
  );

  const counts = await PlannedAccessEntity.countByStatuses(
    [...DASHBOARD_STATUSES],
    resolved.scope === "session-site" ? { siteId: resolved.siteId } : {},
  );

  return {
    pendingApproval: counts.PENDING_APPROVAL,
    approved: counts.APPROVED,
    partiallyUsed: counts.PARTIALLY_USED,
  };
}
