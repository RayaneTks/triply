'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { Bed, Trash2, ExternalLink, Search, PencilLine } from 'lucide-react';
import type { HotelSearchModal as HotelSearchModalType } from '@/src/components/HotelSearchModal/HotelSearchModal';
const HotelSearchModal = dynamic(
  () => import('@/src/components/HotelSearchModal/HotelSearchModal').then((m) => m.HotelSearchModal),
  { ssr: false },
) as typeof HotelSearchModalType;
import type { HotelOffer } from '@/src/components/HotelResults/HotelOfferCard';
import type { AmadeusHotelResponse } from '@/src/components/HotelResults/HotelResults';
import { searchHotels, searchPlaces, lookupIata, type AmadeusLocation, type HotelSearchBody } from '@/src/lib/integrations/amadeus';
import { tripTravelClient, bookingCheckout, type HotelRecord } from '@/src/lib/trip-travel-client';
import { ApiError, extractErrorMessage } from '@/src/lib/http';

interface HotelsSectionProps {
    tripId: string;
    destination: string;
    /** Code ville Amadeus 3 lettres issu du snapshot (ex. HRG) pour préremplir la recherche. */
    defaultDestinationCityCode?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    travelers?: number;
    budgetTotal?: number;
}

async function resolveCityCode(keyword: string): Promise<string | null> {
    const term = keyword.trim();
    if (!term) return null;

    if (/^[A-Za-z]{3}$/.test(term)) {
        return term.toUpperCase();
    }

    try {
        const results: AmadeusLocation[] = await lookupIata(term, 'CITY');
        const city = results.find((r) => r.subType === 'CITY' && r.iataCode);
        const anyResult = results.find((r) => r.iataCode);
        const hit = city?.iataCode || anyResult?.iataCode;
        if (hit) return hit;
    } catch {
        // fall through
    }

    try {
        const results: AmadeusLocation[] = await searchPlaces(term);
        const city = results.find((r) => r.subType === 'CITY' && r.iataCode);
        const anyResult = results.find((r) => r.iataCode);
        return city?.iataCode || anyResult?.iataCode || null;
    } catch {
        return null;
    }
}

const EMPTY_MANUAL_HOTEL = {
    nom: '',
    adresse: '',
    ville: '',
    arrivee_le: '',
    depart_le: '',
    prix: '',
    devise: 'EUR',
};

function offerToHotelPayload(offer: HotelOffer, fallbackCity: string): Omit<HotelRecord, 'id'> {
    const totalEur = Math.round(parseFloat(offer.price.total || '0'));
    return {
        type: 'hotel',
        nom: offer.hotelName,
        adresse: offer.hotelAddress || offer.cityCode || fallbackCity,
        code_postal: null,
        ville: fallbackCity || offer.cityCode || null,
        latitude: offer.hotelLatitude ?? null,
        longitude: offer.hotelLongitude ?? null,
        arrivee_le: offer.checkInDate || new Date().toISOString().slice(0, 10),
        depart_le: offer.checkOutDate || new Date().toISOString().slice(0, 10),
        prix: Number.isFinite(totalEur) ? totalEur : 0,
        devise: offer.price.currency || 'EUR',
        informations_supplementaire: JSON.stringify({
            hotelId: offer.hotelId,
            roomCategory: offer.roomCategory ?? null,
            roomDescription: offer.roomDescription ?? null,
            offerId: offer.id,
        }),
    };
}

function formatDate(iso: string | null): string {
    if (!iso) return '?';
    try {
        return new Date(iso).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    } catch {
        return iso;
    }
}

function buildHotelsErrorMessage(err: unknown): string {
    if (err instanceof ApiError) {
        const backendMsg = extractErrorMessage(err.body);
        if (backendMsg) return backendMsg;
        if (err.status === 405) {
            return 'La recherche d’hôtels est momentanément indisponible. Rechargez la page puis réessayez.';
        }
        if (err.status === 422) {
            return 'La recherche d’hôtels n’a pas abouti. Vérifiez la ville et les dates, puis réessayez.';
        }
        if (err.status >= 500) {
            return 'Le service d’hôtels est temporairement indisponible. Réessayez dans quelques instants.';
        }
        return err.message;
    }

    if (err instanceof Error) return err.message;
    return 'Recherche impossible.';
}


