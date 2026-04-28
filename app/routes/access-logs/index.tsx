import { performance } from "node:perf_hooks";
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

  const start = performance.now();

  try {
    return await handleCreateAccessLog(request);
  } catch (e) {
    console.error("[/access-logs][error] ", String(e));
  } finally {
    console.log(`[/access-logs] ${(performance.now() - start).toFixed(2)}ms`);
  }
}

export default function AccessLogsActionRoute() {
  return null;
}
