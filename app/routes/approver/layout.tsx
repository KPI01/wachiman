import type { Route } from "./+types/layout";
import { validateUserRole } from "~/lib/auth.server";
import AuthenticatedShell from "~/components/authenticated-shell";
import { ROLE_NAVIGATION } from "~/components/role-navigation";

export async function loader({ request }: Route.LoaderArgs) {
  return validateUserRole(request, "ACCESS_APPROVER");
}

export default function ApproverLayout({ loaderData }: Route.ComponentProps) {
  return (
    <AuthenticatedShell
      title="Aprobador de accesos"
      user={loaderData}
      items={ROLE_NAVIGATION.ACCESS_APPROVER}
    />
  );
}
