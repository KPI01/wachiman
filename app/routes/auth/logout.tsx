import { redirect } from "react-router";
import { destroySession } from "~/lib/session";
import type { Route } from "./+types/logout";

export async function action({ request }: Route.ActionArgs) {
  return redirect("/login", {
    headers: {
      "Set-Cookie": await destroySession(request),
    },
  });
}
