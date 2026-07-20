import { createContext, useContext } from "react";

export type AppConfig = {
  appName: string;
  appLogo: string;
  appFavicon: string;
};

export const DEFAULT_APP_CONFIG: AppConfig = {
  appName: "Wachiman App",
  appLogo: "/app_logo.svg",
  appFavicon: "/app_logo.svg",
};

export const AppConfigContext = createContext<AppConfig>(DEFAULT_APP_CONFIG);

export function useAppConfig(): AppConfig {
  return useContext(AppConfigContext);
}
