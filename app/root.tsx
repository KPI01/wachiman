/// <reference types="@cloudflare/workers-types" />

import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "react-router";

import type { Route } from "./+types/root";
import { Toaster } from "~/components/ui/sonner";
import { initLocalDb, isDbInitialized } from "../db/server";
import { AppConfigContext } from "~/lib/app-config";
import type { AppConfig } from "~/lib/app-config";
import { getAppConfig } from "~/lib/app-config.server";
import "./app.css";

export function loader() {
  return getAppConfig();
}

export const middleware: Route.MiddlewareFunction[] = [
  async (_, next) => {
    // Cloudflare initializes D1 before the request handler; Node initializes SQLite here.
    if (!isDbInitialized()) {
      await initLocalDb();
    }
    return next();
  }
];

export function Layout({ children }: { children: React.ReactNode }) {
  const appConfig = useLoaderData() as AppConfig;

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
        <AppConfigContext.Provider value={appConfig}>
          {children}
        </AppConfigContext.Provider>
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
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
