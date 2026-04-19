import { performance } from "node:perf_hooks";
import { UserRole } from "../../../generated/prisma/enums";
import { handleCreateAccessLog } from "~/lib/actions/access-log";
import { requireRole } from "~/middleware/require-role";
import { requireSession } from "~/middleware/require-session";
import type { Route } from "./+types/index";

export const middleware: Route.MiddlewareFunction[] = [
  requireSession,
  requireRole([UserRole.ADMIN, UserRole.ACCESS_OPERATOR]),
];

export async function action({ request }: Route.ActionArgs) {
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
