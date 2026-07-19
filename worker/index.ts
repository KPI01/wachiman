import { createRequestHandler } from "@react-router/cloudflare";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — build output, exists after build completes
import * as build from "../dist/server/index.js";

const handler = createRequestHandler({ build, mode: "production" });

export default {
  async fetch(
    request: Request,
    env: Record<string, unknown>,
    ctx: ExecutionContext,
  ) {
    // Workers bindings (vars + secrets) are getter-based, not enumerable.
    // Object.keys(env) returns [] so we must reference each key explicitly.
    const g = globalThis as Record<string, unknown>;
    const envVars = ["ENCRYPTION_KEY", "SESSION_SECRET", "APP_NAME", "APP_LOGO", "APP_FAVICON", "SESSION_COOKIE_SECRET", "DISABLE_FILE_UPLOADS"];
    for (const name of envVars) {
      if (name in env && typeof (env as Record<string, unknown>)[name] === "string") {
        g[name] = (env as Record<string, unknown>)[name];
      }
    }

    if (env.DB) {
      const initDb = (globalThis as Record<string, unknown>)
        .__WACHIMAN_INIT_DB__ as ((d1: D1Database) => Promise<void>) | undefined;
      if (initDb) {
        await initDb(env.DB as D1Database);
      }
    }

    return handler({
      request,
      env,
      ctx: {
        waitUntil: ctx.waitUntil.bind(ctx),
        passThroughOnException: ctx.passThroughOnException.bind(ctx),
      },
      waitUntil: ctx.waitUntil.bind(ctx),
      passThroughOnException: ctx.passThroughOnException.bind(ctx),
    });
  },
};
