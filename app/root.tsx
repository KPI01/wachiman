
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Link,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "react-router";

import type { Route } from "./+types/root";
import { Toaster } from "~/components/ui/sonner";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { TooltipProvider } from "~/components/ui/tooltip";
import { initDb, isDbInitialized } from "../db/server";
import { AppConfigContext, DEFAULT_APP_CONFIG } from "~/lib/app-config";
import type { AppConfig } from "~/lib/app-config";
import { getAppConfig } from "~/lib/app-config.server";
import { CircleAlertIcon } from "lucide-react";
import "./app.css";

export function loader() {
  return getAppConfig();
}

export const middleware: Route.MiddlewareFunction[] = [
  async (_, next) => {
    if (!isDbInitialized()) {
      await initDb();
    }
    return next();
  }
];

export function Layout({ children }: { children: React.ReactNode }) {
  const appConfig =
    (useLoaderData() as AppConfig | undefined) ?? DEFAULT_APP_CONFIG;

  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/svg+xml" href={appConfig.appFavicon} />
        <Meta />
        <Links />
      </head>
      <body className="min-h-dvh w-full max-w-dvw grid grid-cols-1 grid-rows-1">
        <TooltipProvider>
          <AppConfigContext.Provider value={appConfig}>
            {children}
          </AppConfigContext.Provider>
        </TooltipProvider>
        <Toaster />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let status: number | undefined;
  let message = "No se pudo completar la solicitud";
  let details = "Inténtalo de nuevo. Si el problema continúa, contacta con la persona administradora.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    status = error.status;
    const messages: Record<number, { title: string; description: string }> = {
      400: {
        title: "No se pudo procesar la solicitud",
        description: "Revisa la información e inténtalo de nuevo.",
      },
      401: {
        title: "Tu sesión ha caducado",
        description: "Inicia sesión de nuevo para continuar.",
      },
      403: {
        title: "No tienes permiso para acceder",
        description: "Solicita acceso a la persona administradora del sistema.",
      },
      404: {
        title: "Página no encontrada",
        description: "La dirección no existe o el contenido ya no está disponible.",
      },
      405: {
        title: "No se pudo completar esta acción",
        description: "Vuelve a la pantalla anterior e inténtalo de nuevo.",
      },
      409: {
        title: "Los datos han cambiado",
        description: "Actualiza la pantalla y vuelve a intentarlo.",
      },
      429: {
        title: "Demasiadas solicitudes",
        description: "Espera un momento antes de volver a intentarlo.",
      },
      500: {
        title: "El servicio no está disponible",
        description: "No se pudo completar la solicitud. Inténtalo de nuevo más tarde.",
      },
    };
    const copy = messages[error.status];
    message = copy?.title ?? message;
    details = copy?.description ?? details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = "Se produjo un error inesperado durante la solicitud.";
    stack = error.stack;
  }

  return (
    <main className="grid min-h-svh place-items-center bg-muted/40 p-4">
      <Card className="w-full max-w-xl border-destructive/20 shadow-sm">
        <CardHeader className="gap-3">
          <p className="text-sm font-medium text-primary">Wachiman</p>
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
              <CircleAlertIcon aria-hidden="true" />
            </span>
            <CardTitle className="text-2xl">{message}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid gap-5">
          <Alert variant="destructive">
            <AlertTitle>{status ? `Error ${status}` : "Error inesperado"}</AlertTitle>
            <AlertDescription>{details}</AlertDescription>
          </Alert>
          {stack && (
            <pre className="max-h-72 w-full overflow-auto rounded-lg bg-muted p-4 text-xs">
              <code>{stack}</code>
            </pre>
          )}
          <Button asChild className="w-fit"><Link to="/">Volver al inicio</Link></Button>
        </CardContent>
      </Card>
    </main>
  );
}
