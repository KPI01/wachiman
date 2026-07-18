import { redirect } from "react-router";
import { USER_ROLES, type UserRole } from "../../db/enums";
import type { Route } from "./+types/access-log";
import { encryptValue } from "~/lib/crypt.server";
import { AccessLogEntity } from "~/lib/database/access-log.server";
import { markAccessLogExitSchema } from "~/lib/schemas/access-log";
import { getSessionSite } from "~/lib/session.server";
import { UserEntity } from "~/lib/database/user.server";
import z from "zod";
import { isAuthenticated } from "~/lib/auth.server";

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
  const { error, data } = markAccessLogExitSchema.safeParse(jsonData);

  if (error) {
    return { errors: z.treeifyError(error) };
  }

  const sessionUser = await isAuthenticated(request);

  const exitRecordedBy = await UserEntity.getByUsername(sessionUser.username);

  if (!exitRecordedBy) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const sessionSite =
    sessionUser.role === USER_ROLES.ACCESS_OPERATOR
      ? await getSessionSite(request)
      : null;

  if (sessionUser.role === USER_ROLES.ACCESS_OPERATOR && !sessionSite) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const wasExitRecorded = await AccessLogEntity.markExit({
    accessLogId: params.id,
    exitSignatureEnvelope: await encryptValue(
      JSON.stringify(data.exitSignaturePayload),
    ),
    exitRecordedById: exitRecordedBy.id,
    siteId: sessionSite?.id,
  });

  if (!wasExitRecorded) {
    throw new Response("Conflict", { status: 409 });
  }

  return redirect(
    getReturnPath(
      request,
      sessionUser.role === USER_ROLES.ACCESS_OPERATOR
        ? "/operator"
        : "/admin/access-logs",
    ),
  );
}

export default function AccessLogActionRoute() {
  return null;
}
