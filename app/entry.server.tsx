import { isbot } from "isbot";
import { renderToReadableStream } from "react-dom/server";
import type { AppLoadContext, EntryContext } from "react-router";
import { ServerRouter } from "react-router";

let _initialized = false;
async function ensureDbInitialized() {
  if (_initialized) return;
  _initialized = true;
  if (typeof process !== "undefined" && process.versions?.node) {
    const { initLocalDb } = await import("../db/server");
    await initLocalDb();
  }
}

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  _loadContext: AppLoadContext,
) {
  await ensureDbInitialized();

  if (request.method.toUpperCase() === "HEAD") {
    return new Response(null, {
      status: responseStatusCode,
      headers: responseHeaders,
    });
  }

  const userAgent = request.headers.get("user-agent");
  const readyOption: "onAllReady" | "onShellReady" =
    (userAgent && isbot(userAgent)) || routerContext.isSpaMode
      ? "onAllReady"
      : "onShellReady";

  const body = await renderToReadableStream(
    <ServerRouter context={routerContext} url={request.url} />,
    {
      signal: request.signal,
      onError(error: unknown) {
        console.error(error);
        responseStatusCode = 500;
      },
    },
  );

  if (readyOption === "onAllReady") {
    await body.allReady;
  }

  responseHeaders.set("Content-Type", "text/html");

  return new Response(body, {
    status: responseStatusCode,
    headers: responseHeaders,
  });
}
