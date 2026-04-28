import { performance } from "node:perf_hooks";
import { createCookieSessionStorage, redirect } from "react-router";
import {
  UserRole,
  type UserRole as UserRoleType,
} from "../../prisma/generated/prisma/enums";

type SessionPayload = Record<string, unknown>;

export type SessionUser = {
  fullName: string;
  username: string;
  role: UserRoleType | null;
  site: SessionSite;
  department: SessionDepartment;
};

export type SessionSite = {
  id: string;
  name: string;
};

export type SessionDepartment = {
  id: string;
  name: string;
};

export function getUserRedirectPath(role: SessionUser["role"]) {
  const paths: Record<UserRole, string> = {
    ADMIN: "/admin",
    ACCESS_OPERATOR: "/operator",
    ACCESS_APPROVER: "/approver",
    ACCESS_REQUESTER: "/requester",
    ACCESS_MONITOR: "/monitor",
    SECURITY_MANAGER: "/security",
  };

  if (!role || !Object.keys(paths).includes(role)) {
    throw redirect("/unauthorized");
  }

  return paths[role];
}

const SESSION_SECRET = process.env.SESSION_SECRET ?? "dev-session-secret";
const SESSION_NAME = "wachiman-session";
const USER_ROLES = new Set(Object.values(UserRole));
const SECONDS_IN_A_MINUTE = 60;
const MINUTES_IN_A_HOUR = 60;

const sessionStorage = createCookieSessionStorage<SessionPayload>({
  cookie: {
    name: SESSION_NAME,
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secrets: [SESSION_SECRET],
    secure: process.env.NODE_ENV === "production",
    maxAge: SECONDS_IN_A_MINUTE * MINUTES_IN_A_HOUR * 8,
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

function isSessionUser(value: unknown): value is SessionUser {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const user = value as Record<string, unknown>;

  return (
    typeof user.fullName === "string" &&
    typeof user.username === "string" &&
    isSessionSite(user.site) &&
    isSessionDepartment(user.department) &&
    (user.role === null ||
      (typeof user.role === "string" &&
        USER_ROLES.has(user.role as UserRoleType)))
  );
}

function isSessionSite(value: unknown): value is SessionSite {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const site = value as Record<string, unknown>;

  return typeof site.id === "string" && typeof site.name === "string";
}

function isSessionDepartment(value: unknown): value is SessionDepartment {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const department = value as Record<string, unknown>;

  return (
    typeof department.id === "string" && typeof department.name === "string"
  );
}

export async function getSessionUser(request: Request) {
  const start = performance.now();

  try {
    const session = await sessionStorage.getSession(
      request.headers.get("Cookie"),
    );

    const user = session.get("user");

    if (!isSessionUser(user)) {
      return null;
    }

    return user;
  } finally {
    console.log(`[getSessionUser] ${(performance.now() - start).toFixed(2)}ms`);
  }
}

export async function getSessionSite(request: Request) {
  const start = performance.now();

  try {
    const session = await sessionStorage.getSession(
      request.headers.get("Cookie"),
    );

    const user = session.get("user");

    if (!isSessionUser(user)) {
      return null;
    }

    return user.site;
  } finally {
    console.log(`[getSessionSite] ${(performance.now() - start).toFixed(2)}ms`);
  }
}

export async function getSessionDepartment(request: Request) {
  const start = performance.now();

  try {
    const session = await sessionStorage.getSession(
      request.headers.get("Cookie"),
    );

    const user = session.get("user");

    if (!isSessionUser(user)) {
      return null;
    }

    return user.department;
  } finally {
    console.log(
      `[getSessionDepartment] ${(performance.now() - start).toFixed(2)}ms`,
    );
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
    console.log(`[destroySession] ${(performance.now() - start).toFixed(2)}ms`);
  }
}

export { sessionStorage };
