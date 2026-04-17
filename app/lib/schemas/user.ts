import z from "zod";
import {
  PASSWORDS_MUST_BE_EQUAL,
  STRING_TYPE_REQUIRED_MSG,
  USER_ALREADY_EXISTS,
} from "./messages";
import { getUserById, getUserByUsername } from "../database/user";
import { prisma } from "../prisma";

export const createUserSchema = z
  .object({
    fullName: z.string(STRING_TYPE_REQUIRED_MSG),
    username: z.string(STRING_TYPE_REQUIRED_MSG),
    role: z.enum(["ADMIN", "MANAGEMENT", "USER"]).optional().default("USER"),
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
  );

export const updateUserSchema = z
  .object({
    id: z.string(STRING_TYPE_REQUIRED_MSG),
    fullName: z.string(STRING_TYPE_REQUIRED_MSG),
    username: z.string(STRING_TYPE_REQUIRED_MSG),
    role: z.enum(["ADMIN", "MANAGEMENT", "USER"]).optional().default("USER"),
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
  );

export const trashUserSchema = z.object({
  id: z.string(STRING_TYPE_REQUIRED_MSG),
});
