import { format, parseISO, isValid } from "date-fns";
import { fr } from "date-fns/locale";

/** Affiche une plage lisible (FR) à partir de chaînes ISO yyyy-MM-dd. */
export function formatTripDateRange(start?: string, end?: string): string {
  if (!start && !end) return "Dates à préciser";
  const s = start ? parseISO(start) : null;
  const e = end ? parseISO(end) : null;
  if (s && isValid(s) && e && isValid(e)) {
    const sameMonth =
      s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();
    if (sameMonth) {
      return `${format(s, "d", { locale: fr })} – ${format(e, "d MMM yyyy", { locale: fr })}`;
    }
    return `${format(s, "d MMM", { locale: fr })} – ${format(e, "d MMM yyyy", { locale: fr })}`;
  }
  if (s && isValid(s)) return format(s, "d MMM yyyy", { locale: fr });
  if (e && isValid(e)) return format(e, "d MMM yyyy", { locale: fr });
  return "Dates à préciser";
}
