import type { Route } from "./+types/layout";
import { validateUserRole } from "~/lib/auth.server";
import AuthenticatedShell from "~/components/authenticated-shell";
import { ROLE_NAVIGATION } from "~/components/role-navigation";

export async function loader({ request }: Route.LoaderArgs) {
  return validateUserRole(request, "SECURITY_MANAGER");
}

export default function SecurityLayout({ loaderData }: Route.ComponentProps) {
  return (
    <AuthenticatedShell
      title="Director de Seguridad"
      user={loaderData}
      items={ROLE_NAVIGATION.SECURITY_MANAGER}
    />
  );
}
