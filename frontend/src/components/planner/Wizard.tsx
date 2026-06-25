'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronRight,
  ChevronLeft,
  Users,
  Compass,
  Plane,
  Hotel,
  Check,
  Map,
  MapPin,
  Bot,
  Clock,
  Star,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { AssistantBubble } from "./AssistantBubble";
import { CityAutocomplete } from "../CityAutocomplete/CityAutocomplete";
import { DateRangePicker } from "../DataRangePicker/DataRangePicker";
import { TravelerCounter } from "../TravelerCounter/TravelerCounter";
import type { PlanningNeeds } from "../../types/planning-needs";
import { formatTripDateRange } from "../../lib/format-trip-dates";
import type { AssistantPlannerContext, Step1FormPatch, SuggestedActivity } from "../../lib/integrations/assistant";
import { sendChat } from "../../lib/integrations/assistant";
import { authClient, fetchPreferences } from "../../lib/auth-client";
import { tripsClient } from "../../lib/trips-client";
import type { PlanSnapshot, PlanSnapshotActivity, PlanSnapshotDay } from "../../lib/plan-snapshot";
import { OriginPicker, type OriginValue } from "./OriginPicker";
import { AiProgressOverlay, type AiStage } from "./AiProgressOverlay";

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Sessionstorage key used to round-trip the wizard state across a forced login. */
const WIZARD_PENDING_KEY = "triply_wizard_pending_v1";

/** Libellés lisibles des styles de voyage (ids alignés sur l'étape « styles »). */
const STYLE_LABELS: Record<string, string> = {
  relax: "Détente & Slow",
  active: "Actif & Découverte",
  luxury: "Premium & Confort",
  adventure: "Aventure & Nature",
};

interface WizardPendingState {
  destination: string;
  destinationSelected: boolean;
  travelers: number;
  budget: number;
  selectedStyles: string[];
  needs: PlanningNeeds;
  startDate: string;
  endDate: string;
  datesFlexible: boolean;
  originInput: string;
  origin: OriginValue | null;
  step: WizardStep;
}

function readPendingWizard(): WizardPendingState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(WIZARD_PENDING_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as WizardPendingState;
  } catch {
    return null;
  }
}

function writePendingWizard(state: WizardPendingState): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(WIZARD_PENDING_KEY, JSON.stringify(state));
  } catch {
    /* quota or disabled storage — ignore */
  }
}

function clearPendingWizard(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(WIZARD_PENDING_KEY);
  } catch {
    /* ignore */
  }
}

function travelDaysBetween(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 1;
  const a = new Date(startDate);
  const b = new Date(endDate);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 1;
  const diff = Math.round((b.getTime() - a.getTime()) / 86400000) + 1;
  return Math.max(1, diff);
}

function stylesToPreferences(ids: string[]): string[] {
  const map: Record<string, string> = {
    relax: "detente",
    active: "aventure",
    luxury: "luxe",
    adventure: "aventure",
  };
  return ids.map((id) => map[id] ?? id);
}

function needsToPreferences(needs: PlanningNeeds): string[] {
  const labels: string[] = [];
  if (needs.flights) labels.push("vols inclus");
  if (needs.hotels) labels.push("hôtels inclus");
  if (needs.activities) labels.push("activités culturelles");
  if (needs.restaurants) labels.push("gastronomie locale");
  return labels;
}

function groupSuggestedActivitiesByDay(
  activities: SuggestedActivity[],
  travelDays: number,
): PlanSnapshotDay[] {
  const buckets: Record<number, PlanSnapshotActivity[]> = {};
  for (const a of activities) {
    if (!a.title || !Number.isFinite(a.lat) || !Number.isFinite(a.lng)) continue;
    const dayIndex = typeof a.day === "number" && a.day >= 1 && a.day <= travelDays ? a.day : 1;
    if (!buckets[dayIndex]) buckets[dayIndex] = [];
    buckets[dayIndex].push({
      title: a.title,
      lat: a.lat,
      lng: a.lng,
      durationHours: typeof a.durationHours === "number" ? a.durationHours : undefined,
    });
  }
  const days: PlanSnapshotDay[] = [];
  for (let i = 1; i <= travelDays; i++) {
    days.push({ dayIndex: i, activities: buckets[i] ?? [] });
  }
  return days;
}

type WizardStep = 'destination' | 'dates' | 'origin' | 'travelers' | 'budget' | 'styles' | 'needs' | 'review';

type TravelClass = 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';
type HotelStars = 1 | 2 | 3 | 4 | 5;

interface WizardFormState {
  destination: string;
  destinationSelected: boolean;
  travelers: number;
  budget: number;
  selectedStyles: string[];
  needs: PlanningNeeds;
  startDate: string;
  endDate: string;
  datesFlexible: boolean;
  originInput: string;
  origin: OriginValue | null;
  flightNonStop: boolean;
  flightTravelClass: TravelClass;
  hotelMinStars: HotelStars;
}

interface WizardFormActions {
  setDestination: (v: string) => void;
  setDestinationSelected: (v: boolean) => void;
  setTravelers: (v: number) => void;
  setBudget: (v: number) => void;
  setDateRange: (next: { startDate: string; endDate: string }) => void;
  setDatesFlexible: (v: boolean) => void;
  toggleStyle: (style: string) => void;
  toggleNeed: (need: keyof PlanningNeeds) => void;
  setOriginInput: (v: string) => void;
  setOrigin: (v: OriginValue | null) => void;
  setFlightNonStop: (v: boolean) => void;
  setFlightTravelClass: (v: TravelClass) => void;
  setHotelMinStars: (v: HotelStars) => void;
}

