import { redirect, type MiddlewareFunction } from "react-router";
import { getSessionUser } from "~/lib/session";

export const requireSession: MiddlewareFunction<Response> = async ({ request }) => {
  const user = await getSessionUser(request);

  if (!user) {
    throw redirect("/login");
  }
};
