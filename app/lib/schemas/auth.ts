import { z } from "zod";
import {
  PASSWORD_IS_INVALID,
  PASSWORDS_MUST_BE_EQUAL,
  STRING_TYPE_REQUIRED_MSG,
  USER_ALREADY_EXISTS,
  USER_DOESNT_EXISTS,
} from "./messages";
import { getUserByUsername } from "../database/user";
import { validateHashedText } from "../hash";

export const registerSchema = z
  .object({
    fullName: z.string(STRING_TYPE_REQUIRED_MSG),
    username: z.string(STRING_TYPE_REQUIRED_MSG),
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

export const loginSchema = z
  .object({
    username: z.string(STRING_TYPE_REQUIRED_MSG),
    password: z.string(STRING_TYPE_REQUIRED_MSG),
  })
  .refine(
    async (data) => {
      const userExists = (await getUserByUsername(data.username)) !== null;
      return userExists;
    },
    {
      error: USER_DOESNT_EXISTS,
      path: ["username"],
    },
  )
  .refine(
    async (data) => {
      const user = await getUserByUsername(data.username);

      if (user) {
        const passwordIsValid = await validateHashedText(
          user.password,
          data.password,
        );

        return passwordIsValid;
      }

      return false;
    },
    {
      error: PASSWORD_IS_INVALID,
      path: ["password"],
    },
  );
