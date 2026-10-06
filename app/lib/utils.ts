import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimestamp({
  date,
  template = "dd/MM/yyyy",
}: {
  date?: Date;
  template?: string;
}) {
  if (date === undefined) {
    return ""
  }

  return format(date, template, {
    locale: es,
  });
}

export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number)
  return new Date(year, month - 1, day)
}

export function parseLocalDateTime(dateTimeStr: string, endOfRange = false): Date | undefined {
  if (/T.*(?:Z|[+-]\d{2}:\d{2})$/.test(dateTimeStr)) {
    const parsed = new Date(dateTimeStr)
    if (Number.isNaN(parsed.getTime())) return undefined
    if (endOfRange) parsed.setSeconds(59, 999)
    return parsed
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/.exec(dateTimeStr)
  if (!match) return undefined

  const [, yearPart, monthPart, dayPart, hourPart, minutePart] = match
  const year = Number(yearPart)
  const month = Number(monthPart)
  const day = Number(dayPart)
  const hours = hourPart === undefined ? 0 : Number(hourPart)
  const minutes = minutePart === undefined ? 0 : Number(minutePart)
  const parsed = new Date(year, month - 1, day, hours, minutes)

  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day ||
    parsed.getHours() !== hours ||
    parsed.getMinutes() !== minutes
  ) return undefined

  if (endOfRange) {
    if (hourPart === undefined) parsed.setHours(23, 59, 59, 999)
    else parsed.setSeconds(59, 999)
  }

  return parsed
}
