import { z } from "zod";
import {
  PASSWORD_IS_INVALID,
  PASSWORDS_MUST_BE_EQUAL,
  USER_DOESNT_EXISTS,
} from "./messages";
import { UserEntity } from "../database/user.server";
import { validateHashedText } from "../hash.server";
import { requiredString } from "./generic";

export const loginSchema = z
  .object({
    username: requiredString,
    password: requiredString,
  })
  .refine(
    async (data) => {
      const userExists =
        (await UserEntity.getByUsername(data.username)) !== null;
      return userExists;
    },
    {
      error: USER_DOESNT_EXISTS,
      path: ["username"],
    },
  )
  .refine(
    async (data) => {
      const user = await UserEntity.getByUsername(data.username);

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

export const updatePasswordSchema = z
  .object({
    newPassword: requiredString,
    newPasswordConfirmation: requiredString,
  })
  .refine((data) => data.newPassword === data.newPasswordConfirmation, {
    error: PASSWORDS_MUST_BE_EQUAL,
  })
  .transform((data) => data.newPassword);
