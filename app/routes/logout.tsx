import { Form, redirect } from "react-router";
import { Button } from "~/components/ui/button";
import type { Route } from "./+types/logout";
import { destroySession, getSessionUser } from "~/lib/session";
import { LogOutIcon } from "lucide-react";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getSessionUser(request);
  if (!user) {
    throw redirect("/login");
  }
  return null;
}

export async function action({ request }: Route.ActionArgs) {
  const user = await getSessionUser(request);
  if (!user) {
    throw redirect("/login");
  }

  return redirect("/login", {
    headers: {
      "Set-Cookie": await destroySession(request),
    },
  });
}

export default function Logout() {
  return (
    <Form method="post" action="/logout" className="w-full">
      <Button type="submit" variant="ghost" className="w-full">
        <LogOutIcon />
        Cerrar sesión
      </Button>
    </Form>
  );
}
