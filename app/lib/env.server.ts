export function getEnv(name: string, fallback?: string): string | undefined {
  const g = (globalThis as Record<string, unknown>)[name];
  if (typeof g === "string" && g.length > 0) return g;

  if (typeof process !== "undefined" && process.env) {
    const val = process.env[name] as string | undefined;
    if (val !== undefined) return val;
  }

  return fallback;
}
