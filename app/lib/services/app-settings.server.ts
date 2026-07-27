import { UserEntity } from "~/lib/database/user.server";
import {
  AppSettingsEntity,
  GLOBAL_APP_SETTINGS_ID,
} from "~/lib/database/app-settings.server";
import { updateAppSettingsSchema } from "~/lib/schemas/app-settings";

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

  if (
    current.earlyArrivalToleranceMinutes === parsed.data.earlyArrivalToleranceMinutes
  ) {
    return { success: true as const, changed: false as const, settings: current };
  }

  if (
    parsed.data.updatedAt &&
    current.updatedAt.getTime() !== parsed.data.updatedAt.getTime()
  ) {
    return {
      success: false as const,
      code: "conflict" as const,
      errors: "La configuración cambió mientras la editabas. Recarga la página e inténtalo de nuevo.",
    };
  }

  const updated = await AppSettingsEntity.updateGlobalWithAudit({
    earlyArrivalToleranceMinutes: parsed.data.earlyArrivalToleranceMinutes,
    updatedById: actor.id,
    expectedUpdatedAt: parsed.data.updatedAt ?? current.updatedAt,
    summary: `Anticipación permitida modificada de ${current.earlyArrivalToleranceMinutes} a ${parsed.data.earlyArrivalToleranceMinutes} minutos`,
    metadata: {
      previous: {
        earlyArrivalToleranceMinutes: current.earlyArrivalToleranceMinutes,
      },
      updated: {
        earlyArrivalToleranceMinutes: parsed.data.earlyArrivalToleranceMinutes,
      },
    },
  });

  if (!updated) {
    return {
      success: false as const,
      code: "conflict" as const,
      errors: "La configuración cambió mientras la editabas. Recarga la página e inténtalo de nuevo.",
    };
  }

  return { success: true as const, changed: true as const, settings: updated };
}
