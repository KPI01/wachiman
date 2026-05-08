import { z } from "zod";
import { PASSWORDS_MUST_BE_EQUAL } from "./messages";
import { requiredString } from "./generic";

export const loginSchema = z.object({
  username: requiredString,
  password: requiredString,
});

export const updatePasswordSchema = z
  .object({
    newPassword: requiredString,
    newPasswordConfirmation: requiredString,
  })
  .refine((data) => data.newPassword === data.newPasswordConfirmation, {
    error: PASSWORDS_MUST_BE_EQUAL,
  })
  .transform((data) => data.newPassword);
