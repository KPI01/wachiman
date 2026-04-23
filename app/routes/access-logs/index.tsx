import { performance } from "node:perf_hooks";
import { redirect } from "react-router";
import { UserRole } from "../../../prisma/generated/prisma/enums";
import { handleCreateAccessLog } from "~/lib/actions/access-log.server";
import { getSessionUser } from "~/lib/session.server";
import type { Route } from "./+types/index";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getSessionUser(request);
  if (!user) {
    throw redirect("/login");
  }
  if (!user.role || (user.role !== UserRole.ADMIN && user.role !== UserRole.ACCESS_OPERATOR)) {
    throw redirect("/unauthorized");
  }
  return null;
}

export async function action({ request }: Route.ActionArgs) {
  const user = await getSessionUser(request);
  if (!user) {
    throw redirect("/login");
  }
  if (!user.role || (user.role !== UserRole.ADMIN && user.role !== UserRole.ACCESS_OPERATOR)) {
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