export function Wizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authPromptOpen, setAuthPromptOpen] = useState(false);
  const [step, setStep] = useState<WizardStep>('destination');
  const [destination, setDestination] = useState("");
  const [destinationSelected, setDestinationSelected] = useState(false);
  const [travelers, setTravelers] = useState(2);
  const [budget, setBudget] = useState(2500);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [needs, setNeeds] = useState<PlanningNeeds>({
    flights: true,
    hotels: true,
    activities: false,
    restaurants: false,
  });
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [datesFlexible, setDatesFlexible] = useState(false);
  const [originInput, setOriginInput] = useState("");
  const [origin, setOrigin] = useState<OriginValue | null>(null);
  const [flightNonStop, setFlightNonStop] = useState(false);
  const [flightTravelClass, setFlightTravelClass] = useState<TravelClass>('ECONOMY');
  const [hotelMinStars, setHotelMinStars] = useState<HotelStars>(3);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [visitedCities, setVisitedCities] = useState<string[]>([]);
  const [aiStage, setAiStage] = useState<AiStage>("idle");

  useEffect(() => {
    const token = authClient.getToken();
    if (!token) return;
    let cancelled = false;
    void fetchPreferences(token)
      .then((prefs) => {
        if (!cancelled && Array.isArray(prefs.visited_cities)) {
          setVisitedCities(prefs.visited_cities);
        }
      })
      .catch(() => {
        // L'absence de préférences ne doit pas bloquer le wizard.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Resume after a forced login: rehydrate the form and auto-trigger finalize
  // when the user comes back with ?autoFinalize=1 and a valid session. The
  // runFinalize function is declared further down — we route through a ref to
  // avoid the "used before declaration" TS error without restructuring.
  const autoFinalizedRef = useRef(false);
  const seedAppliedRef = useRef(false);
  const runFinalizeRef = useRef<() => Promise<void>>(async () => {});
  useEffect(() => {
    if (autoFinalizedRef.current) return;
    const autoFinalize = searchParams.get('autoFinalize') === '1';
    if (!autoFinalize) return;
    const token = authClient.getToken();
    if (!token) return;
    const pending = readPendingWizard();
    if (!pending) return;
    autoFinalizedRef.current = true;
    setDestination(pending.destination);
    setDestinationSelected(pending.destinationSelected);
    setTravelers(pending.travelers);
    setBudget(pending.budget);
    setSelectedStyles(pending.selectedStyles);
    setNeeds(pending.needs);
    setStartDate(pending.startDate);
    setEndDate(pending.endDate);
    setDatesFlexible(pending.datesFlexible);
    setOriginInput(pending.originInput);
    setOrigin(pending.origin);
    setStep('review');
    // Defer to next tick so all state updates are flushed before finalize runs.
    setTimeout(() => { void runFinalizeRef.current(); }, 0);
  }, [searchParams]);

  // Pre-fill the wizard from the "Mode libre" synthesis page. Read once on
  // mount, never overwrite user input on subsequent renders. Skipped when the
  // user is already mid-resume (autoFinalize) to avoid clobbering pending state.
  useEffect(() => {
    if (seedAppliedRef.current) return;
    if (autoFinalizedRef.current) return;
    if (typeof window === 'undefined') return;
    let raw: string | null = null;
    try {
      raw = window.sessionStorage.getItem('triply_wizard_seed_v1');
    } catch {
      raw = null;
    }
    if (!raw) return;
    seedAppliedRef.current = true;
    try { window.sessionStorage.removeItem('triply_wizard_seed_v1'); } catch { /* ignore */ }
    let seed: {
      destination?: string;
      travelDays?: number;
      monthIndex?: number;
      budget?: number;
      travelers?: number;
      tags?: string[];
    };
    try {
      seed = JSON.parse(raw);
    } catch {
      return;
    }
    if (seed.destination) {
      setDestination(seed.destination);
      setDestinationSelected(true);
    }
    if (typeof seed.travelers === 'number' && seed.travelers >= 1) {
      setTravelers(seed.travelers);
    }
    if (typeof seed.budget === 'number' && seed.budget >= 500) {
      setBudget(seed.budget);
    }
    if (typeof seed.travelDays === 'number' && seed.travelDays >= 1 && typeof seed.monthIndex === 'number') {
      // Pick the first day of the detected month (next occurrence) and stretch
      // for the requested travel days. Keeps the wizard's date validation happy.
      const now = new Date();
      const targetYear = seed.monthIndex < now.getMonth() ? now.getFullYear() + 1 : now.getFullYear();
      const start = new Date(targetYear, seed.monthIndex, 1);
      const end = new Date(targetYear, seed.monthIndex, Math.min(28, seed.travelDays));
      setStartDate(start.toISOString().slice(0, 10));
      setEndDate(end.toISOString().slice(0, 10));
    }
    // Tags → wizard "selectedStyles" + "needs" toggles.
    if (Array.isArray(seed.tags)) {
      const styles: string[] = [];
      if (seed.tags.includes('beach') || seed.tags.includes('wellness')) styles.push('relax');
      if (seed.tags.includes('hiking') || seed.tags.includes('desert') || seed.tags.includes('culture')) styles.push('adventure');
      if (seed.tags.includes('luxury') || seed.tags.includes('all-inclusive')) styles.push('luxury');
      if (seed.tags.includes('activities')) styles.push('active');
      if (styles.length > 0) setSelectedStyles(Array.from(new Set(styles)));

      setNeeds((prev) => ({
        flights: prev.flights,
        hotels: prev.hotels,
        activities: prev.activities || seed.tags!.includes('activities') || seed.tags!.includes('culture'),
        restaurants: prev.restaurants || seed.tags!.includes('food'),
      }));
    }
  }, []);

  const stepsOrder: WizardStep[] = ['destination', 'dates', 'origin', 'travelers', 'budget', 'styles', 'needs', 'review'];
  const currentIndex = stepsOrder.indexOf(step);

  const buildPlanSnapshot = (days: PlanSnapshotDay[] = []): PlanSnapshot => ({
    days,
    trip_budget_eur: budget,
    planningMode: needs.activities ? 'semi_ai' : 'full_ai',
    destinationSummary: destination.trim()
      ? { cityName: destination.trim() }
      : undefined,
    origin: origin
      ? {
          cityName: origin.cityName,
          iataCode: origin.iataCode,
          airportName: origin.airportName,
          countryName: origin.countryName,
          lat: origin.lat,
          lng: origin.lng,
        }
      : undefined,
    // Persistance des besoins déclarés au wizard pour que la fiche voyage sache
    // si vols/hôtels/activités/restos étaient demandés et puisse signaler à
    // l'utilisateur les sélections manquantes après création.
    plannerNeeds: { ...needs },
    plannerPreferences: {
      flightNonStop,
      flightTravelClass,
      hotelMinStars,
    },
  });

  const generateAiItinerary = async (): Promise<PlanSnapshotDay[]> => {
    const aiPreferences = [...userPreferences, ...needsToPreferences(needs)];
    const restaurantHint = needs.restaurants
      ? " Inclus au moins une expérience gastronomique par jour (restaurant ou lieu de restauration nommé). "
        + "Attribue une durationHours réaliste et différente à chaque activité selon son type "
        + "(monument ~1h, musée ~2-3h, safari/réserve ~4-6h, restaurant ~1-1.5h)."
      : " Attribue une durationHours réaliste et différente à chaque activité selon son type "
        + "(monument ~1h, musée ~2-3h, safari/réserve ~4-6h, restaurant ~1-1.5h).";
    const response = await sendChat({
      messages: [
        {
          role: "user",
          content: `Construis un itinéraire jour par jour à ${destination.trim()} sur ${travelDays} jour${travelDays > 1 ? 's' : ''} pour ${travelers} voyageur${travelers > 1 ? 's' : ''}, budget total ${budget}€. Trois activités par jour minimum.${restaurantHint}`,
        },
      ],
      destinationContext: destination.trim(),
      userPreferences: aiPreferences,
      chatMode: "itinerary",
      selectedDay: 1,
      travelDays,
      maxActivityHoursPerDay: 8,
      planningMode: "semi_ai",
      currentDayActivityTitles: [],
      requestFullItinerary: true,
      step1FormSnapshot: {
        arrivalCityName: destination.trim() || undefined,
        departureCity: origin?.cityName,
        departureIataCode: origin?.iataCode,
        travelerCount: travelers,
        budget: String(budget),
        outboundDate: startDate || undefined,
        returnDate: endDate || undefined,
        travelDays,
      },
      step1HotelOptionLabels: [],
      step1DietaryLabels: [],
    });
    return groupSuggestedActivitiesByDay(response.suggestedActivities ?? [], travelDays);
  };

  const runFinalize = useCallback(async (): Promise<void> => {
    // Garde dure : impossible de finaliser un voyage sans destination réellement
    // sélectionnée dans l'autocomplete (un texte tapé sans choix n'est pas une
    // destination valide côté backend). Renvoie l'utilisateur à l'étape concernée
    // au lieu de créer un voyage "À préciser" fantôme.
    const cleanedDestination = destination.trim();
    if (!destinationSelected || cleanedDestination.length === 0) {
      setStep('destination');
      setSubmitError('Sélectionnez une destination dans la liste avant de finaliser le voyage.');
      return;
    }
    if (!startDate || !endDate) {
      setStep('dates');
      setSubmitError('Choisissez vos dates de départ et de retour avant de finaliser.');
      return;
    }
    if (!origin?.iataCode) {
      setStep('origin');
      setSubmitError('Sélectionnez votre ville de départ avant de finaliser.');
      return;
    }

    const titleBase = cleanedDestination;
    const formattedDates = formatTripDateRange(startDate || undefined, endDate || undefined);
    const title = formattedDates ? `${titleBase} · ${formattedDates}` : titleBase;

    setSubmitError(null);
    setSubmitting(true);

    let aiDays: PlanSnapshotDay[] = [];
    try {
      // Short paced stages keep the user informed during the (long) sendChat.
      setAiStage("analyzing");
      await wait(450);
      setAiStage("researching");
      await wait(450);
      setAiStage("generating");
      aiDays = await generateAiItinerary();
    } catch (err) {
      aiDays = [];
      const message = err instanceof Error ? err.message : 'La génération de l’itinéraire est momentanément indisponible.';
      setSubmitError(
        `${message} Votre voyage a bien été créé, mais sans itinéraire généré — vous pourrez le relancer depuis la page du voyage.`,
      );
    }

    setAiStage("saving");
    try {
      const trip = await tripsClient.create({
        title,
        destination: cleanedDestination,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        travelers_count: travelers,
        plan_snapshot: buildPlanSnapshot(aiDays),
      });
      clearPendingWizard();
      setAiStage("redirecting");
      router.push(`/voyages/${trip.id}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Sauvegarde impossible.');
      setAiStage("idle");
      setSubmitting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destination, destinationSelected, startDate, endDate, travelers, budget, needs, origin, router]);

  // Keep the ref in sync so the post-login auto-finalize effect (declared
  // before runFinalize) can invoke the latest closure.
  useEffect(() => {
    runFinalizeRef.current = runFinalize;
  }, [runFinalize]);

  const finalize = async () => {
    if (submitting) return;
    const token = authClient.getToken();
    if (!token) {
      // Persist the wizard state so we can resume the exact form after login.
      writePendingWizard({
        destination,
        destinationSelected,
        travelers,
        budget,
        selectedStyles,
        needs,
        startDate,
        endDate,
        datesFlexible,
        originInput,
        origin,
        step,
      });
      setAuthPromptOpen(true);
      return;
    }
    await runFinalize();
  };

  const stepValidation: Record<WizardStep, { ok: boolean; hint: string }> = {
    destination: {
      ok: destinationSelected && destination.trim().length > 0,
      hint: "Sélectionnez une destination dans la liste avant de continuer.",
    },
    dates: {
      ok: Boolean(startDate) && Boolean(endDate) && endDate >= startDate,
      hint: "Choisissez une date de départ puis une date de retour (retour ≥ départ).",
    },
    origin: {
      ok: Boolean(origin?.iataCode),
      hint: "Sélectionnez votre ville de départ pour trouver l’aéroport le plus proche.",
    },
    travelers: {
      ok: travelers >= 1,
      hint: "Indiquez au moins un voyageur.",
    },
    budget: {
      ok: budget >= 500,
      hint: "Le budget minimum est de 500€.",
    },
    styles: {
      ok: selectedStyles.length >= 1,
      hint: "Sélectionnez au moins un style de voyage.",
    },
    needs: {
      ok: Object.values(needs).some(Boolean),
      hint: "Choisissez au moins un besoin (vols, hôtels, activités ou restaurants).",
    },
    review: { ok: true, hint: "" },
  };

  const currentValidation = stepValidation[step];
  const canAdvance = currentValidation.ok && !submitting;

  const firstMissingStep = (): WizardStep | null => {
    for (const s of stepsOrder) {
      if (s === 'review') continue;
      if (!stepValidation[s].ok) return s;
    }
    return null;
  };

  const next = () => {
    if (!canAdvance) return;
    if (currentIndex === stepsOrder.length - 1) {
      const missing = firstMissingStep();
      if (missing && missing !== step) {
        setStep(missing);
      } else if (step !== 'review') {
        setStep('review');
      } else {
        void finalize();
      }
    } else {
      setStep(stepsOrder[currentIndex + 1]);
    }
  };
  const prev = () => setStep(stepsOrder[currentIndex - 1]);

  const toggleStyle = (style: string) => {
    setSelectedStyles(prev => 
      prev.includes(style) ? prev.filter(s => s !== style) : [...prev, style]
    );
  };

  const setDateRange = (next: { startDate: string; endDate: string }) => {
    setStartDate(next.startDate);
    setEndDate(next.endDate);
  };

  const toggleNeed = (need: keyof PlanningNeeds) => {
    setNeeds((prev) => ({ ...prev, [need]: !prev[need] }));
  };

  const travelDays = travelDaysBetween(startDate, endDate);
  const userPreferences = stylesToPreferences(selectedStyles);

  const plannerContext: AssistantPlannerContext = useMemo(
    () => ({
      destinationContext: destination.trim(),
      selectedDay: 1,
      travelDays,
      maxActivityHoursPerDay: 8,
      planningMode: "semi_ai",
      currentDayActivityTitles: [],
      step1FormSnapshot: {
        arrivalCityName: destination.trim() || undefined,
        travelerCount: travelers,
        budget: String(budget),
        outboundDate: startDate || undefined,
        returnDate: endDate || undefined,
        travelDays,
      },
      step1HotelOptionLabels: [],
      step1DietaryLabels: [],
      userPreferences,
      chatMode: "itinerary",
      /** Dès que le séjour > 1 jour, le backend renforce le programme sur toutes les journées (prompt). */
      requestFullItinerary: travelDays > 1,
    }),
    [destination, travelers, budget, startDate, endDate, travelDays, userPreferences],
  );

  const applyStep1Patch = useCallback((patch: Step1FormPatch) => {
    if (patch.arrivalCityName) setDestination(patch.arrivalCityName);
    if (typeof patch.travelerCount === "number" && patch.travelerCount >= 1) setTravelers(patch.travelerCount);
    if (patch.budget) {
      const digits = parseInt(patch.budget.replace(/[^\d]/g, ""), 10);
      if (!Number.isNaN(digits) && digits > 0) setBudget(digits);
    }
    if (patch.outboundDate) setStartDate(patch.outboundDate);
    if (patch.returnDate) setEndDate(patch.returnDate);
    if (patch.departureCity) setOriginInput(patch.departureCity);
  }, []);

  const formState: WizardFormState = {
    destination,
    destinationSelected,
    travelers,
    budget,
    selectedStyles,
    needs,
    startDate,
    endDate,
    datesFlexible,
    originInput,
    origin,
    flightNonStop,
    flightTravelClass,
    hotelMinStars,
  };

  const formActions: WizardFormActions = {
    setDestination,
    setDestinationSelected,
    setTravelers,
    setBudget,
    setDateRange,
    setDatesFlexible,
    toggleStyle,
    toggleNeed,
    setOriginInput,
    setOrigin,
    setFlightNonStop,
    setFlightTravelClass,
    setHotelMinStars,
  };

  return (
    <div className="flex h-[calc(100dvh-80px)] bg-light-bg overflow-hidden relative">
      <AiProgressOverlay
        stage={aiStage}
        destination={destination}
        travelDays={travelDays}
        budget={budget}
      />
      <AnimatePresence>
        {authPromptOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="wizard-auth-title"
          >
            <motion.div
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 8, opacity: 0 }}
              // Theme-aware tokens so the modal reads correctly under both
              // light and dark themes via CSS variables.
              className="max-w-md w-full bg-card text-foreground rounded-3xl border border-light-border shadow-2xl p-8 text-center space-y-5"
            >
              <div className="flex justify-center">
                <div className="w-14 h-14 rounded-full bg-brand/10 flex items-center justify-center">
                  <Sparkles size={26} className="text-brand" />
                </div>
              </div>
              <h2 id="wizard-auth-title" className="text-2xl font-display font-bold text-foreground">
                Connectez-vous pour générer votre voyage
              </h2>
              <p className="text-sm text-light-muted font-medium leading-relaxed">
                Votre itinéraire personnalisé sera sauvegardé sur votre compte Triply.
                Vous le retrouverez à tout moment dans vos voyages.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setAuthPromptOpen(false);
                    router.push('/connexion?returnTo=/planifier/wizard%3FautoFinalize%3D1');
                  }}
                  className="flex-1 rounded-xl bg-brand text-white font-bold py-3 px-4 hover:opacity-90 transition-opacity"
                >
                  Se connecter
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthPromptOpen(false);
                    router.push('/inscription?returnTo=/planifier/wizard%3FautoFinalize%3D1');
                  }}
                  className="flex-1 rounded-xl border-2 border-brand text-brand font-bold py-3 px-4 hover:bg-brand/5 transition-colors"
                >
                  Créer un compte
                </button>
              </div>
              <button
                type="button"
                onClick={() => setAuthPromptOpen(false)}
                className="text-xs text-light-muted font-bold hover:text-foreground transition-colors"
              >
                Revenir au récap
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Container Principal Wizard */}
      <div className="flex-1 flex flex-col overflow-y-auto lg:p-8 scroll-smooth">
        <div className="max-w-2xl w-full mx-auto flex flex-col gap-8 pb-32 px-6 lg:px-0">
          
          {/* Header Mobile / Tablet */}
          <div className="lg:hidden py-4 flex items-center justify-between sticky top-0 bg-light-bg z-10 border-b border-light-border mb-4">
             <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-widest text-light-muted">Étape {currentIndex + 1} / {stepsOrder.length}</span>
             </div>
             <div className="w-8" />
          </div>

          {/* Stepper Desktop */}
          <div className="hidden lg:flex items-center gap-2 mb-10">
            {stepsOrder.map((s, i) => (
              <React.Fragment key={s}>
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  i <= currentIndex ? "bg-brand" : "bg-light-border"
                )} />
                {i < stepsOrder.length - 1 && <div className="flex-1 h-px bg-light-border" />}
              </React.Fragment>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-12"
            >
              <StepRenderer step={step} state={formState} actions={formActions} visitedCities={visitedCities} />
            </motion.div>
          </AnimatePresence>

        </div>

        {/* Sticky Actions Bar — pleine largeur, copilote flottant n'occupe plus la colonne droite. */}
        <div className="fixed bottom-[calc(64px+env(safe-area-inset-bottom))] lg:bottom-0 inset-x-0 bg-card lg:bg-card/80 lg:backdrop-blur-md border-t border-light-border p-6 lg:p-8 flex flex-col gap-2 z-40">
           {submitError && (
             <p className="text-xs font-medium text-error" role="alert">
               {submitError}
             </p>
           )}
           {!canAdvance && !submitError && currentValidation.hint && (
             <p className="text-xs font-medium text-amber-700" role="status">
               {currentValidation.hint}
             </p>
           )}
           {/* pr-24 : réserve la place du copilote flottant (AssistantBubble, w-14 @ right-6)
               pour que « Continuer » ne passe pas sous la bulle en bas à droite. */}
           <div className="flex items-center justify-between pr-24">
             <button
              onClick={prev}
              disabled={currentIndex === 0 || submitting}
              className="flex items-center gap-2 font-bold text-light-muted hover:text-light-foreground disabled:opacity-0 transition-all px-4"
             >
               <ChevronLeft size={20} />
               Précédent
             </button>

             <button
              onClick={next}
              disabled={!canAdvance}
              aria-disabled={!canAdvance}
              className="btn-primary flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
             >
               {submitting
                 ? 'Enregistrement…'
                 : currentIndex === stepsOrder.length - 1
                   ? "Valider l'itinéraire"
                   : currentIndex === stepsOrder.length - 2
                     ? 'Voir le récap'
                     : 'Continuer'}
               <ChevronRight size={18} />
             </button>
           </div>
        </div>
      </div>

      <AssistantBubble plannerContext={plannerContext} onApplyStep1Patch={applyStep1Patch} />
    </div>
  );
}

function StepRenderer({
  step,
  state,
  actions,
  visitedCities,
}: {
  step: WizardStep;
  state: WizardFormState;
  actions: WizardFormActions;
  visitedCities: string[];
}) {
  const normalizedVisited = useMemo(
    () => new Set(visitedCities.map((c) => c.trim().toLowerCase())),
    [visitedCities],
  );
  switch (step) {
    case 'destination':
      return (
        <div className="space-y-8">
          <h1 className="text-4xl font-display font-bold">Où avez-vous envie d'aller ?</h1>
          <div className="space-y-4">
             <label className="text-xs font-bold uppercase tracking-widest text-light-muted">Destination</label>
             <CityAutocomplete
               value={state.destination}
               selected={state.destinationSelected}
               onChange={(v) => {
                 actions.setDestination(v);
                 actions.setDestinationSelected(true);
               }}
               onInputChange={() => actions.setDestinationSelected(false)}
               onSelectName={(name) => {
                 actions.setDestination(name);
                 actions.setDestinationSelected(true);
               }}
             />
             {state.destinationSelected && (
               <div
                 role="status"
                 className="mt-2 inline-flex items-center gap-2 px-3 py-2 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold"
               >
                 <CheckCircle2 size={14} strokeWidth={2.5} className="text-emerald-600" />
                 <span>Sélection validée&nbsp;: {state.destination}</span>
               </div>
             )}
             <div className="flex flex-wrap gap-2 mt-4">
                {["Rome", "Lisbonne", "Tokyo", "Berlin", ...visitedCities].map(city => {
                  const alreadyVisited = normalizedVisited.has(city.toLowerCase());
                  return (
                    <button
                      key={city}
                      onClick={() => {
                        actions.setDestination(city);
                        actions.setDestinationSelected(true);
                      }}
                      className={cn(
                        "px-4 py-2 bg-card border rounded-full text-xs font-bold transition-all flex items-center gap-2",
                        state.destination === city ? "border-brand text-brand opacity-100" : "border-light-border text-light-muted opacity-70 hover:opacity-100"
                      )}
                    >
                      {city}
                      {alreadyVisited && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold uppercase text-emerald-900 bg-emerald-100 border border-emerald-300 rounded-full px-2 py-0.5">
                          Déjà visitée
                        </span>
                      )}
                    </button>
                  );
                })}
             </div>
             {visitedCities.length > 0 && (
               <p className="text-xs text-light-muted">
                 Astuce : Triply met en avant les villes que vous avez déjà visitées pour vous aider à choisir une
                 nouvelle destination ou y retourner.
               </p>
             )}
          </div>
        </div>
      );
    case 'dates':
      return (
        <div className="space-y-8">
          <h1 className="text-4xl font-display font-bold">À quelles dates ?</h1>
          <DateRangePicker
            startDate={state.startDate}
            endDate={state.endDate}
            onDatesChange={(startDate, endDate) => actions.setDateRange({ startDate, endDate })}
          />
          <label className="flex items-center gap-2 text-sm text-light-muted cursor-pointer">
            <input
              type="checkbox"
              checked={state.datesFlexible}
              onChange={(e) => actions.setDatesFlexible(e.target.checked)}
              className="accent-brand"
            />
            Dates flexibles
          </label>
        </div>
      );
    case 'origin':
      return (
        <div className="space-y-8">
          <h1 className="text-4xl font-display font-bold">D'où partez-vous ?</h1>
          <p className="text-light-muted font-bold leading-relaxed">
            Triply identifie automatiquement l'aéroport le plus pertinent pour pré-remplir la recherche de vols.
          </p>
          <OriginPicker
            value={state.origin}
            onChange={actions.setOrigin}
            inputValue={state.originInput}
            onInputChange={actions.setOriginInput}
          />
        </div>
      );
    case 'travelers':
      return (
        <div className="space-y-8 text-center flex flex-col items-center">
          <h1 className="text-4xl font-display font-bold">Combien de voyageurs ?</h1>
          <div className="py-12">
            <TravelerCounter count={state.travelers} onChange={actions.setTravelers} />
          </div>
          <p className="text-light-muted font-bold uppercase text-xs tracking-widest max-w-xs leading-relaxed">
            Configurez le groupe pour que le copilote ajuste le rythme et les types de logements recommandés.
          </p>
        </div>
      );
    case 'budget':
        return (
          <div className="space-y-8">
            <h1 className="text-4xl font-display font-bold">Quel est votre budget ?</h1>
            <div className="space-y-6">
              <input 
                type="range" 
                className="w-full accent-brand py-4" 
                min="500" 
                max="10000" 
                step="100" 
                value={state.budget}
                onChange={(e) => actions.setBudget(parseInt(e.target.value))}
              />
              <div className="flex justify-between items-end border-b border-light-border pb-4">
                 <span className="text-light-muted font-bold">Budget total</span>
                 <span className="text-4xl font-display font-bold text-brand">{state.budget.toLocaleString()}€</span>
              </div>
            </div>
            <div className="p-6 bg-brand/5 rounded-2xl border border-brand/10 flex gap-4">
               <Bot size={24} className="text-brand shrink-0" />
               <p className="text-xs text-brand leading-relaxed font-bold">
                 Selon nos données, ce budget permet {state.budget > 3000 ? "un voyage grand confort" : "un voyage équilibré"} en Europe.
               </p>
            </div>
          </div>
        );
    case 'styles':
      return (
        <div className="space-y-8">
          <h1 className="text-4xl font-display font-bold">Quel rythme de voyage ?</h1>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { id: 'relax', label: 'Détente & Slow', desc: 'Prendre le temps, un café en terrasse.', icon: Clock },
              { id: 'active', label: 'Actif & Découverte', desc: 'Beaucoup de visites et de marche.', icon: Compass },
              { id: 'luxury', label: 'Premium & Confort', desc: 'Hôtels étoilés et bonnes tables.', icon: Star },
              { id: 'adventure', label: 'Aventure & Nature', desc: 'Hors des sentiers battus.', icon: Map },
            ].map(style => (
              <button 
                key={style.id}
                onClick={() => actions.toggleStyle(style.id)}
                className={cn(
                  "p-6 text-left triply-card border-2 transition-all",
                  state.selectedStyles.includes(style.id) ? "border-brand bg-brand/5" : "border-transparent"
                )}
              >
                <style.icon className={cn("mb-4", state.selectedStyles.includes(style.id) ? "text-brand" : "text-light-muted")} size={24} />
                <h3 className="font-bold mb-1">{style.label}</h3>
                <p className="text-xs text-light-muted">{style.desc}</p>
              </button>
            ))}
          </div>
        </div>
      );
    case 'needs':
      return (
        <div className="space-y-8">
          <h1 className="text-4xl font-display font-bold">De quoi avez-vous besoin ?</h1>
          <p className="text-light-muted">Triply sélectionnera automatiquement le moins cher selon vos préférences.</p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { id: 'flights', label: 'Vols', icon: Plane },
              { id: 'hotels', label: 'Hôtels', icon: Hotel },
              { id: 'activities', label: 'Activités', icon: Check },
              { id: 'restaurants', label: 'Restaurants', icon: Users },
            ].map((need) => (
              <label
                key={need.id}
                className={cn(
                  "flex flex-col items-center gap-4 p-8 triply-card cursor-pointer transition-all border-2",
                  state.needs[need.id as keyof PlanningNeeds]
                    ? "border-brand bg-brand/5"
                    : "border-transparent"
                )}
              >
                <input
                  type="checkbox"
                  className="hidden"
                  checked={state.needs[need.id as keyof PlanningNeeds]}
                  onChange={() => actions.toggleNeed(need.id as keyof PlanningNeeds)}
                />
                <need.icon
                  size={32}
                  className={
                    state.needs[need.id as keyof PlanningNeeds] ? "text-brand" : "text-light-muted"
                  }
                />
                <span
                  className={cn(
                    "font-bold text-sm",
                    state.needs[need.id as keyof PlanningNeeds] ? "text-brand" : "text-light-muted"
                  )}
                >
                  {need.label}
                </span>
              </label>
            ))}
          </div>

          {/* Préférences vol — affichées uniquement si vols cochés */}
          {state.needs.flights && (
            <div className="triply-card space-y-5 border border-brand/20 p-6">
              <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-brand">
                <Plane size={14} /> Préférences vol
              </div>
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-light-muted">Classe</span>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    { id: 'ECONOMY' as const, label: 'Éco' },
                    { id: 'PREMIUM_ECONOMY' as const, label: 'Éco +' },
                    { id: 'BUSINESS' as const, label: 'Affaires' },
                    { id: 'FIRST' as const, label: 'Première' },
                  ].map((cls) => (
                    <button
                      key={cls.id}
                      type="button"
                      onClick={() => actions.setFlightTravelClass(cls.id)}
                      className={cn(
                        'rounded-xl border px-3 py-2.5 text-sm font-bold transition-colors',
                        state.flightTravelClass === cls.id
                          ? 'border-brand bg-brand text-white'
                          : 'border-light-border bg-card text-light-foreground hover:border-brand/40',
                      )}
                    >
                      {cls.label}
                    </button>
                  ))}
                </div>
              </div>
              <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-light-border bg-card px-4 py-3">
                <div>
                  <p className="text-sm font-bold text-light-foreground">Vol direct uniquement</p>
                  <p className="text-xs text-light-muted">Filtre les escales — peut être plus cher.</p>
                </div>
                <input
                  type="checkbox"
                  checked={state.flightNonStop}
                  onChange={(e) => actions.setFlightNonStop(e.target.checked)}
                  className="h-5 w-5 cursor-pointer accent-[color:var(--primary)]"
                />
              </label>
            </div>
          )}

          {/* Préférences hôtel — affichées uniquement si hôtels cochés */}
          {state.needs.hotels && (
            <div className="triply-card space-y-4 border border-brand/20 p-6">
              <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-brand">
                <Hotel size={14} /> Préférences hôtel
              </div>
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-light-muted">Étoiles minimum</span>
                <div className="flex flex-wrap gap-2">
                  {([1, 2, 3, 4, 5] as HotelStars[]).map((stars) => (
                    <button
                      key={stars}
                      type="button"
                      onClick={() => actions.setHotelMinStars(stars)}
                      className={cn(
                        'rounded-xl border px-4 py-2.5 text-sm font-bold transition-colors',
                        state.hotelMinStars === stars
                          ? 'border-brand bg-brand text-white'
                          : 'border-light-border bg-card text-light-foreground hover:border-brand/40',
                      )}
                    >
                      {stars}★
                    </button>
                  ))}
                </div>
                <p className="text-xs text-light-muted">{state.hotelMinStars}★ et plus — l’hôtel le moins cher rentrant dans le budget sera sélectionné.</p>
              </div>
            </div>
          )}
        </div>
      );
    case 'review':
      return (
        <div className="space-y-12">
          <header className="space-y-4">
            <h1 className="text-4xl font-display font-bold">Prêt pour le décollage ?</h1>
            <p className="text-light-muted font-bold text-lg leading-relaxed">Récapitulez votre projet avant de finaliser l&apos;itinéraire.</p>
          </header>

          <div className="triply-card p-8 lg:p-12 space-y-10">
             <div className="grid md:grid-cols-2 gap-x-12 gap-y-8">
                <div className="space-y-2">
                   <p className="text-xs font-bold text-light-muted uppercase tracking-widest">Départ</p>
                   <p className="text-2xl font-bold flex items-center gap-2">
                     {state.origin?.cityName || "Non précisé"}
                     {state.origin?.iataCode && (
                       <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-brand bg-brand/10 border border-brand/20 rounded-full px-2 py-0.5">
                         <Plane size={12} aria-hidden /> {state.origin.iataCode}
                       </span>
                     )}
                   </p>
                </div>
                <div className="space-y-2">
                   <p className="text-xs font-bold text-light-muted uppercase tracking-widest">Destination</p>
                   <p className="text-2xl font-bold flex items-center gap-2">
                     {state.destination || "Non précisé"}{" "}
                     <MapPin size={20} className="text-brand shrink-0" aria-hidden />
                   </p>
                </div>
                <div className="space-y-2">
                   <p className="text-xs font-bold text-light-muted uppercase tracking-widest">Enveloppe</p>
                   <p className="text-2xl font-bold text-brand">{state.budget.toLocaleString()}€</p>
                </div>
                <div className="space-y-2 md:col-span-2">
                   <p className="text-xs font-bold text-light-muted uppercase tracking-widest">Dates</p>
                   <p className="text-xl font-bold">
                     {formatTripDateRange(
                       state.startDate || undefined,
                       state.endDate || undefined
                     )}
                     {state.datesFlexible ? (
                       <span className="ml-2 text-xs font-bold text-brand">• flexibles</span>
                     ) : null}
                   </p>
                </div>
                <div className="space-y-2">
                   <p className="text-xs font-bold text-light-muted uppercase tracking-widest">Voyageurs</p>
                   <p className="text-2xl font-bold">{state.travelers} personnes</p>
                </div>
                <div className="space-y-2">
                   <p className="text-xs font-bold text-light-muted uppercase tracking-widest">Besoins</p>
                   <div className="flex flex-wrap gap-2">
                      {Object.entries(state.needs)
                        .filter(([, v]) => v)
                        .map(([k]) => {
                          const labels: Record<string, string> = {
                            flights: "Vols",
                            hotels: "Hôtels",
                            activities: "Activités",
                            restaurants: "Restaurants",
                          };
                          const Icon =
                            k === "flights" ? Plane
                              : k === "hotels" ? Hotel
                              : k === "activities" ? Check
                              : Users;
                          return (
                            <span
                              key={k}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand/10 text-brand text-xs font-bold"
                            >
                              <Icon size={12} aria-hidden /> {labels[k] ?? k}
                            </span>
                          );
                        })}
                   </div>
                </div>
                {state.selectedStyles.length > 0 ? (
                  <div className="space-y-2 md:col-span-2">
                    <p className="text-xs font-bold text-light-muted uppercase tracking-widest">Rythme</p>
                    <p className="text-sm font-bold text-light-foreground">
                      {state.selectedStyles
                        .map((id) => STYLE_LABELS[id] ?? id)
                        .join(" · ")}
                    </p>
                  </div>
                ) : null}
             </div>

             <div className="p-8 bg-emerald-50 rounded-[32px] border border-emerald-100 flex gap-6 items-center">
                <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-emerald-500 shadow-sm shrink-0">
                   <CheckCircle2 size={24} />
                </div>
                <div className="space-y-1">
                   <h3 className="font-bold text-emerald-900">Tout est en ordre !</h3>
                   <p className="text-xs text-emerald-700 leading-relaxed font-bold">Triply mettra en cohérence vos envies, vos dates et votre budget pour proposer un parcours équilibré.</p>
                </div>
             </div>
          </div>
          
          <div className="flex items-center gap-3 px-2">
             <Sparkles size={16} className="text-brand" />
             <span className="text-xs uppercase font-bold tracking-widest text-light-muted leading-relaxed">
               L'itinéraire sera sauvegardé automatiquement dans vos voyages.
             </span>
          </div>
        </div>
      );
    default:
      return null;
  }
}
