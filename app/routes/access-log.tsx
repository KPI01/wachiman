import { redirect } from "react-router";
import { UserRole } from "../../generated/prisma/enums";
import type { Route } from "./+types/access-log";
import { encryptValue } from "~/lib/crypt";
import { markAccessLogExit } from "~/lib/database/access-log";
import { markAccessLogExitSchema } from "~/lib/schemas/access-log";
import { getSessionSite, getSessionUser } from "~/lib/session";
import { getUserByUsername } from "~/lib/database/user";
import { requireSession } from "~/middleware/require-session";
import z from "zod";

export const middleware: Route.MiddlewareFunction[] = [requireSession];

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

  const sessionUser = await getSessionUser(request);

  if (!sessionUser) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const exitRecordedBy = await getUserByUsername(sessionUser.username);

  if (!exitRecordedBy) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const sessionSite =
    sessionUser.role === UserRole.ACCESS_OPERATOR
      ? await getSessionSite(request)
      : null;

  if (sessionUser.role === UserRole.ACCESS_OPERATOR && !sessionSite) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const wasExitRecorded = await markAccessLogExit({
    accessLogId: params.id,
    exitSignatureEnvelope: encryptValue(
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
      sessionUser.role === UserRole.ACCESS_OPERATOR
        ? "/operator"
        : "/admin/access-logs",
    ),
  );
}

export default function AccessLogActionRoute() {
  return null;
}
