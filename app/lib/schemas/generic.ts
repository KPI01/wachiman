import z from "zod";
import { STRING_REQUIRED_MSG, STRING_TYPE_REQUIRED_MSG } from "./messages";

export const requiredString = z
  .string(STRING_TYPE_REQUIRED_MSG)
  .trim()
  .min(1, STRING_REQUIRED_MSG);

export const optionalString = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmedValue = value.trim();

  return trimmedValue.length ? trimmedValue : undefined;
}, z.string(STRING_TYPE_REQUIRED_MSG).optional());
