import { format } from "date-fns";
import { vi } from "date-fns/locale";

/** Format a date (Date object or ISO string) as dd/MM/yyyy; returns "-" for empty/invalid values. */
export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "-";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "-";
  return format(date, "dd/MM/yyyy", { locale: vi });
}

/** Format a number as VND currency; returns "-" for empty/invalid values. */
export function formatPrice(
  price: number | null | undefined,
): string {
  if (price === undefined || price === null || Number.isNaN(price)) return "-";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
}

/**
 * Display a course price as formatted VND, or "Miễn phí" when free (0).
 * Returns "-" for empty/invalid values.
 */
export function coursePrice(price: number | undefined | null): string {
  if (price === undefined || price === null || Number.isNaN(price)) return "-";
  return price > 0 ? formatPrice(price) : "Miễn phí";
}

/** Split a multiline string into trimmed, non-empty lines (for bullet rendering). */
export function splitLines(value?: string | null): string[] {
  if (!value) return [];
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}
