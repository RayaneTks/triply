'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Sidebar } from '@/src/components/Sidebar/Sidebar';
import { Button } from '@/src/components/Button/Button';
import { clearSession, getStoredSession } from '@/src/lib/auth-client';
import { getTrip, type TripSummary } from '@/src/lib/trips-client';
import { googleMapsDirectionsEmbedUrl, googleMapsDirectionsLink } from '@/src/lib/plan-snapshot';

const parseAmount = (value: unknown): number => {
    const n = Number.parseFloat(String(value ?? '').replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
};

const parseTripDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    const raw = String(dateStr).trim();
    if (!raw) return null;
    const direct = new Date(raw.includes('T') ? raw : `${raw}T12:00:00`);
    if (!Number.isNaN(direct.getTime())) return direct;
    const slice10 = raw.slice(0, 10);
    const fallback = new Date(`${slice10}T12:00:00`);
    return Number.isNaN(fallback.getTime()) ? null : fallback;
};

const formatDate = (dateStr: string) => {
    const parsed = parseTripDate(dateStr);
    if (!parsed) return '-';
    return parsed.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
};

const formatDateTime = (dateStr: string | undefined): string => {
    const parsed = parseTripDate(dateStr || '');
    if (!parsed) return '-';
    return parsed.toLocaleString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const buildHotelMapUrl = (latitude?: number, longitude?: number, address?: string): string | null => {
    if (typeof latitude === 'number' && Number.isFinite(latitude) && typeof longitude === 'number' && Number.isFinite(longitude)) {
        return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    }
    const query = (address || '').trim();
    if (!query) return null;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
};

const getStayNights = (checkInDate?: string, checkOutDate?: string): number | null => {
    const inDate = parseTripDate(checkInDate || '');
    const outDate = parseTripDate(checkOutDate || '');
    if (!inDate || !outDate) return null;
    const diffMs = outDate.getTime() - inDate.getTime();
    const nights = Math.round(diffMs / (1000 * 60 * 60 * 24));
    return nights >= 0 ? nights : null;
};

const getComputedBudget = (trip: TripSummary): { amount: number; currency: string } => {
    const persisted = parseAmount(trip.budget_total);
    const snapshot = trip.plan_snapshot;
    const flight = parseAmount(snapshot?.flightSummary?.price) || parseAmount(trip.flight?.price);
    const hotel = parseAmount(snapshot?.hotelSummary?.totalPrice);
    const total = persisted > 0 ? persisted : flight + hotel;
    const currency = snapshot?.flightSummary?.currency || snapshot?.hotelSummary?.currency || trip.currency || 'EUR';
    return { amount: total, currency };
};

const getDisplayDestination = (trip: TripSummary): string => {
    return (
        trip.plan_snapshot?.destinationSummary?.cityName ||
        trip.plan_snapshot?.hotelSummary?.cityName ||
        trip.destination ||
        'Destination'
    );
};

export default function VoyageDetailPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = params?.id as string;
    const justValidated = searchParams.get('validated') === '1';

    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [trip, setTrip] = useState<TripSummary | null>(null);

    const embedKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY;
    const tripBudget = trip ? getComputedBudget(trip) : null;
    const tripDestination = trip ? getDisplayDestination(trip) : 'Destination';
    const flightSummary = trip?.plan_snapshot?.flightSummary;
    const hotelSummary = trip?.plan_snapshot?.hotelSummary;
    const stayNights = getStayNights(hotelSummary?.checkInDate, hotelSummary?.checkOutDate);
    const hotelMapUrl = buildHotelMapUrl(hotelSummary?.latitude, hotelSummary?.longitude, hotelSummary?.address);

    useEffect(() => {
        let active = true;

        const loadTrip = async () => {
            const session = getStoredSession();
            if (!session?.token) {
                setIsConnected(false);
                router.replace('/');
                return;
            }

            try {
                setIsConnected(true);
                setLoading(true);
                setError('');
                const item = await getTrip(session.token, id);
                if (active) {
                    setTrip(item);
                }
            } catch (err) {
                if (active) {
                    setError(err instanceof Error ? err.message : 'Impossible de recuperer le voyage.');
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        if (id) {
            void loadTrip();
        }

        return () => {
            active = false;
        };
    }, [id, router]);

    return (
        <div className="flex h-dvh min-h-0 overflow-hidden w-full" style={{ backgroundColor: 'var(--background, #222222)' }}>
            <Sidebar
                isCollapsed={isSidebarCollapsed}
                onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                isConnected={isConnected}
                onLoginClick={() => router.push('/')}
                onLogoutClick={() => {
                    clearSession();
                    router.push('/');
                }}
            />

            <main className="flex-1 overflow-y-auto min-w-0">
                <div className="max-w-3xl mx-auto p-4 sm:p-6 md:p-8 lg:p-12">
                    <div className="flex items-center gap-4 mb-8">
                        <Link
                            href="/voyages"
                            className="text-sm font-medium hover:underline"
                            style={{ color: 'rgba(255, 255, 255, 0.7)' }}
                        >
                            {'<- Retour aux voyages'}
                        </Link>
                    </div>

                    {loading && (
                        <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            Chargement du voyage...
                        </p>
                    )}

                    {!loading && error && (
                        <div
                            className="rounded-2xl p-6"
                            style={{
                                backgroundColor: 'rgba(255, 0, 0, 0.08)',
                                border: '1px solid rgba(255, 0, 0, 0.25)',
                                color: '#ffb3b3',
                            }}
                        >
                            <p className="mb-4">{error}</p>
                            <Link href="/voyages" className="font-medium" style={{ color: 'var(--primary)' }}>
                                Retour aux voyages
                            </Link>
                        </div>
                    )}

                    {!loading && !error && trip && (
                        <>
                            {justValidated && (
                                <div
                                    className="mb-6 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100"
                                    role="status"
                                >
                                    Voyage enregistré avec succès. Retrouvez ci-dessous le détail de votre planning.
                                </div>
                            )}
                            <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: 'var(--foreground)', fontFamily: 'var(--font-title)' }}>
                                {trip.title}
                            </h1>
                            <p className="mb-10" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                Destination: {tripDestination}
                            </p>

                            <section className="mb-8">
                                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
                                    Informations generales
                                </h3>
                                <div
                                    className="rounded-2xl p-6 grid gap-4 sm:grid-cols-2"
                                    style={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                    }}
                                >
                                    <div>
                                        <span className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Depart</span>
                                        <p className="font-medium" style={{ color: 'var(--foreground)' }}>
                                            {formatDate(trip.start_date)}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Retour</span>
                                        <p className="font-medium" style={{ color: 'var(--foreground)' }}>
                                            {formatDate(trip.end_date)}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Duree</span>
                                        <p className="font-medium" style={{ color: 'var(--foreground)' }}>
                                            {trip.travel_days} jours
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Voyageurs</span>
                                        <p className="font-medium" style={{ color: 'var(--foreground)' }}>
                                            {trip.travelers_count}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Statut</span>
                                        <p className="font-medium" style={{ color: 'var(--foreground)' }}>
                                            {trip.status}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Budget</span>
                                        <p className="font-medium" style={{ color: 'var(--primary)' }}>
                                            {Math.round(tripBudget?.amount ?? 0)} {tripBudget?.currency || trip.currency}
                                        </p>
                                    </div>
                                </div>
                            </section>

                            <section className="mb-8">
                                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
                                    Details du vol
                                </h3>
                                <div
                                    className="rounded-2xl p-6 grid gap-4 sm:grid-cols-2"
                                    style={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                    }}
                                >
                                    <div>
                                        <span className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Compagnie</span>
                                        <p className="font-medium" style={{ color: 'var(--foreground)' }}>
                                            {flightSummary?.carrier || trip.flight?.carrier || 'Non renseignee'}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Prix du vol</span>
                                        <p className="font-medium" style={{ color: 'var(--primary)' }}>
                                            {flightSummary?.price || trip.flight?.price || '-'} {flightSummary?.currency || trip.currency}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Trajet</span>
                                        <p className="font-medium" style={{ color: 'var(--foreground)' }}>
                                            {(flightSummary?.originIata || '---')} → {(flightSummary?.destinationIata || '---')}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Depart (heure)</span>
                                        <p className="font-medium" style={{ color: 'var(--foreground)' }}>
                                            {formatDateTime(flightSummary?.outboundAt)}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Retour (heure)</span>
                                        <p className="font-medium" style={{ color: 'var(--foreground)' }}>
                                            {formatDateTime(flightSummary?.returnAt)}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Reference destination</span>
                                        <p className="font-medium" style={{ color: 'var(--foreground)' }}>
                                            {tripDestination}
                                        </p>
                                    </div>
                                    {flightSummary?.bookingUrl && (
                                        <div className="sm:col-span-2">
                                            <a
                                                href={flightSummary.bookingUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm font-medium text-cyan-400 hover:underline"
                                            >
                                                Ouvrir le lien de reservation du vol
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </section>

                            <section className="mb-8">
                                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
                                    Details de l&apos;hebergement
                                </h3>
                                <div
                                    className="rounded-2xl p-6 grid gap-4 sm:grid-cols-2"
                                    style={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                    }}
                                >
                                    <div>
                                        <span className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Nom</span>
                                        <p className="font-medium" style={{ color: 'var(--foreground)' }}>
                                            {hotelSummary?.name || 'Non renseigne'}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Prix total</span>
                                        <p className="font-medium" style={{ color: 'var(--primary)' }}>
                                            {hotelSummary?.totalPrice || '-'} {hotelSummary?.currency || trip.currency}
                                        </p>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <span className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Adresse</span>
                                        <div className="mt-0.5 flex items-center gap-2">
                                            <p className="font-medium" style={{ color: 'var(--foreground)' }}>
                                                {hotelSummary?.address || hotelSummary?.cityName || 'Non renseignee'}
                                            </p>
                                            {hotelMapUrl && (
                                                <a
                                                    href={hotelMapUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-cyan-400/40 text-cyan-400 hover:bg-cyan-400/10"
                                                    aria-label="Ouvrir l'adresse dans Google Maps"
                                                    title="Ouvrir l'adresse dans Google Maps"
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M12 22s7-5.7 7-12a7 7 0 1 0-14 0c0 6.3 7 12 7 12Z" />
                                                        <circle cx="12" cy="10" r="2.5" />
                                                    </svg>
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Check-in</span>
                                        <p className="font-medium" style={{ color: 'var(--foreground)' }}>
                                            {formatDate(hotelSummary?.checkInDate || '')}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Check-out</span>
                                        <p className="font-medium" style={{ color: 'var(--foreground)' }}>
                                            {formatDate(hotelSummary?.checkOutDate || '')}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Duree du sejour</span>
                                        <p className="font-medium" style={{ color: 'var(--foreground)' }}>
                                            {stayNights != null ? `${stayNights} nuit${stayNights > 1 ? 's' : ''}` : '-'}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Localisation</span>
                                        <p className="font-medium" style={{ color: 'var(--foreground)' }}>
                                            {hotelSummary?.cityName || tripDestination}
                                        </p>
                                    </div>
                                    <div className="sm:col-span-2 flex flex-wrap gap-3">
                                        {hotelSummary?.bookingUrl && (
                                            <a
                                                href={hotelSummary.bookingUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm font-medium text-cyan-400 hover:underline"
                                            >
                                                Ouvrir le lien de reservation de l&apos;hebergement
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </section>

                            {trip.plan_snapshot?.days && trip.plan_snapshot.days.length > 0 && (
                                <section className="mb-8">
                                    <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
                                        Planning par jour
                                    </h3>
                                    <div className="flex flex-col gap-8">
                                        {trip.plan_snapshot.days.map((day) => {
                                            const waypoints = day.activities.map((a) => ({ lat: a.lat, lng: a.lng }));
                                            const embedSrc = googleMapsDirectionsEmbedUrl(waypoints, embedKey);
                                            const externalLink = googleMapsDirectionsLink(waypoints);
                                            return (
                                                <div
                                                    key={day.dayIndex}
                                                    className="rounded-2xl p-5"
                                                    style={{
                                                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                                    }}
                                                >
                                                    <h4 className="text-base font-semibold text-cyan-400 mb-3">
                                                        Jour {day.dayIndex}
                                                    </h4>
                                                    {day.activities.length === 0 ? (
                                                        <p className="text-sm text-slate-500">Aucune activité</p>
                                                    ) : (
                                                        <ol className="list-decimal list-inside space-y-2 text-sm text-slate-200 mb-4">
                                                            {day.activities.map((a, i) => (
                                                                <li key={`${day.dayIndex}-${i}-${a.title}`}>
                                                                    {a.title}
                                                                    {a.durationHours != null && (
                                                                        <span className="text-slate-500">
                                                                            {' '}
                                                                            (~{a.durationHours} h)
                                                                        </span>
                                                                    )}
                                                                </li>
                                                            ))}
                                                        </ol>
                                                    )}
                                                    {waypoints.length >= 2 && (
                                                        <div className="mt-2">
                                                            {embedSrc ? (
                                                                <iframe
                                                                    title={`Carte jour ${day.dayIndex}`}
                                                                    src={embedSrc}
                                                                    className="h-64 w-full rounded-xl border border-white/10"
                                                                    loading="lazy"
                                                                    allowFullScreen
                                                                    referrerPolicy="no-referrer-when-downgrade"
                                                                />
                                                            ) : externalLink ? (
                                                                <a
                                                                    href={externalLink}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex text-sm font-medium text-cyan-400 hover:underline"
                                                                >
                                                                    Ouvrir l&apos;itinéraire dans Google Maps
                                                                </a>
                                                            ) : null}
                                                            {!embedSrc && (
                                                                <p className="mt-2 text-[11px] text-slate-500">
                                                                    Pour une carte intégrée, ajoutez NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY
                                                                    dans l&apos;environnement frontend.
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </section>
                            )}

                            <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
                                <Link href="/voyages">
                                    <Button label="Retour aux voyages" variant="dark" tone="tone2" />
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
