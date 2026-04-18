import z from "zod";
import {
  DEPARTMENT_DOESNT_EXISTS,
  PASSWORDS_MUST_BE_EQUAL,
  SITE_DOESNT_EXISTS,
  STRING_TYPE_REQUIRED_MSG,
  USER_ALREADY_EXISTS,
} from "./messages";
import { getUserById, getUserByUsername } from "../database/user";
import { getSiteById } from "../database/site";
import { getDepartmentById } from "../database/department";
import { prisma } from "../prisma";
import { UserRole } from "../../../generated/prisma/enums";

export const createUserSchema = z
  .object({
    fullName: z.string(STRING_TYPE_REQUIRED_MSG),
    username: z.string(STRING_TYPE_REQUIRED_MSG),
    siteId: z.string(STRING_TYPE_REQUIRED_MSG),
    departmentId: z.string(STRING_TYPE_REQUIRED_MSG),
    role: z.enum(UserRole).optional().default("ACCESS_REQUESTER"),
    password: z.string(
      STRING_TYPE_REQUIRED_MSG,
    ) /** falta agregar dificultad de la clave */,
    passwordConfirmation: z.string(STRING_TYPE_REQUIRED_MSG),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    error: PASSWORDS_MUST_BE_EQUAL,
    path: ["passwordConfirmation"],
  })
  .refine(
    async (data) => {
      const userExists = (await getUserByUsername(data.username)) !== null;

      return !userExists;
    },
    {
      error: USER_ALREADY_EXISTS,
      path: ["username"],
    },
  )
  .refine(async (data) => (await getSiteById(data.siteId)) !== null, {
    error: SITE_DOESNT_EXISTS,
    path: ["siteId"],
  })
  .refine(async (data) => (await getDepartmentById(data.departmentId)) !== null, {
    error: DEPARTMENT_DOESNT_EXISTS,
    path: ["departmentId"],
  });

export const updateUserSchema = z
  .object({
    id: z.string(STRING_TYPE_REQUIRED_MSG),
    fullName: z.string(STRING_TYPE_REQUIRED_MSG),
    username: z.string(STRING_TYPE_REQUIRED_MSG),
    siteId: z.string(STRING_TYPE_REQUIRED_MSG),
    departmentId: z.string(STRING_TYPE_REQUIRED_MSG),
    role: z.enum(UserRole).optional().default("ACCESS_REQUESTER"),
    isActive: z.preprocess((value) => value === "on", z.boolean()),
  })
  .refine(
    async (data) => {
      const user = await getUserById(data.id);
      if (user) {
        // Query que luego tengo que centralizar
        const userNameExists =
          (await prisma.user.findFirst({
            where: {
              username: data.username,
              NOT: {
                id: user.id,
              },
            },
          })) !== null;

        return !userNameExists;
      }

      return false;
    },
    {
      error: USER_ALREADY_EXISTS,
      path: ["username"],
    },
  )
  .refine(async (data) => (await getSiteById(data.siteId)) !== null, {
    error: SITE_DOESNT_EXISTS,
    path: ["siteId"],
  })
  .refine(async (data) => (await getDepartmentById(data.departmentId)) !== null, {
    error: DEPARTMENT_DOESNT_EXISTS,
    path: ["departmentId"],
  });

export const trashUserSchema = z.object({
  id: z.string(STRING_TYPE_REQUIRED_MSG),
});
