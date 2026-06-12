import { Link, redirect } from "react-router";
import type { Route } from "./+types/welcome";
import CardContainer from "~/components/containers/card-container";
import { buttonVariants } from "~/components/ui/button";
import { getSessionUser, getUserRedirectPath } from "~/lib/session.server";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getSessionUser(request);

  if (user) {
    throw redirect(getUserRedirectPath(user.role));
  }

  return null;
}

export default function Welcome() {
  return (
    <>
      <title>Wachiman App</title>
      <CardContainer
        className="w-full max-w-lg"
        title="Bienvenido al Control de Accesos de Fruveco"
        description="Software para el control de accesos de una fábrica"
      >
        <div className="flex gap-3 justify-end">
          <Link to="/login" className={buttonVariants({ variant: "default" })}>
            Ir al login
          </Link>
        </div>
      </CardContainer>
    </>
  );
}
