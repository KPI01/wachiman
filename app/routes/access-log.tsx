import { USER_ROLES } from "../../db/enums";
import type { Route } from "./+types/access-log";
import { getSessionSite } from "~/lib/session.server";
import { isAuthenticated, validateUserRole } from "~/lib/auth.server";
import {
  forceAccessLogExit,
  markAccessLogExit,
  requestAccessLogExitSignature,
  updateAccessLog,
} from "~/lib/services/access-log.server";

export async function loader({ request }: Route.LoaderArgs) {
  await isAuthenticated(request);
  return null;
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

  const exitOptions = {
    authorUsername: sessionUser.username,
    siteId: sessionSite?.id,
  };
  const intent = String(jsonData.intent ?? "");

  const result =
    sessionUser.role === USER_ROLES.ACCESS_OPERATOR
      ? intent === "sign-exit"
        ? await markAccessLogExit(jsonData, params.id, exitOptions)
        : {
            success: false as const,
            errors: "El operador debe registrar la salida con la firma del visitante.",
          }
      : intent === "request-exit-signature"
        ? await requestAccessLogExitSignature(params.id, exitOptions)
        : intent === "force-exit"
          ? await forceAccessLogExit(params.id, exitOptions)
          : {
              success: false as const,
              errors: "Selecciona si quieres solicitar la firma o cerrar el acceso sin ella.",
            };

  if (!result.success) {
    const status =
      "code" in result && result.code === "not_found"
        ? 404
        : "code" in result && result.code === "conflict"
          ? 409
          : result.errors === "unauthorized"
            ? 401
            : 400;
    return Response.json(result, { status });
  }

  return Response.json(result);
}

export default function AccessLogActionRoute() {
  return null;
}
