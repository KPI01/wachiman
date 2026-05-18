export async function getFormData(request: Request) {
  const rawData = await request.formData();

  return Object.fromEntries(rawData);
}

export function getQueryParams(
  request: Request,
  param: string | string[],
): Record<string, string | null> {
  const url = new URL(request.url);
  let values: Record<string, string | null> = {};

  if (Array.isArray(param)) {
    param.forEach((p) => (values[p] = url.searchParams.get(p)));
  } else {
    values[param] = url.searchParams.get(param);
  }

  return values;
}
