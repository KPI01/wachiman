import type { Route } from "./+types/layout";
import { validateUserRole } from "~/lib/auth.server";
import AuthenticatedShell from "~/components/authenticated-shell";
import { ROLE_NAVIGATION } from "~/components/role-navigation";

export async function loader({ request }: Route.LoaderArgs) {
  return validateUserRole(request, "ACCESS_REQUESTER");
}

export default function RequesterLayout({ loaderData }: Route.ComponentProps) {
  return (
    <AuthenticatedShell
      title="Solicitudes de acceso"
      user={loaderData}
      items={ROLE_NAVIGATION.ACCESS_REQUESTER}
    />
  );
}
