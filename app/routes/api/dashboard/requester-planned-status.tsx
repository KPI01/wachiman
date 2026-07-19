import type { Route } from "./+types/requester-planned-status";
import { isAuthenticated } from "~/lib/auth.server";
import { PlannedAccessEntity } from "~/lib/database/planned-access.server";
import { getSessionDepartment, getSessionSite } from "~/lib/session.server";

const DASHBOARD_STATUSES = [
  "PENDING_APPROVAL",
  "APPROVED",
  "PARTIALLY_USED",
] as const;

export async function loader({ request }: Route.LoaderArgs) {
  const sessionUser = await isAuthenticated(request);
  const department = await getSessionDepartment(request);
  const site = await getSessionSite(request);

  if (!department || !site) {
    throw new Response("Unauthorized", { status: 401 });
  }

  if (sessionUser.role !== "ACCESS_REQUESTER") {
    throw new Response("Forbidden", { status: 403 });
  }

  const counts = await PlannedAccessEntity.countByStatuses({
    statuses: [...DASHBOARD_STATUSES],
    siteId: site.id,
    requestedById: sessionUser.id,
  });

  return {
    pendingApproval: counts.PENDING_APPROVAL ?? 0,
    approved: counts.APPROVED ?? 0,
    partiallyUsed: counts.PARTIALLY_USED ?? 0,
  };
}
