import z from "zod";
import { requiredString } from "./generic";
import {
  DOCUMENT_EXPIRY_REQUIRED,
  DOCUMENT_TYPE_REQUIRED,
} from "./messages";
import { parseUtcDateOnly } from "../document-expiry";

export const uploadDocumentSchema = z.object({
  documentType: requiredString.refine(
    (v) => ["IDENTIFICATION", "TRAINING", "SPECIAL_PERMISSION"].includes(v as string),
    DOCUMENT_TYPE_REQUIRED,
  ).transform((v) => v as "IDENTIFICATION" | "TRAINING" | "SPECIAL_PERMISSION"),
  expiryDate: requiredString.refine((v) => {
    const date = parseUtcDateOnly(v);
    return !isNaN(date.getTime());
  }, DOCUMENT_EXPIRY_REQUIRED).transform(parseUtcDateOnly),
  notes: z.string().optional(),
});

export const updateDocumentSchema = z.object({
  id: requiredString,
  status: z
    .string()
    .optional()
    .refine(
      (v) => !v || ["VALIDATED", "EXPIRED", "ARCHIVED"].includes(v as string),
      "El estado no es valido.",
    )
    .transform((v) => v as "VALIDATED" | "EXPIRED" | "ARCHIVED" | undefined),
  expiryDate: z
    .string()
    .optional()
    .refine((v) => {
      if (!v) return true;
      const date = parseUtcDateOnly(v);
      return !isNaN(date.getTime());
    }, DOCUMENT_EXPIRY_REQUIRED)
    .transform((v) => (v ? parseUtcDateOnly(v) : undefined)),
  notes: z.string().optional(),
});

export const deleteDocumentSchema = z.object({
  id: requiredString,
});

export const checkExpirySchema = z.object({
  token: z.string().optional(),
});
