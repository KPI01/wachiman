import { getEnv } from "./env.server";

export function isFilesystemStorageEnabled(): boolean {
  const isNode = typeof process !== "undefined" && Boolean(process.versions?.node);
  return getEnv("FILE_STORAGE_MODE", isNode ? "filesystem" : "disabled") === "filesystem";
}

export function areFileUploadsSupported(): boolean {
  return isFilesystemStorageEnabled();
}
