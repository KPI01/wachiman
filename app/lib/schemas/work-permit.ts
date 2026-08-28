import z from "zod";
import { requiredString } from "./generic";
import { signaturePayloadFromStringSchema } from "./access-log";

const booleanField = z.preprocess(
  (value) => value === "true" || value === "on",
  z.boolean(),
).optional().default(false);

const riskItemsField = z.preprocess((value, context) => {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    context.addIssue({ code: "custom", message: "Indica los riesgos de la tarea." });
    return z.NEVER;
  }
}, z.array(z.object({ title: requiredString, measures: requiredString })));

export const createWorkPermitActivitySchema = z.object({
  plannedAccessId: requiredString,
  taskDescription: requiredString,
  workAreaSnapshot: requiredString,
  riskItems: riskItemsField,
  toolsAndEquipment: requiredString,
  personalProtectiveEquipment: requiredString,
  incidents: z.string().trim().optional(),
  toolsAdequate: booleanField,
  procedureKnown: booleanField,
  trainingProvided: booleanField,
  areaOrderly: booleanField,
  ppeAdequate: booleanField,
});

export const personDecisionSchema = z.object({
  plannedAccessPersonId: requiredString,
  accessDecision: z.enum(["PENDING", "APPROVED", "DENIED"]),
  workDecision: z.enum(["PENDING", "NOT_REQUIRED", "APPROVED", "DENIED"]),
  decisionReason: z.string().trim().optional(),
  restrictions: z.string().trim().optional(),
});

export const workPermitSignatureSchema = z.object({
  workPermitId: requiredString,
  signaturePayload: signaturePayloadFromStringSchema,
});
