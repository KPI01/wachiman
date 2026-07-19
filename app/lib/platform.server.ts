import { getEnv } from "./env.server";

export function areFileUploadsSupported(): boolean {
  return getEnv("DISABLE_FILE_UPLOADS") !== "true";
}
