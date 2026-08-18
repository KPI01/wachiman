import type { Route } from "./+types/layout";
import { validateUserRole } from "~/lib/auth.server";
import OperationalShell from "~/components/operational-shell";

export async function loader({ request }: Route.LoaderArgs) {
  return validateUserRole(request, "ACCESS_OPERATOR");
}

export default function OperatorLayout({ loaderData }: Route.ComponentProps) {
  return (
    <OperationalShell title="Control de accesos" user={loaderData} />
  );
}
