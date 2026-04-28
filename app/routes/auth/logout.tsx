import { redirect } from "react-router";
import { isAuthenticated } from "~/lib/auth.server";
import { destroySession } from "~/lib/session.server";
import type { Route } from "./+types/logout";

export async function action({ request }: Route.ActionArgs) {
  await isAuthenticated(request);

  return redirect("/login", {
    headers: {
      "Set-Cookie": await destroySession(request),
    },
  });
}
