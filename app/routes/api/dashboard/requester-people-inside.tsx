import type { Route } from "./+types/requester-people-inside";
import { isAuthenticated } from "~/lib/auth.server";
import { AccessLogEntity } from "~/lib/database/access-log.server";
import { getSessionDepartment, getSessionSite } from "~/lib/session.server";

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

  const accessLogs = await AccessLogEntity.findPeopleInsideByDepartment(
    department.id,
    site.id,
  );

  return { accessLogs };
}
