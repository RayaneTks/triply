import { apiFetch, type ApiSuccessEnvelope } from "../http";

export interface AmadeusLocation {
  id: string;
  name: string;
  iataCode: string;
  subType: "CITY" | "AIRPORT" | string;
  address: { cityName: string; countryName: string };
  geoCode?: { latitude: number; longitude: number };
}

/**
 * Recherche villes / aéroports Amadeus (route publique, throttle:places).
 * Backend : AmadeusPlacesSearchController → AmadeusClient::locationsByKeyword.
 */
function unwrapPlacesBody(body: unknown): AmadeusLocation[] {
  if (Array.isArray(body)) return body as AmadeusLocation[];
  if (
    body &&
    typeof body === "object" &&
    "success" in body &&
    (body as ApiSuccessEnvelope<AmadeusLocation[]>).success === true &&
    Array.isArray((body as ApiSuccessEnvelope<AmadeusLocation[]>).data)
  ) {
    return (body as ApiSuccessEnvelope<AmadeusLocation[]>).data;
  }
  return [];
}

export async function searchPlaces(keyword: string, signal?: AbortSignal): Promise<AmadeusLocation[]> {
  const body = await apiFetch<unknown>("/integrations/amadeus/places", {
    method: "GET",
    query: { keyword },
    authenticated: false,
    signal,
  });
  return unwrapPlacesBody(body);
}

export interface FlightSearchBody {
  originLocationCode?: string;
  destinationLocationCode?: string;
  departureDate?: string;
  returnDate?: string;
  adults?: number;
  travelClass?: string;
  nonStop?: boolean;
  max?: number;
  [k: string]: unknown;
}

/**
 * Recherche d'offres de vols (auth requis).
 */
export function searchFlights(body: FlightSearchBody, signal?: AbortSignal): Promise<unknown> {
  return apiFetch("/integrations/amadeus/flights/search", {
    method: "POST",
    body,
    signal,
  });
}

export interface HotelLocation {
  id: string;
  title: string;
  coordinates: { latitude: number; longitude: number };
  type: "hotel" | string;
  address?: string;
}

/**
 * Hôtels par geocode (auth requis). Renvoie { locations: [...] }.
 */
export function hotelsByGeocode(
  lat: number | string,
  lng: number | string,
  ratings?: string,
  signal?: AbortSignal,
): Promise<{ locations: HotelLocation[] }> {
  return apiFetch<{ locations: HotelLocation[] }>("/integrations/amadeus/hotels/by-geocode", {
    method: "GET",
    query: { lat: String(lat), lng: String(lng), ratings },
    signal,
  });
}

export interface HotelSearchBody {
  cityCode: string;
  checkInDate: string;
  checkOutDate: string;
  adults?: number;
  roomQuantity?: number;
  maxPrice?: number;
  preferences?: string[];
  boardType?: "ROOM_ONLY" | "BREAKFAST" | "HALF_BOARD" | "FULL_BOARD" | "ALL_INCLUSIVE";
  [k: string]: unknown;
}

/**
 * Recherche d'offres hôtels (auth requis).
 */
export function searchHotels(body: HotelSearchBody, signal?: AbortSignal): Promise<unknown> {
  return apiFetch("/integrations/amadeus/hotels/search", {
    method: "POST",
    body,
    signal,
  });
}
