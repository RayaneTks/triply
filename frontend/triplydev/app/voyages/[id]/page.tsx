'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { Calendar, ExternalLink, Hotel, Map, MapPin, Plane } from 'lucide-react';
import { AppShell } from '@/src/components/AppShell/AppShell';
import { clearSession, getStoredSession, type AuthUser } from '@/src/lib/auth-client';
import { getTrip, type TripSummary } from '@/src/lib/trips-client';
import { useTripMap } from '@/src/hooks/useTripMap';
import type { DayActivityPoi } from '@/src/features/trip-creation/TripCreationWizard';

const WorldMap = dynamic(() => import('@/src/components/Map/Map').then((module) => module.WorldMap), {
    ssr: false,
    loading: () => <div className="h-full w-full animate-pulse rounded-[1.8rem] bg-white/40" />,
});

const formatShortDate = (dateStr: string) => {
    if (!dateStr) return '--';
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

export default function VoyageDetailPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = params?.id as string;
    const justValidated = searchParams.get('validated') === '1';

    const [isConnected, setIsConnected] = useState(false);
    const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [trip, setTrip] = useState<TripSummary | null>(null);
    const [selectedDay, setSelectedDay] = useState(1);
    const [showMap, setShowMap] = useState(false);

    const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';

    useEffect(() => {
        let active = true;
        const load = async () => {
            const session = getStoredSession();
            if (!session?.token) {
                router.replace('/');
                return;
            }
            try {
                setCurrentUser(session.user);
                setIsConnected(true);
                const item = await getTrip(session.token, id);
                if (active) setTrip(item);
            } catch (err) {
                if (active) setError(err instanceof Error ? err.message : 'Erreur lors du chargement du voyage.');
            } finally {
                if (active) setLoading(false);
            }
        };
        if (id) void load();
        return () => {
            active = false;
        };
    }, [id, router]);

    const dayActivitiesByDay = useMemo<Record<number, DayActivityPoi[]>>(() => {
        const map: Record<number, DayActivityPoi[]> = {};
        if (trip?.plan_snapshot?.days) {
            trip.plan_snapshot.days.forEach((day) => {
                map[day.dayIndex] = day.activities.map((activity) => ({
                    lngLat: { lng: activity.lng, lat: activity.lat },
                    properties: { name: activity.title },
                    layer: { id: activity.layerId || 'poi' },
                })) as DayActivityPoi[];
            });
        }
        return map;
    }, [trip]);

    const { mapStyle, mapConfig, mapPitch, mapLocationsWithDayActivities } = useTripMap({
        mapboxToken: MAPBOX_TOKEN,
        selectedDay,
        wizardView: 'activity',
        dayActivitiesByDay,
        legTransportByDay: {},
    });

    const flight = trip?.plan_snapshot?.flightSummary;
    const hotel = trip?.plan_snapshot?.hotelSummary;
    const days = trip?.plan_snapshot?.days ?? [];

    const handleLogout = () => {
        clearSession();
        router.push('/');
    };

    return (
        <AppShell
            activeTab="voyages"
            title={trip?.title || 'Voyage'}
            subtitle="Programme, reservations et carte au bon moment."
            user={currentUser}
            isConnected={isConnected}
            onLoginClick={() => router.push('/')}
            onLogoutClick={handleLogout}
            backHref="/voyages"
        >
            {loading ? (
                <div className="rounded-[1.8rem] border border-[var(--app-border)] bg-white/80 p-8 shadow-[var(--shadow-sm)]">
                    <p className="text-sm text-[color:var(--app-muted)]">Chargement du voyage...</p>
                </div>
            ) : null}

            {!loading && error ? (
                <div className="rounded-[1.8rem] border border-red-500/20 bg-red-500/10 p-5 text-sm text-red-500">
                    {error}
                </div>
            ) : null}

            {!loading && trip ? (
                <div className="space-y-4">
                    <section className="grid gap-4 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
                        <div className="rounded-[1.9rem] border border-[var(--app-border)] bg-white/82 p-5 shadow-[var(--shadow-sm)]">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--app-muted)]">{trip.status}</p>
                            <h2 className="mt-2 text-3xl font-semibold text-[color:var(--foreground)]">{trip.title}</h2>
                            <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--app-muted)]">
                                <span className="rounded-full bg-[var(--app-brand-soft)] px-3 py-2">Jour {selectedDay}</span>
                                <span className="rounded-full bg-white/90 px-3 py-2">{formatShortDate(trip.start_date)} {'->'} {formatShortDate(trip.end_date)}</span>
                            </div>
                            {justValidated ? (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 rounded-[1.4rem] border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-700">
                                    Votre voyage est pret.
                                </motion.div>
                            ) : null}
                            <button
                                type="button"
                                onClick={() => setShowMap((value) => !value)}
                                className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-[var(--app-border)] bg-white px-4 py-2 text-sm font-semibold text-[color:var(--foreground)] shadow-[var(--shadow-sm)] transition-colors hover:bg-[var(--app-brand-soft)]"
                            >
                                <Map size={16} />
                                {showMap ? 'Masquer la carte' : `Voir la carte du jour ${selectedDay}`}
                            </button>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            {flight ? (
                                <article className="rounded-[1.8rem] border border-[var(--app-border)] bg-white/82 p-5 shadow-[var(--shadow-sm)]">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--foreground)]">
                                            <Plane size={18} className="text-[color:var(--primary)]" />
                                            Vol
                                        </div>
                                        {flight.bookingUrl ? (
                                            <a href={flight.bookingUrl} target="_blank" className="text-[color:var(--app-muted)] hover:text-[color:var(--foreground)]">
                                                <ExternalLink size={16} />
                                            </a>
                                        ) : null}
                                    </div>
                                    <p className="mt-4 text-lg font-semibold text-[color:var(--foreground)]">{flight.carrier}</p>
                                    <p className="mt-2 text-sm text-[color:var(--app-muted)]">{flight.originIata} {'->'} {flight.destinationIata}</p>
                                    <p className="mt-3 text-sm font-semibold text-emerald-600">{flight.price} {flight.currency}</p>
                                </article>
                            ) : null}

                            {hotel ? (
                                <article className="rounded-[1.8rem] border border-[var(--app-border)] bg-white/82 p-5 shadow-[var(--shadow-sm)]">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--foreground)]">
                                            <Hotel size={18} className="text-emerald-600" />
                                            Hebergement
                                        </div>
                                        {hotel.bookingUrl ? (
                                            <a href={hotel.bookingUrl} target="_blank" className="text-[color:var(--app-muted)] hover:text-[color:var(--foreground)]">
                                                <ExternalLink size={16} />
                                            </a>
                                        ) : null}
                                    </div>
                                    <p className="mt-4 text-lg font-semibold text-[color:var(--foreground)]">{hotel.name}</p>
                                    <p className="mt-2 text-sm text-[color:var(--app-muted)]">{hotel.address || hotel.cityName}</p>
                                    <p className="mt-3 text-sm font-semibold text-emerald-600">{hotel.totalPrice} {hotel.currency}</p>
                                </article>
                            ) : null}
                        </div>
                    </section>

                    <section className="rounded-[1.8rem] border border-[var(--app-border)] bg-white/82 p-5 shadow-[var(--shadow-sm)]">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--app-muted)]">Planning</p>
                                <h3 className="mt-2 text-xl font-semibold text-[color:var(--foreground)]">Vos journees</h3>
                            </div>
                            <span className="rounded-full bg-[var(--app-brand-soft)] px-3 py-2 text-xs font-semibold text-[color:var(--primary)]">{days.length} jours</span>
                        </div>

                        <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
                            {days.map((day) => (
                                <button key={day.dayIndex} type="button" onClick={() => setSelectedDay(day.dayIndex)} className={`min-w-11 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors ${selectedDay === day.dayIndex ? 'bg-[var(--primary)] text-white' : 'border border-[var(--app-border)] bg-white text-[color:var(--foreground)]'}`}>
                                    J{day.dayIndex}
                                </button>
                            ))}
                        </div>

                        <div className="mt-5 space-y-3">
                            {days.filter((day) => day.dayIndex === selectedDay).flatMap((day) => day.activities).map((activity, index) => (
                                <div key={`${activity.title}-${index}`} className="rounded-[1.35rem] border border-[var(--app-border)] bg-white/88 p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--app-brand-soft)] text-xs font-semibold text-[color:var(--primary)]">{index + 1}</div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-semibold text-[color:var(--foreground)]">{activity.title}</p>
                                            <div className="mt-2 flex flex-wrap gap-3 text-sm text-[color:var(--app-muted)]">
                                                <span className="inline-flex items-center gap-1"><MapPin size={14} />Etape</span>
                                                {activity.durationHours ? <span className="inline-flex items-center gap-1"><Calendar size={14} />{activity.durationHours} h</span> : null}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {showMap ? (
                        <section className="rounded-[1.9rem] border border-[var(--app-border)] bg-white/78 p-5 shadow-[var(--shadow-sm)]">
                            <div className="mb-4 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--app-muted)]">Carte</p>
                                    <h3 className="mt-2 text-xl font-semibold text-[color:var(--foreground)]">Vue du jour {selectedDay}</h3>
                                </div>
                                <span className="rounded-full bg-[var(--app-brand-soft)] px-3 py-2 text-xs font-semibold text-[color:var(--primary)]">Contextuelle</span>
                            </div>
                            <div className="overflow-hidden rounded-[1.7rem]">
                                <WorldMap accessToken={MAPBOX_TOKEN} initialLatitude={46.6} initialLongitude={1.8} initialZoom={5} mapStyle={mapStyle} mapConfig={mapConfig} pitch={mapPitch} locations={mapLocationsWithDayActivities} className="h-[360px] w-full lg:h-[620px]" />
                            </div>
                        </section>
                    ) : null}
                </div>
            ) : null}
        </AppShell>
    );
}
