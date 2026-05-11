import { apiClient } from "./api-client";
import type { ApiSuccessEnvelope } from "./http";

/** Objet voyage renvoyé par TripService::serializeTrip (champ `data` de l’enveloppe). */
export interface TripApi {
  id: string;
  title?: string;
  destination: string;
  status?: string;
  start_date?: string | null;
  end_date?: string | null;
  travel_days?: number;
  travelers_count?: number;
  budget_total?: number | null;
  currency?: string;
  [k: string]: unknown;
}

interface TripListData {
  items: TripApi[];
}

/**
 * CRUD voyages Laravel (TripController). Champs API : title, destination, start_date, end_date, travelers_count, plan_snapshot.
 */
export const tripsClient = {
  list: async (): Promise<TripApi[]> => {
    const res = await apiClient.get<ApiSuccessEnvelope<TripListData>>("/trips");
    return res?.data?.items ?? [];
  },
  get: async (id: string): Promise<TripApi | null> => {
    try {
      const res = await apiClient.get<ApiSuccessEnvelope<TripApi>>(`/trips/${id}`);
      return res?.data ?? null;
    } catch {
      return null;
    }
  },
  create: async (data: {
    title: string;
    destination: string;
    start_date?: string;
    end_date?: string;
    travelers_count?: number;
    plan_snapshot?: Record<string, unknown>;
  }): Promise<TripApi | null> => {
    const res = await apiClient.post<ApiSuccessEnvelope<TripApi>>("/trips", data);
    return res?.data ?? null;
  },
  update: async (
    id: string,
    data: Partial<{
      title: string;
      destination: string;
      start_date: string;
      end_date: string;
      travelers_count: number;
      plan_snapshot: Record<string, unknown>;
    }>,
  ): Promise<TripApi | null> => {
    const res = await apiClient.patch<ApiSuccessEnvelope<TripApi>>(`/trips/${id}`, data);
    return res?.data ?? null;
  },
};
