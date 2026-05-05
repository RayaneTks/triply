import type { PlanningNeeds } from "../types/planning-needs";

const STORAGE_KEY = "triply_saved_trips_v1";

export interface StoredTrip {
  id: string;
  destination: string;
  startDate?: string;
  endDate?: string;
  datesFlexible?: boolean;
  budget: number;
  travelers: number;
  styles: string[];
  needs: PlanningNeeds;
  status: "planned" | "draft";
  createdAt: string;
}

function readAll(): StoredTrip[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as StoredTrip[]) : [];
  } catch {
    return [];
  }
}

function writeAll(trips: StoredTrip[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
}

export function listStoredTrips(): StoredTrip[] {
  return readAll().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getStoredTrip(id: string): StoredTrip | undefined {
  return readAll().find((t) => t.id === id);
}

export function upsertStoredTrip(trip: StoredTrip) {
  const all = readAll();
  const idx = all.findIndex((t) => t.id === trip.id);
  if (idx >= 0) all[idx] = trip;
  else all.unshift(trip);
  writeAll(all);
}

export function appendTripFromWizard(input: Omit<StoredTrip, "id" | "createdAt" | "status"> & { status?: StoredTrip["status"] }): string {
  const id = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `trip-${Date.now()}`;
  const trip: StoredTrip = {
    ...input,
    id,
    status: input.status ?? "planned",
    createdAt: new Date().toISOString(),
  };
  upsertStoredTrip(trip);
  return id;
}
