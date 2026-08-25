import { z } from "zod";

export const EARLY_ARRIVAL_TOLERANCE_MINUTES_DEFAULT = 60;
export const EARLY_ARRIVAL_TOLERANCE_MINUTES_MIN = 0;
export const EARLY_ARRIVAL_TOLERANCE_MINUTES_MAX = 360;

export const updateAppSettingsSchema = z.object({
  earlyArrivalToleranceMinutes: z.coerce
    .number({ message: "La anticipación debe ser un número." })
    .int("La anticipación debe ser un número entero.")
    .min(
      EARLY_ARRIVAL_TOLERANCE_MINUTES_MIN,
      "La anticipación no puede ser negativa.",
    )
    .max(
      EARLY_ARRIVAL_TOLERANCE_MINUTES_MAX,
      "La anticipación máxima es de 360 minutos.",
    ),
  updatedAt: z.coerce.date().optional(),
  holderLegalName: z.string().trim().min(1, "La razón social es obligatoria."),
  holderTaxId: z.string().trim().min(1, "El NIF/CIF es obligatorio."),
  holderFiscalAddress: z.string().trim().min(1, "El domicilio fiscal es obligatorio."),
});

export type UpdateAppSettingsInput = z.infer<typeof updateAppSettingsSchema>;
