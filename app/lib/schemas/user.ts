import z from "zod";
import {
  PASSWORDS_MUST_BE_EQUAL,
  STRING_TYPE_REQUIRED_MSG,
  USER_ALREADY_EXISTS,
} from "./messages";
import { getUserByUsername } from "../database/user";

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
