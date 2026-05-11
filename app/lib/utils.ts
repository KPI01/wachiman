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
