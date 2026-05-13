'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Plane, Trash2, ExternalLink, Search } from 'lucide-react';
import { FlightSearchModal } from '@/src/components/FlightSearchModal/FlightSearchModal';
import type { FlightOffer } from '@/src/components/FlightResults/FlightOfferCard';
import type { AmadeusResponse } from '@/src/components/FlightResults/FlightResults';
import { searchFlights, searchPlaces, lookupIata, type AmadeusLocation } from '@/src/lib/integrations/amadeus';
import { tripTravelClient, bookingCheckout, type FlightRecord } from '@/src/lib/trip-travel-client';
import { ApiError, extractErrorMessage } from '@/src/lib/http';

interface FlightsSectionProps {
    tripId: string;
    destination: string;
    startDate?: string | null;
    endDate?: string | null;
    travelers?: number;
    budgetTotal?: number;
    /** Origin captured at wizard time (plan_snapshot.origin). When provided we
     *  prefill the flight search modal instead of falling back to "Paris". */
    defaultOriginCity?: string;
    defaultOriginIata?: string;
}

async function resolveIata(keyword: string): Promise<string | null> {
    const term = keyword.trim();
    if (!term) return null;

    // Fast path: typed 3-letter IATA code (CDG, BCN, JFK).
    if (/^[A-Za-z]{3}$/.test(term)) {
        return term.toUpperCase();
    }

    // Try Amadeus IATA-only lookup first - guarantees a 3-letter code.
    try {
        const results: AmadeusLocation[] = await lookupIata(term, 'AIRPORT,CITY');
        const airport = results.find((r) => r.subType === 'AIRPORT' && r.iataCode);
        const city = results.find((r) => r.iataCode);
        const hit = airport?.iataCode || city?.iataCode;
        if (hit) return hit;
    } catch {
        // fall through to legacy /places below
    }

    // Legacy fallback (mixed Amadeus + Mapbox; Mapbox has no IATA).
    try {
        const results: AmadeusLocation[] = await searchPlaces(term);
        const airport = results.find((r) => r.subType === 'AIRPORT' && r.iataCode);
        const city = results.find((r) => r.iataCode);
        return airport?.iataCode || city?.iataCode || null;
    } catch {
        return null;
    }
}

function offerToFlightPayload(offer: FlightOffer, carrierName: string): Omit<FlightRecord, 'id'> {
    const outbound = offer.itineraries?.[0];
    const firstSeg = outbound?.segments?.[0];
    const lastSeg = outbound?.segments?.[outbound.segments.length - 1];
    const departIata = firstSeg?.departure?.iataCode || '';
    const arriveIata = lastSeg?.arrival?.iataCode || '';
    const departAt = firstSeg?.departure?.at || new Date().toISOString();
    const arriveAt = lastSeg?.arrival?.at || departAt;
    const totalEur = Math.round(parseFloat(offer.price.grandTotal || '0'));
    const flightNumber = `${firstSeg?.carrierCode ?? ''}${firstSeg?.number ?? ''}`.trim();

    return {
        type: carrierName || firstSeg?.carrierCode || 'Vol',
        depart_lieu: departIata,
        arrivee_lieu: arriveIata,
        depart_le: departAt,
        arrivee_le: arriveAt,
        prix: Number.isFinite(totalEur) ? totalEur : 0,
        devise: offer.price.currency || 'EUR',
        information_supplementaire: JSON.stringify({
            flightNumber,
            stops: outbound?.segments?.length ? outbound.segments.length - 1 : 0,
            duration: outbound?.duration ?? null,
            offerId: offer.id,
        }),
    };
}

