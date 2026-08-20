import { Link } from "react-router";
import CardContainer from "~/components/containers/card-container";
import { buttonVariants } from "~/components/ui/button";
import { getSessionUser, getUserRedirectPath } from "~/lib/session.server";
import type { Route } from "./+types/unauthorized";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const user = await getSessionUser(request);

  return {
    from: url.searchParams.get("from"),
    required: url.searchParams.get("required"),
    homePath: user?.role ? getUserRedirectPath(user.role) : "/login",
  };
}

export default function Unauthorized({ loaderData }: Route.ComponentProps) {
  return (
    <CardContainer
      className="w-full max-w-lg"
      title="Acceso no autorizado"
      description="No tienes permisos para acceder a esta sección."
    >
      <div className="space-y-4">
        {loaderData.from || loaderData.required ? (
          <p className="text-center text-sm text-muted-foreground">
            {loaderData.from ? `Sección solicitada: ${loaderData.from}` : null}
            {loaderData.required ? ` · Rol requerido: ${loaderData.required}` : null}
          </p>
        ) : null}
        <div className="flex justify-center">
          <Link to={loaderData.homePath} className={buttonVariants({ variant: "default" })}>
            {loaderData.homePath === "/login" ? "Ir al inicio de sesión" : "Ir a mi sección"}
          </Link>
        </div>
      </div>
    </CardContainer>
  );
}
