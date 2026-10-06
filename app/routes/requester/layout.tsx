import type { Route } from "./+types/layout";
import { validateUserRole } from "~/lib/auth.server";
import OperationalShell from "~/components/operational-shell";

export async function loader({ request }: Route.LoaderArgs) {
  return validateUserRole(request, "ACCESS_REQUESTER");
}

export default function RequesterLayout({ loaderData }: Route.ComponentProps) {
  return (
    <OperationalShell
      title="Solicitudes de acceso"
      user={loaderData}
    />
  );
}
