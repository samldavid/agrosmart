import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

import { env } from "./env";

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat(env.locale, {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
  }).format(value);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "Sin fecha";
  }

  try {
    return format(parseISO(value), "dd/MM/yyyy", { locale: es });
  } catch {
    return value;
  }
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return "Sin fecha";
  }

  try {
    return format(parseISO(value), "dd/MM/yyyy h:mm a", { locale: es });
  } catch {
    return value;
  }
}

export function currentMonthRange(now = new Date()): { start: string; end: string } {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return {
    start: start.toISOString(),
    end: end.toISOString()
  };
}

export function normalizeSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}
