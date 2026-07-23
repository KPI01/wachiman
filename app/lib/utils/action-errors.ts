type ErrorTree = {
  errors?: string[];
  properties?: Record<string, ErrorTree | undefined>;
};

export function getActionErrorMessage(
  value: unknown,
  fallback = "No se pudo completar la operación.",
): string {
  if (typeof value === "string" && value.trim()) return value;
  if (Array.isArray(value)) {
    const messages = value.filter((item): item is string => typeof item === "string");
    if (messages.length) return messages.join(" ");
  }

  const tree = value as ErrorTree | null | undefined;
  const messages: string[] = [
    ...(tree?.errors ?? []),
    ...Object.values(tree?.properties ?? {}).flatMap((property) =>
      property ? getActionErrorMessage(property, "") : [],
    ),
  ].filter(Boolean);

  return messages.length ? messages.join(" ") : fallback;
}
