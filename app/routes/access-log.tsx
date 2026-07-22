import { redirect } from "react-router";
import { USER_ROLES } from "../../db/enums";
import type { Route } from "./+types/access-log";
import { getSessionSite } from "~/lib/session.server";
import { isAuthenticated, validateUserRole } from "~/lib/auth.server";
import {
  markAccessLogExit,
  updateAccessLog,
} from "~/lib/services/access-log.server";

export async function loader({ request }: Route.LoaderArgs) {
  await isAuthenticated(request);
  return null;
}

function getReturnPath(request: Request, fallbackPath: string) {
  const referer = request.headers.get("Referer");

  if (!referer) {
    return fallbackPath;
  }

  const { pathname, search } = new URL(referer);

  return `${pathname}${search}`;
}

export async function action({ params, request }: Route.ActionArgs) {
  if (!params.id) {
    throw new Response("Not Found", { status: 404 });
  }

  const rawFormData = await request.formData();
  const jsonData = Object.fromEntries(rawFormData);

  if (request.method === "PATCH") {
    const sessionUser = await validateUserRole(request, [
      USER_ROLES.ADMIN,
      USER_ROLES.SECURITY_MANAGER,
      USER_ROLES.ACCESS_APPROVER,
    ]);
    const result = await updateAccessLog(jsonData, params.id, {
      authorUsername: sessionUser.username,
      lockedSiteId:
        sessionUser.role === USER_ROLES.ACCESS_APPROVER
          ? sessionUser.site.id
          : undefined,
    });

    const status =
      !result.success && result.errors === "not_found"
        ? 404
        : !result.success && "code" in result && result.code === "conflict"
          ? 409
          : !result.success
            ? 400
            : 200;
    return Response.json(result, { status });
  }

  if (request.method !== "POST") {
    throw new Response("Method Not Allowed", { status: 405 });
  }

  const sessionUser = await validateUserRole(request, [
    USER_ROLES.ADMIN,
    USER_ROLES.SECURITY_MANAGER,
    USER_ROLES.ACCESS_APPROVER,
    USER_ROLES.ACCESS_OPERATOR,
  ]);
  const sessionSite =
    sessionUser.role === USER_ROLES.ACCESS_OPERATOR ||
    sessionUser.role === USER_ROLES.ACCESS_APPROVER
      ? await getSessionSite(request)
      : null;

  if (
    (sessionUser.role === USER_ROLES.ACCESS_OPERATOR ||
      sessionUser.role === USER_ROLES.ACCESS_APPROVER) &&
    !sessionSite
  ) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const result = await markAccessLogExit(jsonData, params.id, {
    authorUsername: sessionUser.username,
    siteId: sessionSite?.id,
  });

  if (!result.success) {
    if (result.errors === "conflict") {
      throw new Response("Conflict", { status: 409 });
    }
    return Response.json(result, { status: 400 });
  }

  return redirect(
    getReturnPath(
      request,
      sessionUser.role === USER_ROLES.ACCESS_OPERATOR
        ? "/operator"
        : `/${sessionUser.role === USER_ROLES.ACCESS_APPROVER ? "approver" : sessionUser.role === USER_ROLES.SECURITY_MANAGER ? "security" : "admin"}/access-logs`,
    ),
  );
}

export default function AccessLogActionRoute() {
  return null;
}
