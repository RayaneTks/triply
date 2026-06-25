'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft,
    CalendarPlus,
    Copy,
    FileDown,
    FileText,
    Map,
    Sparkles,
    Trash2,
    Wallet,
} from 'lucide-react';
import { motion } from 'framer-motion';

import { PageHeader } from '../../components/ui/PageHeader';
import { useToast } from '../../components/ui/Toast';
import { FlightsSection } from '../../components/trips/FlightsSection';
import { HotelsSection } from '../../components/trips/HotelsSection';
import { ReplanModal, type CurrentActivityForReplan } from '../../components/trips/ReplanModal';
import { BudgetReshuffleModal } from '../../components/trips/BudgetReshuffleModal';
import { TripStatsGrid } from './components/TripStatsGrid';
import { TripTabsNav, type TripTab } from './components/TripTabsNav';
import { ItineraryTab } from './components/ItineraryTab';
import { TripCopilotAside } from './components/TripCopilotAside';
import { getStoredTrip } from '../../lib/local-trips-store';
import { ErrorState } from '../../components/ui/ErrorState';
import { authClient } from '../../lib/auth-client';
import { tripsClient, type TripApi } from '../../lib/trips-client';
import {
    activitiesClient,
    type ActivityDayBucket,
    type ActivityResource,
    type LikedState,
} from '../../lib/activities-client';
import { citiesClient } from '../../lib/cities-client';
import { tripDetailFromApi, tripDetailFromStored, type TripDetailDisplay } from '../../lib/trip-view-adapter';
import { printTripPdf } from '../../lib/trip-pdf-export';
import { exportTripIcs } from '../../lib/trip-export-client';
import { useAuthSession } from '../../hooks/useAuthSession';
import { AuthRequiredCard } from '../../components/auth/AuthRequiredCard';

