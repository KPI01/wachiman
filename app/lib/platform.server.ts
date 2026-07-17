export function areFileUploadsSupported(): boolean {
  return process.env.DISABLE_FILE_UPLOADS !== "true";
}
