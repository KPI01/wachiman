import { getEnv } from "./env.server";

import { createCookieSessionStorage, redirect } from "react-router";
import { USER_ROLES, type UserRole } from "../../db/enums";

type SessionPayload = Record<string, unknown>;

export type SessionUser = {
  id: string
  fullName: string;
  username: string;
  role: UserRole | null;
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
    ACCESS_MONITOR: "/monitor",
    SECURITY_MANAGER: "/security",
    ACCESS_REQUESTER: "/requester",
    ACCESS_APPROVER: "/approver",
  };

  if (!role || !Object.keys(paths).includes(role)) {
    throw redirect("/unauthorized");
  }

  return paths[role];
}

const SESSION_SECRET = getEnv("SESSION_SECRET", "dev-session-secret")!;
const SESSION_NAME = "wachiman-session";
const SESSION_COOKIE_SECURE =
  getEnv("SESSION_COOKIE_SECURE") === undefined
    ? process.env.NODE_ENV === "production"
    : getEnv("SESSION_COOKIE_SECURE")!.trim().toLowerCase() === "true";
const USER_ROLES_SET = new Set(Object.values(USER_ROLES));
const SECONDS_IN_A_MINUTE = 60;
const MINUTES_IN_A_HOUR = 60;

const sessionStorage = createCookieSessionStorage<SessionPayload>({
  cookie: {
    name: SESSION_NAME,
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secrets: [SESSION_SECRET],
    secure: SESSION_COOKIE_SECURE,
    maxAge: SECONDS_IN_A_MINUTE * MINUTES_IN_A_HOUR * 8,
  },
});

export async function createSession(data: SessionPayload) {
  const session = await sessionStorage.getSession();

  for (const [key, value] of Object.entries(data)) {
    session.set(key, value);
  }

  return await sessionStorage.commitSession(session);
}

export async function addSessionData(request: Request, data: SessionPayload) {
  const session = await sessionStorage.getSession(
    request.headers.get("Cookie"),
  );

  for (const [key, value] of Object.entries(data)) {
    session.set(key, value);
  }

  return await sessionStorage.commitSession(session);
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
        USER_ROLES_SET.has(user.role as UserRole)))
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
  const session = await sessionStorage.getSession(
    request.headers.get("Cookie"),
  );

  const user = session.get("user");

  if (!isSessionUser(user)) {
    return null;
  }

  return user;
}

export async function getSessionSite(request: Request) {
  const session = await sessionStorage.getSession(
    request.headers.get("Cookie"),
  );

  const user = session.get("user");

  if (!isSessionUser(user)) {
    return null;
  }

  return user.site;
}

export async function getSessionDepartment(request: Request) {
  const session = await sessionStorage.getSession(
    request.headers.get("Cookie"),
  );

  const user = session.get("user");

  if (!isSessionUser(user)) {
    return null;
  }

  return user.department;
}

export async function destroySession(request: Request) {
  const session = await sessionStorage.getSession(
    request.headers.get("Cookie"),
  );

  return await sessionStorage.destroySession(session);
}

export { sessionStorage };
