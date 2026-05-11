import { apiFetch, type ApiSuccessEnvelope } from "../http";

export type AssistantRole = "user" | "assistant" | "system";

export interface AssistantMessage {
  role: AssistantRole;
  content: string;
}

export interface AssistantLocation {
  id: string;
  title: string;
  coordinates: { latitude: number; longitude: number };
  zoom?: number;
  type?: string;
}

export interface SuggestedActivity {
  title: string;
  lat: number;
  lng: number;
  durationHours?: number;
  day?: number;
}

export interface ActivityReplacement {
  title: string;
  lat: number;
  lng: number;
  durationHours?: number;
}

export interface Step1FormPatch {
  departureCity?: string;
  arrivalCity?: string;
  arrivalCityName?: string;
  travelerCount?: number;
  budget?: string;
  activityTime?: string;
  outboundDate?: string;
  returnDate?: string;
  outboundDepartureTime?: string;
  outboundArrivalTime?: string;
  returnDepartureTime?: string;
  returnArrivalTime?: string;
  travelDays?: number;
  selectedOptions?: string[];
  dietarySelections?: string[];
}

/** Aligné sur ChatAssistantService::handle (backend Laravel). */
export interface AssistantChatRequest {
  messages: AssistantMessage[];
  destinationContext?: string;
  userPreferences?: string[];
  chatMode?: "qa" | "itinerary";
  intent?: "regenerate_activity" | string;
  selectedDay?: number;
  travelDays?: number;
  maxActivityHoursPerDay?: number;
  planningMode?: "manual" | "semi_ai" | "ai" | string;
  currentDayActivityTitles?: string[];
  requestFullItinerary?: boolean;
  step1FormSnapshot?: Record<string, unknown>;
  step1HotelOptionLabels?: string[];
  step1DietaryLabels?: string[];
  regenerateActivity?: {
    title: string;
    lat: number;
    lng: number;
    dayIndex?: number;
    destinationContext?: string;
  };
}

/** Contexte planificateur passé depuis le Wizard vers l’assistant. */
export type AssistantPlannerContext = Pick<
  AssistantChatRequest,
  | "destinationContext"
  | "userPreferences"
  | "chatMode"
  | "selectedDay"
  | "travelDays"
  | "maxActivityHoursPerDay"
  | "planningMode"
  | "currentDayActivityTitles"
  | "requestFullItinerary"
  | "step1FormSnapshot"
  | "step1HotelOptionLabels"
  | "step1DietaryLabels"
>;

export interface AssistantChatResponse {
  reply: string;
  locations: AssistantLocation[];
  suggestedActivities: SuggestedActivity[];
  step1FormPatch: Step1FormPatch | null;
  replacement: ActivityReplacement | null;
  error?: string;
}

function unwrapAssistantBody(body: unknown): AssistantChatResponse {
  if (
    body &&
    typeof body === "object" &&
    "success" in body &&
    (body as ApiSuccessEnvelope<AssistantChatResponse>).success === true &&
    (body as ApiSuccessEnvelope<AssistantChatResponse>).data !== undefined &&
    typeof (body as ApiSuccessEnvelope<AssistantChatResponse>).data === "object"
  ) {
    return (body as ApiSuccessEnvelope<AssistantChatResponse>).data;
  }
  return body as AssistantChatResponse;
}

export async function sendChat(body: AssistantChatRequest, signal?: AbortSignal): Promise<AssistantChatResponse> {
  const raw = await apiFetch<unknown>("/integrations/assistant", {
    method: "POST",
    body,
    signal,
  });
  return unwrapAssistantBody(raw);
}
