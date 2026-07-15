import { redirect } from "react-router";
import { UserEntity } from "./database/user.server";
import { validateHashedText } from "./hash.server";
import {
  createSession,
  destroySession,
  getSessionUser,
  getUserRedirectPath,
} from "./session.server";
import type { UserRole } from "../../prisma/generated/prisma/enums";
import { loginSchema } from "./schemas/auth";
import z from "zod";
import { INVALID_CREDENTIALS } from "./schemas/messages";

function getFieldError(fieldName: string, message: string) {
  return {
    properties: {
      [fieldName]: {
        errors: [message],
      },
    },
  };
}

export async function isAuthenticated(request: Request) {
  const user = await getSessionUser(request);

  if (!user) {
    throw redirect("/login");
  }

  return user;
}

export async function validateUserRole(
  request: Request,
  role: UserRole | UserRole[],
) {
  const user = await isAuthenticated(request);
  const allowedRoles = Array.isArray(role) ? role : [role];

  if (!user.role || !allowedRoles.includes(user.role)) {
    throw redirect("/unauthorized");
  }

  return user;
}

export async function login(request: Request) {
  const rawFormData = await request.formData();
  const jsonData = Object.fromEntries(rawFormData);

  const { error, data } = await loginSchema.safeParseAsync(jsonData);

  if (error) {
    return { errors: z.treeifyError(error) };
  }

  const user = await UserEntity.getByUsername(data.username, {
    site: true,
    department: true,
  });

  if (!user) {
    return { errors: getFieldError("password", INVALID_CREDENTIALS) };
  }

  const passwordIsValid = await validateHashedText(user.password, data.password);

  if (!passwordIsValid) {
    return { errors: getFieldError("password", INVALID_CREDENTIALS) };
  }

  const sessionCookie = await createSession({
    user: {
      id: user.id,
      fullName: user.fullName,
      username: user.username,
      role: user.role,
      site: {
        id: user.site.id,
        name: user.site.name,
      },
      department: {
        id: user.department.id,
        name: user.department.name,
      },
    },
  });

  return redirect(getUserRedirectPath(user.role), {
    headers: {
      "Set-Cookie": sessionCookie,
    },
  });
}

export async function logout(request: Request) {
  await isAuthenticated(request);

  return redirect("/login", {
    headers: {
      "Set-Cookie": await destroySession(request),
    },
  });
}
