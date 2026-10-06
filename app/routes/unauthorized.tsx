import { Link } from "react-router";
import { ArrowLeftIcon, ShieldXIcon } from "lucide-react";
import { Button } from "~/components/ui/button";
import { getSessionUser, getUserRedirectPath } from "~/lib/session.server";
import type { Route } from "./+types/unauthorized";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getSessionUser(request);

  return {
    homePath: user?.role ? getUserRedirectPath(user.role) : "/login",
  };
}

export default function Unauthorized({ loaderData }: Route.ComponentProps) {
  return (
    <main className="grid min-h-svh place-items-center bg-muted/40 px-4 py-8 sm:px-8">
      <section
        aria-labelledby="unauthorized-title"
        className="grid w-full max-w-4xl overflow-hidden rounded-2xl border bg-card shadow-sm md:min-h-[30rem] md:grid-cols-[0.82fr_1.18fr]"
      >
        <div className="relative flex min-h-56 flex-col justify-between overflow-hidden bg-primary p-7 text-primary-foreground sm:p-10 md:min-h-full">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full border border-white/15"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-12 -top-12 size-48 rounded-full border border-white/15"
          />
          <div className="relative">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-inset ring-white/20">
              <ShieldXIcon aria-hidden="true" className="size-7" />
            </div>
            <p className="mt-5 text-sm font-medium text-white/80">Control de accesos</p>
          </div>
          <div className="relative mt-10 md:mt-0">
            <p className="text-2xl font-semibold tracking-tight">Área protegida</p>
          </div>
        </div>

        <div className="flex flex-col justify-center p-7 sm:p-10 md:p-12">
          <h1
            id="unauthorized-title"
            className="max-w-lg font-heading text-3xl font-semibold tracking-tight sm:text-4xl"
          >
            Acceso no autorizado
          </h1>
          <p className="mt-4 max-w-lg text-base leading-7 text-muted-foreground">
            No tienes permisos para acceder a esta sección.
          </p>

          <div className="mt-8">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link to={loaderData.homePath}>
                <ArrowLeftIcon data-icon="inline-start" />
                {loaderData.homePath === "/login"
                  ? "Ir al inicio de sesión"
                  : "Ir a mi sección"}
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
