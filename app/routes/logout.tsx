import { Form, redirect } from "react-router";
import type { Route } from "./+types/logout";
import { requireSession } from "~/middleware/require-session";
import { destroySession } from "~/lib/session";

export const middleware: Route.MiddlewareFunction[] = [requireSession];

export async function action({ request }: Route.ActionArgs) {
  return redirect("/login", {
    headers: {
      "Set-Cookie": await destroySession(request),
    },
  });
}

export default function Logout() {
  return null;
}
