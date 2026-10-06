import { UserEntity } from "~/lib/database/user.server";
import {
  AppSettingsEntity,
} from "~/lib/database/app-settings.server";
import {
  updateAppSettingsSchema,
  updateHolderCompanySettingsSchema,
} from "~/lib/schemas/app-settings";

export async function getGlobalAppSettings() {
  return AppSettingsEntity.getGlobal();
}

export async function updateGlobalAppSettings(
  input: unknown,
  actorUsername: string,
) {
  const parsed = updateAppSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, errors: parsed.error.flatten().fieldErrors };
  }

  const actor = await UserEntity.getByUsername(actorUsername);
  if (!actor || actor.role !== "ADMIN") {
    return { success: false as const, errors: "No tienes permisos para modificar la configuración." };
  }

  const current = await AppSettingsEntity.getGlobal();
  if (!current) {
    return { success: false as const, errors: "La configuración global no está inicializada." };
  }

  if (current.earlyArrivalToleranceMinutes === parsed.data.earlyArrivalToleranceMinutes) {
    return { success: true as const, changed: false as const, settings: current };
  }

  const updated = await AppSettingsEntity.updateGlobalWithAudit({
    earlyArrivalToleranceMinutes: parsed.data.earlyArrivalToleranceMinutes,
    updatedById: actor.id,
    previousUpdatedAt: current.updatedAt,
    summary: `Anticipación permitida modificada de ${current.earlyArrivalToleranceMinutes} a ${parsed.data.earlyArrivalToleranceMinutes} minutos`,
    metadata: {
      previous: { earlyArrivalToleranceMinutes: current.earlyArrivalToleranceMinutes },
      updated: { earlyArrivalToleranceMinutes: parsed.data.earlyArrivalToleranceMinutes },
    },
  });

  if (!updated) {
    return {
      success: false as const,
      errors: "No se pudo guardar la configuración. Vuelve a intentarlo.",
    };
  }

  return { success: true as const, changed: true as const, settings: updated };
}

export async function updateHolderCompanySettings(
  input: unknown,
  actorUsername: string,
) {
  const parsed = updateHolderCompanySettingsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, errors: parsed.error.flatten().fieldErrors };
  }

  const actor = await UserEntity.getByUsername(actorUsername);
  if (!actor || !["ADMIN", "SECURITY_MANAGER"].includes(actor.role ?? "")) {
    return {
      success: false as const,
      errors: "No tienes permisos para modificar los datos de la empresa titular.",
    };
  }

  const current = await AppSettingsEntity.getGlobal();
  if (!current) {
    return { success: false as const, errors: "La configuración global no está inicializada." };
  }

  if (
    current.holderLegalName === parsed.data.holderLegalName &&
    current.holderTaxId === parsed.data.holderTaxId &&
    current.holderFiscalAddress === parsed.data.holderFiscalAddress
  ) {
    return { success: true as const, changed: false as const, settings: current };
  }

  const updated = await AppSettingsEntity.updateGlobalWithAudit({
    holderLegalName: parsed.data.holderLegalName,
    holderTaxId: parsed.data.holderTaxId,
    holderFiscalAddress: parsed.data.holderFiscalAddress,
    updatedById: actor.id,
    previousUpdatedAt: current.updatedAt,
    summary: "Datos legales de la empresa titular actualizados",
    metadata: {
      previous: {
        holderLegalName: current.holderLegalName,
        holderTaxId: current.holderTaxId,
        holderFiscalAddress: current.holderFiscalAddress,
      },
      updated: {
        holderLegalName: parsed.data.holderLegalName,
        holderTaxId: parsed.data.holderTaxId,
        holderFiscalAddress: parsed.data.holderFiscalAddress,
      },
    },
  });

  if (!updated) {
    return {
      success: false as const,
      errors: "No se pudieron guardar los datos de la empresa titular. Vuelve a intentarlo.",
    };
  }

  return { success: true as const, changed: true as const, settings: updated };
}
