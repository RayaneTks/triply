import type { TripApi } from "./trips-client";
import type { StoredTrip } from "./local-trips-store";
import { formatTripDateRange } from "./format-trip-dates";

/** Liste « Mes voyages » : aligne un voyage API sur le format StoredTrip (affichage). */
export function tripApiToStoredTripForList(t: TripApi): StoredTrip {
  return {
    id: String(t.id),
    destination: (typeof t.destination === "string" && t.destination.trim()) || t.title || "Sans titre",
    startDate: typeof t.start_date === "string" ? t.start_date : undefined,
    endDate: typeof t.end_date === "string" ? t.end_date : undefined,
    budget: typeof t.budget_total === "number" ? t.budget_total : 0,
    travelers: typeof t.travelers_count === "number" ? t.travelers_count : 1,
    styles: [],
    needs: { flights: false, hotels: false, activities: false, restaurants: false },
    status: "planned",
    createdAt: new Date().toISOString(),
  };
}

export type TripDetailDay = { id: number; title: string; status: "Cadré" | "À creuser" };

export type TripDetailDisplay = {
  destination: string;
  fullLabel: string;
  dates: string;
  travelers: number;
  budget: number;
  remainingBudget: number;
  days: TripDetailDay[];
  statusLabel: string;
};

function placeholderDays(dest: string): TripDetailDay[] {
  return [
    { id: 1, title: `Arrivée & prise en main — ${dest}`, status: "Cadré" },
    { id: 2, title: "Exploration & temps fort", status: "Cadré" },
    { id: 3, title: "Dernière matinée avant départ", status: "À creuser" },
  ];
}

export function tripDetailFromStored(stored: StoredTrip): TripDetailDisplay {
  const dest = stored.destination.split(",")[0]?.trim() || stored.destination;
  return {
    destination: dest,
    fullLabel: stored.destination,
    dates: formatTripDateRange(stored.startDate, stored.endDate),
    travelers: stored.travelers,
    budget: stored.budget,
    remainingBudget: Math.max(0, Math.round(stored.budget * 0.12)),
    days: placeholderDays(dest),
    statusLabel: stored.status === "planned" ? "Enregistré" : "Brouillon",
  };
}

export function tripDetailFromApi(t: TripApi): TripDetailDisplay {
  const rawDest = (typeof t.destination === "string" && t.destination.trim()) || t.title || "—";
  const dest = rawDest.split(",")[0]?.trim() || rawDest;
  const budget = typeof t.budget_total === "number" ? t.budget_total : 0;
  const travelers = typeof t.travelers_count === "number" ? t.travelers_count : 1;
  const status =
    typeof t.status === "string" && t.status.trim() !== "" ? t.status : "En cours";

  return {
    destination: dest,
    fullLabel: rawDest,
    dates: formatTripDateRange(
      typeof t.start_date === "string" ? t.start_date : undefined,
      typeof t.end_date === "string" ? t.end_date : undefined,
    ),
    travelers,
    budget,
    remainingBudget: Math.max(0, Math.round(budget * 0.12)),
    days: placeholderDays(dest),
    statusLabel: status,
  };
}
