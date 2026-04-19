import { redirect } from "react-router";
import type { Route } from "./+types/access-log";
import { markAccessLogExit } from "~/lib/database/access-log";
import { requireSession } from "~/middleware/require-session";

export const middleware: Route.MiddlewareFunction[] = [requireSession];

function getReturnPath(request: Request) {
  const referer = request.headers.get("Referer");

  if (!referer) {
    return "/admin/access-logs";
  }

  const { pathname, search } = new URL(referer);

  return `${pathname}${search}`;
}

export async function action({ params, request }: Route.ActionArgs) {
  await markAccessLogExit(params.id);

  return redirect(getReturnPath(request));
}

export default function AccessLogActionRoute() {
  return null;
}
