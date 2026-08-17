import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";
import { vi } from "date-fns/locale/vi";

/** "2 phút trước", "1 giờ trước", ... */
export function timeAgo(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return formatDistanceToNow(d, { addSuffix: true, locale: vi });
  } catch {
    return "";
  }
}

/** "13:45" */
export function formatMessageTime(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return format(d, "p", { locale: vi });
  } catch {
    return "";
  }
}

/** "Hôm nay" | "Hôm qua" | "dd/MM/yyyy" */
export function formatMessageDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    if (isToday(d)) return "Hôm nay";
    if (isYesterday(d)) return "Hôm qua";
    return format(d, "dd/MM/yyyy", { locale: vi });
  } catch {
    return "";
  }
}
