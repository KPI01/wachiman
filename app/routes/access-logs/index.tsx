import { handleCreateAccessLog } from "~/lib/actions/access-log.server";
import type { Route } from "./+types/index";
import { validateUserRole } from "~/lib/auth.server";

const ALLOWED_ROLES = ["ADMIN", "ACCESS_OPERATOR"] as const;

export async function loader({ request }: Route.LoaderArgs) {
  await validateUserRole(request, [...ALLOWED_ROLES]);
  return null;
}

export async function action({ request }: Route.ActionArgs) {
  await validateUserRole(request, [...ALLOWED_ROLES]);

  try {
    return await handleCreateAccessLog(request);
  } catch (e) {
    console.error("[/access-logs][error] ", String(e));
  }
}

export default function AccessLogsActionRoute() {
  return null;
}
