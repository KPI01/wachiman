/// <reference types="@cloudflare/workers-types" />

import { createRequestHandler } from "react-router";
import { initPrisma } from "../app/lib/prisma.server";

interface Env {
  DB: D1Database;
  ENCRIPTION_KEY: string;
  SESSION_SECRET: string;
  APP_NAME: string;
  APP_LOGO: string;
  APP_FAVICON: string;
  DISABLE_FILE_UPLOADS: string;
}

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE,
);

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    initPrisma(env.DB);
    return requestHandler(request, {
      cloudflare: { env, ctx },
    });
  },
} satisfies ExportedHandler<Env>;
