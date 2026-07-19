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
    // Workers bindings (vars + secrets) are NOT accessible via process.env.
    // Copy string values so code using process.env (crypt.server.ts, etc.) works.
    if (env && typeof process !== "undefined" && process.env) {
      for (const key of Object.keys(env as Record<string, unknown>)) {
        const val = (env as Record<string, unknown>)[key];
        if (typeof val === "string") {
          (process.env as Record<string, unknown>)[key] = val;
        }
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
