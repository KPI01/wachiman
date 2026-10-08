import z from "zod";
import { requiredString } from "./generic";

export const createAllowedAreaSchema = z.object({
  name: requiredString,
  siteId: requiredString,
});

export const updateAllowedAreaSchema = z
  .object({
    id: requiredString,
    name: requiredString,
  });

export const deleteAllowedAreaSchema = z.object({
  id: requiredString,
});