export function TripDetailView() {
    const { tripId } = useParams<{ tripId: string }>();
    const router = useRouter();
    const { isConnected, isLoading: authLoading } = useAuthSession();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState<TripTab>('itinerary');
    const [isLoading, setIsLoading] = useState(true);
    const [apiTrip, setApiTrip] = useState<TripApi | null | undefined>(undefined);
    const [storedOnly, setStoredOnly] = useState<ReturnType<typeof getStoredTrip>>(undefined);

    const [activitiesByDay, setActivitiesByDay] = useState<ActivityDayBucket[]>([]);
    const [activitiesLoading, setActivitiesLoading] = useState(false);
    const [activitiesError, setActivitiesError] = useState<string | null>(null);

    const [pendingCityDelete, setPendingCityDelete] = useState<string | null>(null);
    const [deletingCity, setDeletingCity] = useState(false);
    const [replanOpen, setReplanOpen] = useState(false);
    const [budgetOpen, setBudgetOpen] = useState(false);
    const [duplicating, setDuplicating] = useState(false);
    const [exportingIcs, setExportingIcs] = useState(false);

    const reloadActivities = useCallback(async () => {
        if (!tripId || !authClient.getToken()) return;
        setActivitiesLoading(true);
        setActivitiesError(null);
        try {
            const result = await activitiesClient.groupedByDay(tripId);
            setActivitiesByDay(result.days ?? []);
        } catch (err) {
            setActivitiesError(err instanceof Error ? err.message : 'Erreur de chargement.');
        } finally {
            setActivitiesLoading(false);
        }
    }, [tripId]);

    useEffect(() => {
        let cancelled = false;
        if (!tripId) {
            setApiTrip(null);
            setStoredOnly(undefined);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setApiTrip(undefined);
        setStoredOnly(undefined);

        (async () => {
            if (authClient.getToken()) {
                try {
                    const remote = await tripsClient.get(tripId);
                    if (cancelled) return;
                    if (remote) {
                        setApiTrip(remote);
                        setStoredOnly(undefined);
                        setIsLoading(false);
                        void reloadActivities();
                        return;
                    }
                } catch {
                    // Fall through to stored
                }
            }
            const local = getStoredTrip(tripId);
            if (!cancelled) {
                setApiTrip(null);
                setStoredOnly(local);
                setIsLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [tripId, reloadActivities]);

    const trip: TripDetailDisplay | null = useMemo(() => {
        if (apiTrip) return tripDetailFromApi(apiTrip);
        if (storedOnly) return tripDetailFromStored(storedOnly);
        return null;
    }, [apiTrip, storedOnly]);

    const currentActivitiesForReplan: CurrentActivityForReplan[] = useMemo(() => {
        const out: CurrentActivityForReplan[] = [];
        for (const bucket of activitiesByDay) {
            const dayNumber = (bucket.index ?? 0) + 1;
            for (const activity of bucket.activities) {
                const { lat, lng, title } = activity.attributes;
                if (
                    typeof lat === 'number' &&
                    Number.isFinite(lat) &&
                    typeof lng === 'number' &&
                    Number.isFinite(lng) &&
                    title.trim() !== ''
                ) {
                    out.push({
                        id: activity.id,
                        day: dayNumber,
                        title,
                        lat,
                        lng,
                    });
                }
            }
        }
        return out;
    }, [activitiesByDay]);

    const cityGroups = useMemo(() => {
        const groups = new globalThis.Map<string, ActivityResource[]>();
        for (const bucket of activitiesByDay) {
            for (const activity of bucket.activities) {
                const city = activity.attributes.city?.trim() || 'Sans ville';
                if (!groups.has(city)) groups.set(city, []);
                groups.get(city)!.push(activity);
            }
        }
        return groups;
    }, [activitiesByDay]);

    const setActivityLiked = (activityId: string, liked: LikedState) => {
        setActivitiesByDay((current) =>
            current.map((day) => ({
                ...day,
                activities: day.activities.map((a) =>
                    a.id === activityId
                        ? { ...a, attributes: { ...a.attributes, liked_state: liked } }
                        : a,
                ),
            })),
        );
    };

    const restoreActivity = async (activityId: string) => {
        if (!tripId) return;
        try {
            await activitiesClient.restore(tripId, activityId);
            await reloadActivities();
        } catch (err) {
            toast({
                variant: 'error',
                title: 'Restauration impossible',
                description: err instanceof Error ? err.message : undefined,
            });
        }
    };

    const handleReorderDay = async (dayId: string, orderedIds: string[]) => {
        if (!tripId) return;
        let previous: ActivityDayBucket[] = [];
        setActivitiesByDay((current) => {
            previous = current;
            return current.map((day) => {
                if (day.day_id !== dayId) return day;
                const byId = new Map(day.activities.map((a) => [a.id, a]));
                const reordered = orderedIds
                    .map((id) => byId.get(id))
                    .filter((a): a is ActivityResource => Boolean(a));
                const missing = day.activities.filter((a) => !orderedIds.includes(a.id));
                return { ...day, activities: [...reordered, ...missing] };
            });
        });
        try {
            await activitiesClient.reorder(tripId, orderedIds);
        } catch (err) {
            setActivitiesByDay(previous);
            toast({
                variant: 'error',
                title: 'Réordonnancement impossible',
                description: err instanceof Error ? err.message : undefined,
            });
        }
    };

    const handleDeleteActivity = async (activity: ActivityResource) => {
        if (!tripId) return;
        const activityId = activity.id;
        try {
            await activitiesClient.delete(tripId, activityId);
            setActivitiesByDay((current) =>
                current.map((day) => ({
                    ...day,
                    activities: day.activities.filter((a) => a.id !== activityId),
                })),
            );
            toast({
                variant: 'info',
                title: 'Activité supprimée',
                duration: 5000,
                action: { label: 'Annuler', onClick: () => void restoreActivity(activityId) },
            });
        } catch (err) {
            toast({
                variant: 'error',
                title: 'Suppression impossible',
                description: err instanceof Error ? err.message : undefined,
            });
        }
    };

    const handleDeleteCity = async () => {
        if (!tripId || !pendingCityDelete) return;
        setDeletingCity(true);
        try {
            await citiesClient.deleteCity(tripId, pendingCityDelete);
            setPendingCityDelete(null);
            await reloadActivities();
        } catch (err) {
            toast({
                variant: 'error',
                title: 'Suppression de la ville impossible',
                description: err instanceof Error ? err.message : undefined,
            });
        } finally {
            setDeletingCity(false);
        }
    };

    if (authLoading || isLoading) {
        return (
            <div className="max-w-7xl mx-auto px-6 py-20 space-y-12 animate-pulse">
                <div className="h-10 bg-slate-200 w-1/4 rounded-lg" />
                <div className="grid lg:grid-cols-3 gap-12">
                    <div className="lg:col-span-2 space-y-8">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-40 bg-slate-100 rounded-[32px]" />
                        ))}
                    </div>
                    <div className="h-96 bg-slate-100 rounded-[32px]" />
                </div>
            </div>
        );
    }

    if (!isConnected) {
        return (
            <AuthRequiredCard
                title="Connectez-vous pour voir ce voyage"
                description="Le détail de vos voyages est réservé aux comptes connectés. Connectez-vous pour le retrouver."
            />
        );
    }

    if (!tripId || !trip) {
        return (
            <div className="max-w-7xl mx-auto px-6 py-12">
                <ErrorState
                    title="Voyage introuvable"
                    description="Ce voyage n’existe pas ou n’est pas accessible depuis cet appareil. Retrouvez vos voyages ou créez-en un nouveau."
                    primaryAction={{ label: 'Mes voyages', to: '/voyages' }}
                    secondaryAction={{ label: 'Créer un voyage', to: '/planifier' }}
                />
            </div>
        );
    }

    const hasRealActivities = activitiesByDay.some((d) => d.activities.length > 0);
    const parseBudgetAmount = (value: unknown): number => {
        if (typeof value === 'number' && Number.isFinite(value)) return value;
        if (typeof value !== 'string') return 0;
        const normalized = value.replace(',', '.').replace(/[^\d.-]/g, '');
        const parsed = Number.parseFloat(normalized);
        return Number.isFinite(parsed) ? parsed : 0;
    };

    const activitiesBudget = activitiesByDay.reduce((sum, day) => {
        return (
            sum +
            day.activities.reduce((daySum, activity) => {
                const raw = activity.attributes.cost;
                const cost = typeof raw === 'number' && Number.isFinite(raw) ? raw : 0;
                return daySum + cost;
            }, 0)
        );
    }, 0);

    const flightBudget = parseBudgetAmount(apiTrip?.plan_snapshot?.flightSummary?.price);
    const hotelBudget = parseBudgetAmount(apiTrip?.plan_snapshot?.hotelSummary?.totalPrice);
    const totalBudget = Math.max(0, apiTrip?.budget_total ?? 0);
    const allocatedBudget = flightBudget + hotelBudget + activitiesBudget;
    const remainingBudget = Math.max(0, totalBudget - allocatedBudget);
    const handleExportPdf = () => {
        try {
            printTripPdf({
                destination: trip.destination,
                dates: trip.dates,
                travelers: trip.travelers,
                totalBudget,
                allocatedBudget,
                remainingBudget,
                activitiesByDay,
            });
        } catch (err) {
            toast({
                variant: 'error',
                title: 'Export impossible',
                description: err instanceof Error ? err.message : undefined,
            });
        }
    };

    const handleExportIcs = async () => {
        if (!tripId || exportingIcs) return;
        setExportingIcs(true);
        try {
            await exportTripIcs(tripId);
            toast({
                variant: 'success',
                title: 'Agenda exporté',
                description: 'Importez le fichier .ics dans votre agenda.',
            });
        } catch (err) {
            toast({
                variant: 'error',
                title: 'Export impossible',
                description: err instanceof Error ? err.message : undefined,
            });
        } finally {
            setExportingIcs(false);
        }
    };

    const pendingSelections = (() => {
        const needs = apiTrip?.plan_snapshot?.plannerNeeds;
        const flightDeclared = needs?.flights === true;
        const hotelDeclared = needs?.hotels === true;
        const hasFlightSummary = Boolean(apiTrip?.plan_snapshot?.flightSummary?.price);
        const hasHotelSummary = Boolean(apiTrip?.plan_snapshot?.hotelSummary?.totalPrice);
        const items: Array<{ key: 'flights' | 'hotels'; label: string }> = [];
        if (flightDeclared && !hasFlightSummary) items.push({ key: 'flights', label: 'Vol' });
        if (hotelDeclared && !hasHotelSummary) items.push({ key: 'hotels', label: 'Hôtel' });
        return items;
    })();

    return (
        <div className="max-w-7xl mx-auto px-6 py-12 lg:py-20">
            <Link
                href="/voyages"
                className="inline-flex items-center gap-2 text-light-muted hover:text-brand font-bold text-xs uppercase mb-8 transition-colors"
            >
                <ArrowLeft size={14} /> Retour à mes voyages
            </Link>

            <PageHeader
                title={`Voyage — ${trip.destination}`}
                subtitle={`${trip.dates} • ${trip.travelers} voyageur${trip.travelers > 1 ? 's' : ''}`}
                actions={
                    <div className="flex flex-wrap gap-3">
                        {apiTrip && (
                            <button
                                type="button"
                                onClick={() => setBudgetOpen(true)}
                                className="btn-primary py-2 px-4 text-xs flex items-center gap-2"
                            >
                                <Wallet size={14} /> Budget
                            </button>
                        )}
                        {apiTrip && (
                            <button
                                type="button"
                                onClick={async () => {
                                    if (duplicating) return;
                                    setDuplicating(true);
                                    try {
                                        const copy = await tripsClient.duplicate(apiTrip.id);
                                        router.push(`/voyages/${copy.id}`);
                                    } catch (err) {
                                        toast({
                                            variant: 'error',
                                            title: 'Duplication impossible',
                                            description: err instanceof Error ? err.message : undefined,
                                        });
                                    } finally {
                                        setDuplicating(false);
                                    }
                                }}
                                disabled={duplicating}
                                className="btn-secondary py-2 px-4 text-xs flex items-center gap-2 disabled:opacity-60"
                            >
                                <Copy size={14} /> {duplicating ? 'Duplication…' : 'Dupliquer'}
                            </button>
                        )}
                        <Link
                            href={`/recap-voyage?tripId=${tripId}`}
                            className="btn-secondary py-2 px-4 text-xs flex items-center gap-2"
                        >
                            <FileText size={14} /> Récap
                        </Link>
                        <button
                            type="button"
                            onClick={handleExportPdf}
                            className="btn-secondary py-2 px-4 text-xs flex items-center gap-2"
                        >
                            <FileDown size={14} /> Export PDF
                        </button>
                        <button
                            type="button"
                            onClick={() => void handleExportIcs()}
                            disabled={exportingIcs}
                            className="btn-secondary py-2 px-4 text-xs flex items-center gap-2 disabled:opacity-60"
                        >
                            <CalendarPlus size={14} className={exportingIcs ? 'animate-pulse' : undefined} /> Export ICS
                        </button>
                    </div>
                }
            />

            <p className="text-sm text-light-muted font-bold mb-10 max-w-2xl">{trip.fullLabel}</p>

            <TripStatsGrid
                budget={trip.budget}
                remainingBudget={trip.remainingBudget}
                statusLabel={trip.statusLabel}
                destination={trip.destination}
            />

            {typeof trip.remainingBudget === 'number' && trip.remainingBudget < 0 && (
                <div
                    role="alert"
                    className="mb-8 flex flex-col gap-3 rounded-2xl border border-amber-300/70 bg-amber-50/95 p-5 text-amber-950 sm:flex-row sm:items-center sm:justify-between dark:border-amber-800/70 dark:bg-amber-950/40 dark:text-amber-100"
                >
                    <div className="flex items-start gap-3">
                        <Wallet size={20} className="mt-0.5 shrink-0" />
                        <div>
                            <p className="text-sm font-bold">
                                Dépassement budget&nbsp;: +{Math.abs(trip.remainingBudget)}€
                            </p>
                            <p className="text-xs leading-relaxed opacity-90">
                                Les estimations actuelles dépassent l&apos;enveloppe de {trip.budget}€.
                                Vous pouvez alléger pour rester dans le budget.
                            </p>
                        </div>
                    </div>
                    {apiTrip && (
                        <button
                            type="button"
                            onClick={() => setBudgetOpen(true)}
                            className="btn-secondary shrink-0 self-start px-4 py-2 text-xs sm:self-auto"
                        >
                            Alléger le budget
                        </button>
                    )}
                </div>
            )}

            {pendingSelections.length > 0 && (
                <div className="mb-8 flex flex-col gap-3 rounded-2xl border border-brand/30 bg-brand/5 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                        <Sparkles size={18} className="mt-0.5 shrink-0 text-brand" />
                        <div>
                            <p className="text-sm font-bold text-light-foreground">
                                Sélection{pendingSelections.length > 1 ? 's' : ''} en attente :{' '}
                                {pendingSelections.map((i) => i.label).join(' + ')}
                            </p>
                            <p className="text-xs leading-relaxed text-light-muted">
                                Vous avez demandé ces options au wizard. Sélectionnez-les pour ajuster le budget.
                            </p>
                        </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                        {pendingSelections.map((i) => (
                            <button
                                key={i.key}
                                type="button"
                                onClick={() => setActiveTab(i.key)}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-xs font-bold text-white hover:opacity-90"
                            >
                                Choisir {i.label.toLowerCase()}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-8">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <TripTabsNav activeTab={activeTab} onChange={setActiveTab} />
                        <Link
                            href={`/voyages/${tripId}/carte`}
                            className="btn-primary py-2 px-5 text-sm font-bold inline-flex items-center gap-2 shrink-0"
                        >
                            <Map size={16} /> Carte interactive
                        </Link>
                    </div>

                    <section>
                        {activeTab === 'itinerary' && (
                            <ItineraryTab
                                tripId={tripId}
                                trip={trip}
                                activitiesByDay={activitiesByDay}
                                activitiesLoading={activitiesLoading}
                                activitiesError={activitiesError}
                                cityGroups={cityGroups}
                                hasRealActivities={hasRealActivities}
                                onLikedChange={setActivityLiked}
                                onDeleteActivity={handleDeleteActivity}
                                onRequestCityDelete={setPendingCityDelete}
                                onReorderDay={handleReorderDay}
                            />
                        )}

                        {activeTab === 'flights' && tripId && (
                            <FlightsSection
                                tripId={tripId}
                                destination={trip.destination}
                                startDate={apiTrip?.start_date}
                                endDate={apiTrip?.end_date}
                                travelers={apiTrip?.travelers_count}
                                budgetTotal={apiTrip?.budget_total}
                                defaultOriginCity={apiTrip?.plan_snapshot?.origin?.cityName}
                                defaultOriginIata={
                                    apiTrip?.plan_snapshot?.origin?.iataCode
                                    ?? apiTrip?.plan_snapshot?.flightSummary?.originIata
                                }
                            />
                        )}

                        {activeTab === 'hotels' && tripId && (
                            <HotelsSection
                                tripId={tripId}
                                destination={trip.destination}
                                defaultDestinationCityCode={
                                    apiTrip?.plan_snapshot?.destinationSummary?.iataCode
                                    ?? apiTrip?.plan_snapshot?.hotelSummary?.cityCode
                                    ?? undefined
                                }
                                startDate={apiTrip?.start_date}
                                endDate={apiTrip?.end_date}
                                travelers={apiTrip?.travelers_count}
                                budgetTotal={apiTrip?.budget_total}
                            />
                        )}

                    </section>
                </div>

                <TripCopilotAside dates={trip.dates} travelers={trip.travelers} />
            </div>

            {/* Modale suppression ville */}
            {pendingCityDelete && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-sm"
                    style={{ backgroundColor: 'rgba(15,23,42,0.6)' }}
                    onClick={() => (deletingCity ? undefined : setPendingCityDelete(null))}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        onClick={(e) => e.stopPropagation()}
                        className="max-w-md w-full bg-card rounded-[32px] p-8 space-y-6 shadow-2xl border border-light-border"
                    >
                        <div className="w-14 h-14 bg-red-50 text-error rounded-2xl flex items-center justify-center">
                            <Trash2 size={28} />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-display font-bold">Supprimer cette ville ?</h3>
                            <p className="text-sm text-light-muted leading-relaxed">
                                Toutes les activités enregistrées à <strong>{pendingCityDelete}</strong> seront
                                supprimées de votre itinéraire. Cette action est irréversible.
                            </p>
                        </div>
                        <div className="flex flex-col gap-2">
                            <button
                                type="button"
                                onClick={handleDeleteCity}
                                disabled={deletingCity}
                                className="bg-error text-white font-bold py-3 rounded-2xl shadow-lg shadow-error/20 disabled:opacity-60"
                            >
                                {deletingCity ? 'Suppression…' : 'Supprimer cette ville'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setPendingCityDelete(null)}
                                disabled={deletingCity}
                                className="text-light-muted font-bold py-3 rounded-2xl hover:bg-light-bg disabled:opacity-60"
                            >
                                Annuler
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {apiTrip && budgetOpen && (
                <BudgetReshuffleModal
                    open={budgetOpen}
                    onClose={() => setBudgetOpen(false)}
                    tripId={apiTrip.id}
                    currentBudgetEur={apiTrip.budget_total ?? 0}
                    activitiesByDay={activitiesByDay}
                    budgetAllocation={[
                        { key: 'flight', label: 'Vols', amountEur: flightBudget },
                        { key: 'hotel', label: 'Hébergements', amountEur: hotelBudget },
                        { key: 'activity', label: 'Activités', amountEur: activitiesBudget },
                        { key: 'remaining', label: 'Reste à allouer', amountEur: remainingBudget },
                    ]}
                    totalAllocatedEur={allocatedBudget}
                    onSaved={() => void reloadActivities()}
                />
            )}

            {apiTrip && replanOpen && (
                <ReplanModal
                    open={replanOpen}
                    onClose={() => setReplanOpen(false)}
                    tripId={apiTrip.id}
                    trip={apiTrip}
                    currentActivities={currentActivitiesForReplan}
                    onApplied={async () => {
                        try {
                            const fresh = await tripsClient.get(apiTrip.id);
                            if (fresh) setApiTrip(fresh);
                        } catch {
                            /* ignore — modal already closes */
                        }
                        void reloadActivities();
                    }}
                />
            )}
        </div>
    );
}
