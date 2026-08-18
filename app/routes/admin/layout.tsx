import type { Route } from "./+types/layout";
import { validateUserRole } from "~/lib/auth.server";
import AuthenticatedShell from "~/components/authenticated-shell";
import { ROLE_NAVIGATION } from "~/components/role-navigation";

export async function loader({ request }: Route.LoaderArgs) {
  return validateUserRole(request, "ADMIN");
}

export default function AdminLayout({ loaderData }: Route.ComponentProps) {
  return (
    <AuthenticatedShell
      title="Administrador"
      user={loaderData}
      items={ROLE_NAVIGATION.ADMIN}
    />
  );
}
