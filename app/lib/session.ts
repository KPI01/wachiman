import { performance } from "node:perf_hooks";
import { createCookieSessionStorage } from "react-router";

type SessionPayload = Record<string, unknown>;

const SESSION_SECRET = process.env.SESSION_SECRET ?? "dev-session-secret";
const SESSION_NAME = "wachiman-session";

const sessionStorage = createCookieSessionStorage<SessionPayload>({
  cookie: {
    name: SESSION_NAME,
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secrets: [SESSION_SECRET],
    secure: process.env.NODE_ENV === "production",
  },
});

export async function createSession(data: SessionPayload) {
  const start = performance.now();

  try {
    const session = await sessionStorage.getSession();

    for (const [key, value] of Object.entries(data)) {
      session.set(key, value);
    }

    return await sessionStorage.commitSession(session);
  } finally {
    console.log(`[createSession] ${(performance.now() - start).toFixed(2)}ms`);
  }
}

export async function addSessionData(request: Request, data: SessionPayload) {
  const start = performance.now();

  try {
    const session = await sessionStorage.getSession(
      request.headers.get("Cookie"),
    );

    for (const [key, value] of Object.entries(data)) {
      session.set(key, value);
    }

    return await sessionStorage.commitSession(session);
  } finally {
    console.log(`[addSessionData] ${(performance.now() - start).toFixed(2)}ms`);
  }
}

export async function destroySession(request: Request) {
  const start = performance.now();

  try {
    const session = await sessionStorage.getSession(
      request.headers.get("Cookie"),
    );

    return await sessionStorage.destroySession(session);
  } finally {
    console.log(`[destroySession]${(performance.now() - start).toFixed(2)}ms`);
  }
}

export { sessionStorage };
