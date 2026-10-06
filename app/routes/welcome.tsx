import { redirect, useFetcher } from "react-router";
import type { Route } from "./+types/welcome";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { FieldGroup } from "~/components/ui/field";
import FieldWrapper from "~/components/ui/wrappers/field-wrapper";
import { login } from "~/lib/auth.server";
import { useAppConfig } from "~/lib/app-config";
import { getSessionUser, getUserRedirectPath } from "~/lib/session.server";
import { getFieldErrors } from "~/lib/utils/zod-errors";
import { LoaderCircleIcon, ShieldCheckIcon } from "lucide-react";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getSessionUser(request);

  if (user) {
    throw redirect(getUserRedirectPath(user.role));
  }

  return null;
}

export async function action({ request }: Route.ActionArgs) {
  return login(request);
}

export default function Welcome() {
  const { appName, appLogo } = useAppConfig();
  const loginFetcher = useFetcher<typeof action>();
  const isSubmitting = loginFetcher.state !== "idle";
  const usernameErrors = getFieldErrors(loginFetcher.data?.errors, "username");
  const passwordErrors = getFieldErrors(loginFetcher.data?.errors, "password");

  return (
    <div className="grid min-h-svh bg-background lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden bg-primary text-primary-foreground lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        <div className="absolute inset-y-0 right-12 w-px bg-primary-foreground/10" aria-hidden="true" />
        <div className="relative flex items-center gap-4">
          <span className="flex size-14 items-center justify-center rounded-xl bg-white p-2.5">
            <img src={appLogo} alt={`Logo de ${appName}`} className="max-h-full max-w-full object-contain" />
          </span>
          <span className="font-heading text-xl font-semibold tracking-tight">{appName}</span>
        </div>

        <div className="relative max-w-xl py-16">
          <div className="mb-6 flex size-12 items-center justify-center rounded-xl border border-primary-foreground/20 bg-primary-foreground/10">
            <ShieldCheckIcon aria-hidden="true" />
          </div>
          <h1 className="font-heading text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
            Control de accesos del centro
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-primary-foreground/80">
            Registra entradas y salidas, y consulta la actividad autorizada desde un único espacio.
          </p>
        </div>

        <p className="relative text-sm text-primary-foreground/70">
          Acceso protegido para el personal autorizado.
        </p>
      </section>

      <main className="flex min-h-svh items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="flex size-12 items-center justify-center rounded-lg border bg-card p-2">
              <img src={appLogo} alt={`Logo de ${appName}`} className="max-h-full max-w-full object-contain" />
            </span>
            <span className="font-heading text-lg font-semibold">{appName}</span>
          </div>

          <Card className="border-border/80 shadow-lg shadow-foreground/5">
            <CardHeader className="gap-2 pb-5">
              <CardTitle className="font-heading text-2xl tracking-tight">Iniciar sesión</CardTitle>
              <CardDescription>
                Introduce tus credenciales para acceder al sistema.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <loginFetcher.Form id="login-form" method="post" action="/?index" className="grid gap-6">
                <FieldGroup className="gap-4">
                  <FieldWrapper
                    label="Nombre de usuario"
                    htmlFor="username"
                    errors={usernameErrors}
                  >
                    <Input
                      id="username"
                      name="username"
                      autoComplete="username"
                      required
                      aria-invalid={Boolean(usernameErrors?.length)}
                      aria-describedby={usernameErrors?.length ? "username-error" : undefined}
                      autoFocus
                    />
                  </FieldWrapper>
                  <FieldWrapper
                    label="Contraseña"
                    htmlFor="password"
                    errors={passwordErrors}
                  >
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      aria-invalid={Boolean(passwordErrors?.length)}
                      aria-describedby={passwordErrors?.length ? "password-error" : undefined}
                    />
                  </FieldWrapper>
                </FieldGroup>
              </loginFetcher.Form>
            </CardContent>
            <CardFooter className="pt-1">
              <Button type="submit" form="login-form" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <LoaderCircleIcon data-icon="inline-start" className="animate-spin" aria-hidden="true" />
                    Validando acceso…
                  </>
                ) : (
                  "Iniciar sesión"
                )}
              </Button>
            </CardFooter>
          </Card>
          <div className="mt-8 text-center lg:hidden">
            <h1 className="text-xl font-semibold">Control de accesos del centro</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Registra entradas y salidas, y consulta la actividad autorizada desde un único espacio.
            </p>
          </div>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Si no puedes acceder, contacta con la persona administradora del sistema.
          </p>
        </div>
      </main>
    </div>
  );
}
