import { redirect } from "react-router";
import { destroySession, getSessionUser } from "~/lib/session.server";
import type { Route } from "./+types/logout";

export async function action({ request }: Route.ActionArgs) {
  const user = await getSessionUser(request);

  if (!user) {
    throw redirect("/unauthorized");
  }

  return redirect("/login", {
    headers: {
      "Set-Cookie": await destroySession(request),
    },
  });
}