function formatDateTime(iso: string | null): string {
    if (!iso) return '?';
    try {
        return new Date(iso).toLocaleString('fr-FR', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return iso;
    }
}

function buildFlightsErrorMessage(err: unknown): string {
    if (err instanceof ApiError) {
        const backendMsg = extractErrorMessage(err.body);
        if (backendMsg) return backendMsg;
        if (err.status === 405) {
            return 'La methode HTTP de recherche de vols est refusee par le serveur. Rechargez l\'application puis reessayez.';
        }
        if (err.status === 422) {
            return 'La recherche de vols a ete refusee (parametres invalides ou proxy API). Verifiez les villes et les dates.';
        }
        if (err.status >= 500) {
            return 'Le service de vols est temporairement indisponible. Reessayez dans quelques instants.';
        }
        return err.message;
    }

    if (err instanceof Error) return err.message;
    return 'Recherche impossible.';
}


export function FlightsSection({
    tripId,
    destination,
    startDate,
    endDate,
    travelers,
    budgetTotal,
    defaultOriginCity,
    defaultOriginIata,
}: FlightsSectionProps) {
    const [flights, setFlights] = useState<FlightRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    const initialOrigin = (defaultOriginCity && defaultOriginCity.trim())
        || (defaultOriginIata && defaultOriginIata.trim())
        || 'Paris';
    const [modalOpen, setModalOpen] = useState(false);
    const [departureCity, setDepartureCity] = useState(initialOrigin);
    const [arrivalCity, setArrivalCity] = useState(destination);
    const [arrivalDate, setArrivalDate] = useState(startDate ?? '');
    const [departureDate, setDepartureDate] = useState(endDate ?? '');
    const [travelerCount, setTravelerCount] = useState(travelers ?? 1);
    const [budget, setBudget] = useState(budgetTotal ? String(budgetTotal) : '');
    const [outboundDepartureTime, setOutboundDepartureTime] = useState('');
    const [outboundArrivalTime, setOutboundArrivalTime] = useState('');
    const [returnDepartureTime, setReturnDepartureTime] = useState('');
    const [returnArrivalTime, setReturnArrivalTime] = useState('');

    const [isSearching, setIsSearching] = useState(false);
    const [apiResponse, setApiResponse] = useState<AmadeusResponse | { error?: string; details?: string } | null>(null);
    const [persisting, setPersisting] = useState(false);
    const [opMessage, setOpMessage] = useState<string | null>(null);

    useEffect(() => { setArrivalCity(destination); }, [destination]);
    useEffect(() => { setArrivalDate(startDate ?? ''); }, [startDate]);
    useEffect(() => { setDepartureDate(endDate ?? ''); }, [endDate]);
    useEffect(() => { if (travelers) setTravelerCount(travelers); }, [travelers]);
    useEffect(() => {
        const city = defaultOriginCity?.trim();
        if (city) {
            setDepartureCity(city);
            return;
        }
        const iata = defaultOriginIata?.trim();
        if (iata) setDepartureCity(iata);
    }, [defaultOriginCity, defaultOriginIata]);

    const reload = useCallback(async () => {
        setLoading(true);
        setLoadError(null);
        try {
            const items = await tripTravelClient.listFlights(tripId);
            setFlights(items);
        } catch (err) {
            setLoadError(err instanceof Error ? err.message : 'Erreur de chargement.');
        } finally {
            setLoading(false);
        }
    }, [tripId]);

    useEffect(() => { void reload(); }, [reload]);

    const handleSearch = useCallback(async () => {
        setIsSearching(true);
        setApiResponse(null);
        const emptyEnv = { data: [] as never[], dictionaries: { carriers: {}, locations: {} } };
        try {
            const isoDate = /^\d{4}-\d{2}-\d{2}$/;
            const dep = arrivalDate.trim();
            if (!dep || !isoDate.test(dep)) {
                setApiResponse({
                    ...emptyEnv,
                    error: 'Indiquez une date de départ (aller) au format AAAA-MM-JJ.',
                } as unknown as AmadeusResponse);
                return;
            }
            const ret = departureDate.trim();
            if (ret && !isoDate.test(ret)) {
                setApiResponse({
                    ...emptyEnv,
                    error: 'Date de retour invalide : utilisez le format AAAA-MM-JJ.',
                } as unknown as AmadeusResponse);
                return;
            }
            const oCity = defaultOriginCity?.trim();
            const oIata = defaultOriginIata?.trim();
            const depTrim = departureCity.trim();
            let originCode: string | null = null;
            if (oIata && /^[A-Za-z]{3}$/.test(oIata)) {
                const iataUp = oIata.toUpperCase();
                if (depTrim.toUpperCase() === iataUp) {
                    originCode = iataUp;
                } else if (oCity && depTrim.toLowerCase() === oCity.toLowerCase()) {
                    originCode = iataUp;
                }
            }
            if (!originCode) {
                originCode = await resolveIata(departureCity);
            }
            const destCode = await resolveIata(arrivalCity);
            if (!originCode || !destCode) {
                setApiResponse({ ...emptyEnv, error: `Aucun aéroport IATA trouvé pour "${!originCode ? departureCity : arrivalCity}". Essayez un code 3 lettres (CDG, BCN...).` } as unknown as AmadeusResponse);
                return;
            }
            const body = {
                originLocationCode: originCode,
                destinationLocationCode: destCode,
                departureDate: arrivalDate,
                returnDate: departureDate || undefined,
                adults: Math.max(1, travelerCount),
                max: 10,
                maxPrice: budget ? Number(budget) : undefined,
            };
            const res = await searchFlights(body);
            if (res && typeof res === 'object' && 'errors' in res) {
                const errArr = (res as { errors?: Array<{ title?: string; detail?: string }> }).errors ?? [];
                const msg = errArr[0]?.detail || errArr[0]?.title || 'Erreur Amadeus.';
                setApiResponse({ ...emptyEnv, error: msg } as unknown as AmadeusResponse);
                return;
            }
            setApiResponse(res as AmadeusResponse);
        } catch (err) {
            setApiResponse({ ...emptyEnv, error: buildFlightsErrorMessage(err) } as unknown as AmadeusResponse);
        } finally {
            setIsSearching(false);
        }
    }, [departureCity, arrivalCity, arrivalDate, departureDate, travelerCount, budget, defaultOriginCity, defaultOriginIata]);

    const handleSelectOffer = useCallback(async (offer: FlightOffer, carrierName: string) => {
        if (persisting) return;
        setPersisting(true);
        setOpMessage(null);
        try {
            const payload = offerToFlightPayload(offer, carrierName);
            await tripTravelClient.createFlight(tripId, payload);
            setOpMessage('Vol ajouté au voyage.');
            setModalOpen(false);
            setApiResponse(null);
            await reload();
        } catch (err) {
            setOpMessage(err instanceof Error ? err.message : 'Sauvegarde impossible.');
        } finally {
            setPersisting(false);
        }
    }, [persisting, tripId, reload]);

    const handleDelete = useCallback(async (flightId: string) => {
        try {
            await tripTravelClient.deleteFlight(tripId, flightId);
            await reload();
        } catch (err) {
            setOpMessage(err instanceof Error ? err.message : 'Suppression impossible.');
        }
    }, [tripId, reload]);

    const handleBook = useCallback(async (flight: FlightRecord) => {
        try {
            const { deeplink } = await bookingCheckout(tripId, {
                provider: 'skyscanner',
                kind: 'flight',
                origin: flight.depart_lieu,
                destination_code: flight.arrivee_lieu,
                check_in: flight.depart_le ?? undefined,
                check_out: flight.arrivee_le ?? undefined,
                adults: travelerCount,
                currency: flight.devise ?? 'EUR',
                amount: flight.prix,
            });
            if (typeof window !== 'undefined') {
                window.open(deeplink, '_blank', 'noopener,noreferrer');
            }
        } catch (err) {
            setOpMessage(err instanceof Error ? err.message : 'Lien de réservation indisponible.');
        }
    }, [tripId, travelerCount]);

    const openModal = () => {
        setApiResponse(null);
        setModalOpen(true);
    };

    const headerSubtitle = useMemo(() => {
        if (loading) return 'Chargement...';
        if (flights.length === 0) return 'Aucun vol sélectionné';
        return `${flights.length} vol${flights.length > 1 ? 's' : ''} enregistré${flights.length > 1 ? 's' : ''}`;
    }, [loading, flights.length]);

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-brand/10 text-brand flex items-center justify-center">
                        <Plane size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold">Vols</h3>
                        <p className="text-xs text-light-muted font-bold">{headerSubtitle}</p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={openModal}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand text-white font-bold text-sm hover:opacity-90 transition-opacity"
                >
                    <Search size={14} /> Rechercher un vol
                </button>
            </div>

            {opMessage && (
                <p className="text-xs text-light-muted font-bold" role="status">{opMessage}</p>
            )}
            {loadError && (
                <p className="text-sm text-error" role="alert">{loadError}</p>
            )}

            {loading ? (
                <div className="triply-card p-6 space-y-3">
                    <div className="h-3 w-1/3 rounded bg-light-bg animate-pulse" />
                    <div className="h-3 w-1/2 rounded bg-light-bg animate-pulse" />
                </div>
            ) : flights.length === 0 ? (
                <div className="triply-card p-8 text-center space-y-3">
                    <p className="text-sm text-light-muted font-bold">
                        Aucun vol enregistré pour ce voyage.
                    </p>
                    <p className="text-xs text-light-muted">
                        Lancez une recherche pour comparer les meilleures offres selon votre budget.
                    </p>
                </div>
            ) : (
                <ul className="space-y-3">
                    {flights.map((flight) => (
                        <li key={flight.id} className="triply-card p-5 flex flex-wrap items-center gap-4 justify-between">
                            <div className="flex-1 min-w-0 space-y-1">
                                <p className="font-bold text-light-foreground">{flight.type}</p>
                                <p className="text-xs text-light-muted font-bold">
                                    {flight.depart_lieu} - {flight.arrivee_lieu}
                                </p>
                                <p className="text-xs text-light-muted">
                                    {formatDateTime(flight.depart_le)} · {formatDateTime(flight.arrivee_le)}
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-lg font-bold text-brand">
                                    {flight.prix} {flight.devise ?? 'EUR'}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => handleBook(flight)}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand/10 text-brand text-xs font-bold hover:bg-brand/20 transition-colors"
                                >
                                    Réserver <ExternalLink size={12} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleDelete(flight.id)}
                                    aria-label="Supprimer ce vol"
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-light-muted hover:text-error hover:bg-red-50 transition-colors"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            <FlightSearchModal
                visible={modalOpen}
                onClose={() => setModalOpen(false)}
                departureCity={departureCity}
                setDepartureCity={setDepartureCity}
                arrivalCity={arrivalCity}
                setArrivalCity={setArrivalCity}
                arrivalDate={arrivalDate}
                setArrivalDate={setArrivalDate}
                departureDate={departureDate}
                setDepartureDate={setDepartureDate}
                outboundDepartureTime={outboundDepartureTime}
                setOutboundDepartureTime={setOutboundDepartureTime}
                outboundArrivalTime={outboundArrivalTime}
                setOutboundArrivalTime={setOutboundArrivalTime}
                returnDepartureTime={returnDepartureTime}
                setReturnDepartureTime={setReturnDepartureTime}
                returnArrivalTime={returnArrivalTime}
                setReturnArrivalTime={setReturnArrivalTime}
                travelerCount={travelerCount}
                setTravelerCount={setTravelerCount}
                budget={budget}
                setBudget={setBudget}
                onSearch={handleSearch}
                onNewSearch={() => setApiResponse(null)}
                onSelectOffer={handleSelectOffer}
                isLoading={isSearching || persisting}
                apiResponse={apiResponse}
            />
        </div>
    );
}