export function HotelsSection({
    tripId,
    destination,
    defaultDestinationCityCode,
    startDate,
    endDate,
    travelers,
    budgetTotal,
}: HotelsSectionProps) {
    const [hotels, setHotels] = useState<HotelRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [modalOpen, setModalOpen] = useState(false);
    const [cityCode, setCityCode] = useState(destination);
    const [arrivalDate, setArrivalDate] = useState(startDate ?? '');
    const [departureDate, setDepartureDate] = useState(endDate ?? '');
    const [travelerCount, setTravelerCount] = useState(travelers ?? 1);
    const [budget, setBudget] = useState(budgetTotal ? String(Math.round(budgetTotal / 4)) : '');
    const [mealRegime, setMealRegime] = useState('');
    const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

    const [isSearching, setIsSearching] = useState(false);
    const [apiResponse, setApiResponse] = useState<AmadeusHotelResponse | { error?: string; details?: string } | null>(null);
    const [persisting, setPersisting] = useState(false);
    const [opMessage, setOpMessage] = useState<string | null>(null);

    // Saisie manuelle d'un hôtel déjà réservé hors Triply (centralisation).
    const [manualOpen, setManualOpen] = useState(false);
    const [manualSaving, setManualSaving] = useState(false);
    const [manual, setManual] = useState(EMPTY_MANUAL_HOTEL);

    useEffect(() => { setCityCode(destination); }, [destination]);
    useEffect(() => {
        const hint = defaultDestinationCityCode?.trim();
        if (hint && /^[A-Za-z]{3}$/.test(hint)) {
            setCityCode(hint.toUpperCase());
        }
    }, [defaultDestinationCityCode]);
    useEffect(() => { setArrivalDate(startDate ?? ''); }, [startDate]);
    useEffect(() => { setDepartureDate(endDate ?? ''); }, [endDate]);
    useEffect(() => { if (travelers) setTravelerCount(travelers); }, [travelers]);

    const reload = useCallback(async () => {
        setLoading(true);
        setLoadError(null);
        try {
            const items = await tripTravelClient.listHotels(tripId);
            setHotels(items);
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
        const emptyEnv = { data: [] as never[] };
        try {
            const isoDate = /^\d{4}-\d{2}-\d{2}$/;
            const inD = arrivalDate.trim();
            const outD = departureDate.trim();
            if (!inD || !isoDate.test(inD) || !outD || !isoDate.test(outD)) {
                setApiResponse({
                    ...emptyEnv,
                    error: 'Indiquez des dates d’arrivée et de départ au format AAAA-MM-JJ.',
                } as unknown as AmadeusHotelResponse);
                return;
            }
            const resolvedCode = await resolveCityCode(cityCode);
            if (!resolvedCode) {
                setApiResponse({ ...emptyEnv, error: `Ville introuvable pour "${cityCode}". Essayez un code à 3 lettres (PAR, BCN...).` } as unknown as AmadeusHotelResponse);
                return;
            }
            const body: HotelSearchBody = {
                cityCode: resolvedCode,
                checkInDate: arrivalDate,
                checkOutDate: departureDate,
                adults: Math.max(1, travelerCount),
                maxPrice: budget ? Number(budget) : undefined,
                preferences: selectedOptions.length ? selectedOptions : undefined,
            };
            if (mealRegime === 'ROOM_ONLY' || mealRegime === 'BREAKFAST' || mealRegime === 'HALF_BOARD' || mealRegime === 'FULL_BOARD' || mealRegime === 'ALL_INCLUSIVE') {
                body.boardType = mealRegime;
            }
            const res = await searchHotels(body);
            if (res && typeof res === 'object' && 'errors' in res) {
                const errArr = (res as { errors?: Array<{ title?: string; detail?: string }> }).errors ?? [];
                const msg = errArr[0]?.detail || errArr[0]?.title || 'Recherche impossible pour le moment.';
                setApiResponse({ ...emptyEnv, error: msg } as unknown as AmadeusHotelResponse);
                return;
            }
            setApiResponse(res as AmadeusHotelResponse);
        } catch (err) {
            setApiResponse({ ...emptyEnv, error: buildHotelsErrorMessage(err) } as unknown as AmadeusHotelResponse);
        } finally {
            setIsSearching(false);
        }
    }, [cityCode, arrivalDate, departureDate, travelerCount, budget, mealRegime, selectedOptions]);

    const handleSelectOffer = useCallback(async (offer: HotelOffer) => {
        if (persisting) return;
        setPersisting(true);
        setOpMessage(null);
        try {
            const payload = offerToHotelPayload(offer, destination);
            await tripTravelClient.createHotel(tripId, payload);
            setOpMessage('Hôtel ajouté au voyage.');
            setModalOpen(false);
            setApiResponse(null);
            await reload();
        } catch (err) {
            setOpMessage(err instanceof Error ? err.message : 'Sauvegarde impossible.');
        } finally {
            setPersisting(false);
        }
    }, [persisting, tripId, destination, reload]);

    const handleDelete = useCallback(async (hotelId: string) => {
        try {
            await tripTravelClient.deleteHotel(tripId, hotelId);
            await reload();
        } catch (err) {
            setOpMessage(err instanceof Error ? err.message : 'Suppression impossible.');
        }
    }, [tripId, reload]);

    const handleBook = useCallback(async (hotel: HotelRecord) => {
        try {
            const { deeplink } = await bookingCheckout(tripId, {
                provider: 'booking',
                kind: 'hotel',
                destination: hotel.ville ?? destination,
                check_in: hotel.arrivee_le ?? undefined,
                check_out: hotel.depart_le ?? undefined,
                adults: travelerCount,
                currency: hotel.devise ?? 'EUR',
                amount: hotel.prix,
            });
            if (typeof window !== 'undefined') {
                window.open(deeplink, '_blank', 'noopener,noreferrer');
            }
        } catch (err) {
            setOpMessage(err instanceof Error ? err.message : 'Lien de réservation indisponible.');
        }
    }, [tripId, destination, travelerCount]);

    const handleManualSave = useCallback(async () => {
        if (manualSaving) return;
        const nom = manual.nom.trim();
        if (!nom) {
            setOpMessage('Renseignez au moins le nom de l’hôtel.');
            return;
        }
        if (!manual.arrivee_le || !manual.depart_le) {
            setOpMessage('Indiquez les dates d’arrivée et de départ.');
            return;
        }
        if (manual.depart_le < manual.arrivee_le) {
            setOpMessage('Le départ doit être postérieur (ou égal) à l’arrivée.');
            return;
        }
        setManualSaving(true);
        setOpMessage(null);
        try {
            await tripTravelClient.createHotel(tripId, {
                type: 'hotel',
                nom,
                adresse: manual.adresse.trim() || manual.ville.trim() || destination,
                code_postal: null,
                ville: manual.ville.trim() || destination,
                latitude: null,
                longitude: null,
                arrivee_le: manual.arrivee_le,
                depart_le: manual.depart_le,
                prix: manual.prix ? Math.max(0, Math.round(Number(manual.prix))) : 0,
                devise: manual.devise || 'EUR',
                informations_supplementaire: JSON.stringify({ source: 'manual' }),
            });
            setOpMessage('Hôtel ajouté au voyage.');
            setManual(EMPTY_MANUAL_HOTEL);
            setManualOpen(false);
            await reload();
        } catch (err) {
            setOpMessage(err instanceof Error ? err.message : 'Sauvegarde impossible.');
        } finally {
            setManualSaving(false);
        }
    }, [manual, manualSaving, tripId, destination, reload]);

    const openModal = () => {
        setApiResponse(null);
        setModalOpen(true);
    };

    const headerSubtitle = useMemo(() => {
        if (loading) return 'Chargement...';
        if (hotels.length === 0) return 'Aucun hôtel sélectionné';
        return `${hotels.length} hôtel${hotels.length > 1 ? 's' : ''} enregistré${hotels.length > 1 ? 's' : ''}`;
    }, [loading, hotels.length]);

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-brand/10 text-brand flex items-center justify-center">
                        <Bed size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold">Hôtels</h3>
                        <p className="text-xs text-light-muted font-bold">{headerSubtitle}</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setManualOpen((v) => !v)}
                        aria-expanded={manualOpen}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-light-border bg-card text-light-foreground font-bold text-sm hover:border-brand hover:text-brand transition-colors"
                    >
                        <PencilLine size={14} /> J&apos;ai déjà réservé
                    </button>
                    <button
                        type="button"
                        onClick={openModal}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand text-white font-bold text-sm hover:opacity-90 transition-opacity"
                    >
                        <Search size={14} /> Rechercher un hôtel
                    </button>
                </div>
            </div>

            {manualOpen && (
                <div className="triply-card space-y-4 p-5">
                    <p className="text-sm font-bold text-light-foreground">Ajouter un hôtel déjà réservé</p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <label className="space-y-1 text-xs font-bold text-light-muted sm:col-span-2">
                            Nom de l&apos;hôtel
                            <input
                                type="text"
                                value={manual.nom}
                                onChange={(e) => setManual((m) => ({ ...m, nom: e.target.value }))}
                                placeholder="Hôtel Belvédère"
                                className="w-full rounded-xl border border-light-border bg-card px-3 py-2 text-sm font-medium text-light-foreground focus:border-brand focus:outline-none"
                            />
                        </label>
                        <label className="space-y-1 text-xs font-bold text-light-muted">
                            Adresse
                            <input
                                type="text"
                                value={manual.adresse}
                                onChange={(e) => setManual((m) => ({ ...m, adresse: e.target.value }))}
                                placeholder="12 rue des Voyageurs"
                                className="w-full rounded-xl border border-light-border bg-card px-3 py-2 text-sm font-medium text-light-foreground focus:border-brand focus:outline-none"
                            />
                        </label>
                        <label className="space-y-1 text-xs font-bold text-light-muted">
                            Ville
                            <input
                                type="text"
                                value={manual.ville}
                                onChange={(e) => setManual((m) => ({ ...m, ville: e.target.value }))}
                                placeholder={destination}
                                className="w-full rounded-xl border border-light-border bg-card px-3 py-2 text-sm font-medium text-light-foreground focus:border-brand focus:outline-none"
                            />
                        </label>
                        <label className="space-y-1 text-xs font-bold text-light-muted">
                            Arrivée
                            <input
                                type="date"
                                value={manual.arrivee_le}
                                onChange={(e) => setManual((m) => ({ ...m, arrivee_le: e.target.value }))}
                                className="w-full rounded-xl border border-light-border bg-card px-3 py-2 text-sm font-medium text-light-foreground focus:border-brand focus:outline-none"
                            />
                        </label>
                        <label className="space-y-1 text-xs font-bold text-light-muted">
                            Départ
                            <input
                                type="date"
                                value={manual.depart_le}
                                onChange={(e) => setManual((m) => ({ ...m, depart_le: e.target.value }))}
                                className="w-full rounded-xl border border-light-border bg-card px-3 py-2 text-sm font-medium text-light-foreground focus:border-brand focus:outline-none"
                            />
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <label className="space-y-1 text-xs font-bold text-light-muted">
                                Prix
                                <input
                                    type="number"
                                    min={0}
                                    value={manual.prix}
                                    onChange={(e) => setManual((m) => ({ ...m, prix: e.target.value }))}
                                    placeholder="0"
                                    className="w-full rounded-xl border border-light-border bg-card px-3 py-2 text-sm font-medium text-light-foreground focus:border-brand focus:outline-none"
                                />
                            </label>
                            <label className="space-y-1 text-xs font-bold text-light-muted">
                                Devise
                                <input
                                    type="text"
                                    value={manual.devise}
                                    onChange={(e) => setManual((m) => ({ ...m, devise: e.target.value.toUpperCase().slice(0, 3) }))}
                                    className="w-full rounded-xl border border-light-border bg-card px-3 py-2 text-sm font-medium text-light-foreground focus:border-brand focus:outline-none"
                                />
                            </label>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => void handleManualSave()}
                            disabled={manualSaving}
                            className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                        >
                            {manualSaving ? 'Ajout…' : 'Ajouter l’hôtel'}
                        </button>
                        <button
                            type="button"
                            onClick={() => { setManualOpen(false); setManual(EMPTY_MANUAL_HOTEL); }}
                            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-light-muted transition-colors hover:text-light-foreground"
                        >
                            Annuler
                        </button>
                    </div>
                </div>
            )}

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
            ) : hotels.length === 0 ? (
                <div className="triply-card relative overflow-hidden p-8">
                    <div aria-hidden className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-brand/10 blur-3xl" />
                    <div className="relative flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-2">
                            <span className="inline-flex items-center rounded-full border border-brand/30 bg-brand/5 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-brand">
                                Aucun hôtel sélectionné
                            </span>
                            <h4 className="text-xl font-display font-bold text-light-foreground">Trouvez l’hôtel le moins cher selon vos dates</h4>
                            <p className="max-w-md text-sm leading-relaxed text-light-muted">
                                Triply compare les offres et accroche celle qui rentre dans votre budget en un clic.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={openModal}
                            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-bold text-white shadow-md transition-opacity hover:opacity-90"
                        >
                            <Search size={16} /> Sélectionner un hôtel
                        </button>
                    </div>
                </div>
            ) : (
                <ul className="space-y-3">
                    {hotels.map((hotel) => (
                        <li key={hotel.id} className="triply-card p-5 flex flex-wrap items-center gap-4 justify-between">
                            <div className="flex-1 min-w-0 space-y-1">
                                <p className="font-bold text-light-foreground">{hotel.nom}</p>
                                <p className="text-xs text-light-muted font-bold">
                                    {[hotel.adresse, hotel.ville].filter(Boolean).join(' · ')}
                                </p>
                                <p className="text-xs text-light-muted">
                                    {formatDate(hotel.arrivee_le)} - {formatDate(hotel.depart_le)}
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-lg font-bold text-brand">
                                    {hotel.prix} {hotel.devise ?? 'EUR'}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => handleBook(hotel)}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand/10 text-brand text-xs font-bold hover:bg-brand/20 transition-colors"
                                >
                                    Réserver <ExternalLink size={12} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleDelete(hotel.id)}
                                    aria-label="Supprimer cet hôtel"
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-light-muted hover:text-error hover:bg-red-50 transition-colors"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            <HotelSearchModal
                visible={modalOpen}
                onClose={() => setModalOpen(false)}
                cityCode={cityCode}
                setCityCode={setCityCode}
                arrivalDate={arrivalDate}
                setArrivalDate={setArrivalDate}
                departureDate={departureDate}
                setDepartureDate={setDepartureDate}
                travelerCount={travelerCount}
                setTravelerCount={setTravelerCount}
                budget={budget}
                setBudget={setBudget}
                mealRegime={mealRegime}
                setMealRegime={setMealRegime}
                selectedOptions={selectedOptions}
                setSelectedOptions={setSelectedOptions}
                onSearch={handleSearch}
                onNewSearch={() => setApiResponse(null)}
                onSelectOffer={handleSelectOffer}
                isLoading={isSearching || persisting}
                apiResponse={apiResponse}
            />
        </div>
    );
}
