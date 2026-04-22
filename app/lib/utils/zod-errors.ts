type TreeifiedError = {
  properties?: Record<string, { errors?: string[] }>;
};

export function getFieldErrors(
  errorTree: unknown,
  fieldName: string
): string[] | undefined {
  const tree = errorTree as TreeifiedError | undefined;
  const fieldErrors = tree?.properties?.[fieldName]?.errors;
  return fieldErrors && fieldErrors.length > 0 ? fieldErrors : undefined;
}
