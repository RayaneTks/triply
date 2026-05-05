import { apiFetch } from "../http";

export interface GoogleReview {
  author_name?: string;
  rating?: number;
  text?: string;
  relative_time_description?: string;
}

export interface PlaceReviewsResult {
  name: string;
  rating: number | null;
  reviews: GoogleReview[];
  url?: string | null;
  error?: string;
}

/**
 * Avis Google Places (backend : name + lat + lng obligatoires).
 */
export function placeReviews(
  params: { name: string; lat: string | number; lng: string | number },
  signal?: AbortSignal,
): Promise<PlaceReviewsResult> {
  return apiFetch<PlaceReviewsResult>("/integrations/google/place-reviews", {
    method: "GET",
    query: { name: params.name, lat: String(params.lat), lng: String(params.lng) },
    authenticated: false,
    signal,
  });
}
