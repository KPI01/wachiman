export function parseUtcDateOnly(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function endOfUtcDay(date: Date) {
  return new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    23,
    59,
    59,
    999,
  ));
}

export function isDateValidThrough(expiryDate: Date, validThrough: Date) {
  return startOfUtcDay(expiryDate).getTime() >= startOfUtcDay(validThrough).getTime();
}

export function isDateExpired(expiryDate: Date, now = new Date()) {
  return startOfUtcDay(expiryDate).getTime() < startOfUtcDay(now).getTime();
}
