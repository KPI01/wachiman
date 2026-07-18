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
