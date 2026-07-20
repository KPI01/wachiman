import { getEnv } from "./env.server";
import { DEFAULT_APP_CONFIG, type AppConfig } from "./app-config";

export function getAppConfig(): AppConfig {
  return {
    appName: getEnv("APP_NAME", DEFAULT_APP_CONFIG.appName)!,
    appLogo: getEnv("APP_LOGO", DEFAULT_APP_CONFIG.appLogo)!,
    appFavicon: getEnv("APP_FAVICON", DEFAULT_APP_CONFIG.appFavicon)!,
  };
}
