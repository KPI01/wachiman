import { UserEntity } from "~/lib/database/user.server";
import {
  AppSettingsEntity,
} from "~/lib/database/app-settings.server";
import type { BrandingAsset } from "~/lib/services/branding-image.server";
import { validateBrandingImage } from "~/lib/services/branding-image.server";
import {
  updateAppSettingsSchema,
  updateHolderCompanySettingsSchema,
} from "~/lib/schemas/app-settings";

export async function getGlobalAppSettings() {
  return AppSettingsEntity.getGlobal();
}

export async function getPublicBrandingAsset(asset: BrandingAsset) {
  const storedAsset = await AppSettingsEntity.getBrandingAsset(asset);
  if (!storedAsset?.data || !storedAsset.mimeType) return null;
  return {
    bytes: Buffer.from(storedAsset.data, "base64"),
    mimeType: storedAsset.mimeType,
  };
}

export async function updateGlobalAppSettings(
  input: unknown,
  actorUsername: string,
  branding: {
    appLogoFile?: File | null;
    appFaviconFile?: File | null;
    resetAppLogo?: boolean;
    resetAppFavicon?: boolean;
  } = {},
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

  const [logo, favicon] = await Promise.all([
    branding.resetAppLogo ? null : validateBrandingImage(branding.appLogoFile),
    branding.resetAppFavicon ? null : validateBrandingImage(branding.appFaviconFile),
  ]);
  if (logo && "error" in logo) {
    return { success: false as const, errors: logo.error };
  }
  if (favicon && "error" in favicon) {
    return { success: false as const, errors: favicon.error };
  }

  const logoChanged = branding.resetAppLogo
    ? Boolean(current.appLogoMimeType)
    : Boolean(logo);
  const faviconChanged = branding.resetAppFavicon
    ? Boolean(current.appFaviconMimeType)
    : Boolean(favicon);
  const settingsChanged =
    current.earlyArrivalToleranceMinutes !== parsed.data.earlyArrivalToleranceMinutes;

  if (!settingsChanged && !logoChanged && !faviconChanged) {
    return { success: true as const, changed: false as const, settings: current };
  }

  const summaryParts = [];
  if (settingsChanged) summaryParts.push("parámetros de acceso");
  if (logoChanged) summaryParts.push("logo");
  if (faviconChanged) summaryParts.push("favicon");
  const metadata: Record<string, unknown> = {
    previous: {},
    updated: {},
  };
  const previous = metadata.previous as Record<string, unknown>;
  const updatedValues = metadata.updated as Record<string, unknown>;
  if (settingsChanged) {
    previous.earlyArrivalToleranceMinutes = current.earlyArrivalToleranceMinutes;
    updatedValues.earlyArrivalToleranceMinutes = parsed.data.earlyArrivalToleranceMinutes;
  }
  if (logoChanged) {
    previous.appLogoMimeType = current.appLogoMimeType;
    updatedValues.appLogoMimeType = branding.resetAppLogo ? null : logo?.mimeType;
  }
  if (faviconChanged) {
    previous.appFaviconMimeType = current.appFaviconMimeType;
    updatedValues.appFaviconMimeType = branding.resetAppFavicon ? null : favicon?.mimeType;
  }

  const updated = await AppSettingsEntity.updateGlobalWithAudit({
    earlyArrivalToleranceMinutes: parsed.data.earlyArrivalToleranceMinutes,
    updatedById: actor.id,
    previousUpdatedAt: current.updatedAt,
    summary: `Configuración actualizada: ${summaryParts.join(", ")}`,
    metadata,
    ...(branding.resetAppLogo
      ? { appLogoData: null, appLogoMimeType: null }
      : logo
        ? { appLogoData: logo.data, appLogoMimeType: logo.mimeType }
        : {}),
    ...(branding.resetAppFavicon
      ? { appFaviconData: null, appFaviconMimeType: null }
      : favicon
        ? { appFaviconData: favicon.data, appFaviconMimeType: favicon.mimeType }
        : {}),
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
