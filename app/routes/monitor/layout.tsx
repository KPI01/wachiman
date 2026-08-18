import type { Route } from "./+types/layout";
import { validateUserRole } from "~/lib/auth.server";
import OperationalShell from "~/components/operational-shell";

export async function loader({ request }: Route.LoaderArgs) {
  return validateUserRole(request, "ACCESS_MONITOR");
}

export default function MonitorLayout({ loaderData }: Route.ComponentProps) {
  return <OperationalShell title="Mostrador" user={loaderData} />;
}
