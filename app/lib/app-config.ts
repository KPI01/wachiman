import { createContext, useContext } from "react";

export type AppConfig = {
  appName: string;
  appLogo: string;
  appFavicon: string;
  appLogoDefault: string;
  appFaviconDefault: string;
  workPermitsEnabled: boolean;
};

export const DEFAULT_APP_CONFIG: AppConfig = {
  appName: "Wachiman App",
  appLogo: "/app_logo.svg",
  appFavicon: "/app_logo.svg",
  appLogoDefault: "/app_logo.svg",
  appFaviconDefault: "/app_logo.svg",
  workPermitsEnabled: false,
};

export const AppConfigContext = createContext<AppConfig>(DEFAULT_APP_CONFIG);

export function useAppConfig(): AppConfig {
  return useContext(AppConfigContext);
}
