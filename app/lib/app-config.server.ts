import { getEnv } from "./env.server";
import { DEFAULT_APP_CONFIG, type AppConfig } from "./app-config";
import { getGlobalAppSettings } from "./services/app-settings.server";

export function getAppConfig(): AppConfig {
  const workPermitsEnabled = getEnv("WORK_PERMITS_ENABLED", "false") === "true";
  const appLogoDefault = getEnv("APP_LOGO", DEFAULT_APP_CONFIG.appLogo)!;
  const appFaviconDefault = getEnv("APP_FAVICON", DEFAULT_APP_CONFIG.appFavicon)!;
  return {
    appName: getEnv("APP_NAME", DEFAULT_APP_CONFIG.appName)!,
    appLogo: appLogoDefault,
    appFavicon: appFaviconDefault,
    appLogoDefault,
    appFaviconDefault,
    workPermitsEnabled,
  };
}

export async function getResolvedAppConfig(): Promise<AppConfig> {
  const config = getAppConfig();
  const settings = await getGlobalAppSettings();
  const version = settings?.updatedAt.getTime();

  return {
    ...config,
    appLogo: settings?.appLogoMimeType && version
      ? `/api/app-branding/logo?v=${version}`
      : config.appLogoDefault,
    appFavicon: settings?.appFaviconMimeType && version
      ? `/api/app-branding/favicon?v=${version}`
      : config.appFaviconDefault,
  };
}
