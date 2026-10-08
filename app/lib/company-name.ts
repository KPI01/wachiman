// Solo diferencias de presentación: nunca corregir errores ortográficos automáticamente.
export function normalizeCompanyName(name: string) {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\./g, "").trim().replace(/\s+/g, " ").toLowerCase();
}
