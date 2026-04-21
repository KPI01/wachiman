import { performance } from "node:perf_hooks";
import { redirect } from "react-router";
import { UserRole } from "../../../generated/prisma/enums";
import { handleCreateAccessLog } from "~/lib/actions/access-log";
import { getSessionUser } from "~/lib/session";
import type { Route } from "./+types/index";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getSessionUser(request);
  if (!user) {
    throw redirect("/login");
  }
  if (![UserRole.ADMIN, UserRole.ACCESS_OPERATOR].includes(user.role)) {
    throw redirect("/unauthorized");
  }
  return null;
}

export async function action({ request }: Route.ActionArgs) {
  const user = await getSessionUser(request);
  if (!user) {
    throw redirect("/login");
  }
  if (![UserRole.ADMIN, UserRole.ACCESS_OPERATOR].includes(user.role)) {
    throw redirect("/unauthorized");
  }

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
