declare global {
  namespace NodeJS {
    interface ProcessEnv {
      APP_NAME: string;
      APP_LOGO: string;
      APP_FAVICON: string;
    }
  }
}

export {};
