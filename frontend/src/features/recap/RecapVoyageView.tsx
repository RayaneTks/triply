'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
    ArrowLeft,
    Calendar,
    CheckCircle2,
    Clock,
    Copy,
    ExternalLink,
    Heart,
    MapPin,
    Plane,
    Share2,
    Sparkles,
    ThumbsDown,
    ThumbsUp,
    Users,
    Wallet,
    X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { WorldMap as Map, type RouteMapSegment } from '../../components/Map/Map';
import { recapClient, type RecapSection, type RouteSegment, type TripRecap } from '../../lib/recap-client';
import { bookingClient } from '../../lib/booking-client';
import { authClient } from '../../lib/auth-client';
import { ErrorState } from '../../components/ui/ErrorState';
import { cn } from '../../lib/utils';
import { useAuthSession } from '../../hooks/useAuthSession';
import { AuthRequiredCard } from '../../components/auth/AuthRequiredCard';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';

interface RecapVoyageViewProps {
    /** Mode public (lien partagé) : on désactive les actions de partage et le retour. */
    publicShareToken?: string;
}

export function RecapVoyageView({ publicShareToken }: RecapVoyageViewProps) {
    const searchParams = useSearchParams();
    const { isConnected, isLoading: authLoading } = useAuthSession();
    const tripIdParam = searchParams?.get('tripId') ?? null;

    const [recap, setRecap] = useState<TripRecap | null>(null);
    const [routes, setRoutes] = useState<RouteSegment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeDayId, setActiveDayId] = useState<string | null>(null);

    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [shareLoading, setShareLoading] = useState(false);
    const [shareUrl, setShareUrl] = useState<string | null>(null);
    const [shareCopied, setShareCopied] = useState(false);
    const [shareTtlDays, setShareTtlDays] = useState(30);
    const [shareError, setShareError] = useState<string | null>(null);

    const [bookingLoading, setBookingLoading] = useState(false);
    const [bookingError, setBookingError] = useState<string | null>(null);

    const isPublic = Boolean(publicShareToken);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            setLoading(true);
            setError(null);
            try {
                if (publicShareToken) {
                    const data = await recapClient.getPublicRecap(publicShareToken);
                    if (cancelled) return;
                    setRecap(data);
                    setRoutes([]);
                } else if (tripIdParam) {
                    const [recapData, routesData] = await Promise.all([
                        recapClient.getRecap(tripIdParam),
                        recapClient.getRoutes(tripIdParam).catch(() => ({ trip_id: tripIdParam, segments: [] })),
                    ]);
                    if (cancelled) return;
                    setRecap(recapData);
                    setRoutes(routesData.segments ?? []);
                } else {
                    throw new Error('Aucun voyage à afficher.');
                }
            } catch (err) {
                if (!cancelled) setError(err instanceof Error ? err.message : 'Erreur de chargement.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        load();
        return () => {
            cancelled = true;
        };
    }, [publicShareToken, tripIdParam]);

    const days = useMemo<Extract<RecapSection, { type: 'day' }>[]>(
        () => (recap?.sections ?? []).filter((s): s is Extract<RecapSection, { type: 'day' }> => s.type === 'day'),
        [recap],
    );
    const flights = useMemo<Extract<RecapSection, { type: 'flight' }>[]>(
        () => (recap?.sections ?? []).filter((s): s is Extract<RecapSection, { type: 'flight' }> => s.type === 'flight'),
        [recap],
    );
    const hotels = useMemo<Extract<RecapSection, { type: 'hotel' }>[]>(
        () => (recap?.sections ?? []).filter((s): s is Extract<RecapSection, { type: 'hotel' }> => s.type === 'hotel'),
        [recap],
    );

    useEffect(() => {
        if (!activeDayId && days.length > 0) {
            setActiveDayId(days[0].day_id);
        }
    }, [activeDayId, days]);

    const activeDay = useMemo(() => days.find((d) => d.day_id === activeDayId) ?? days[0] ?? null, [days, activeDayId]);

    const mapCenter = useMemo(() => {
        const points = activeDay?.activities.filter((a) => a.lat != null && a.lng != null) ?? [];
        if (points.length === 0) {
            const allPoints = days.flatMap((d) => d.activities).filter((a) => a.lat != null && a.lng != null);
            if (allPoints.length === 0) return { lat: 48.85, lng: 2.35, zoom: 3 };
            const lat = allPoints.reduce((s, a) => s + (a.lat ?? 0), 0) / allPoints.length;
            const lng = allPoints.reduce((s, a) => s + (a.lng ?? 0), 0) / allPoints.length;
            return { lat, lng, zoom: 4 };
        }
        const lat = points.reduce((s, a) => s + (a.lat ?? 0), 0) / points.length;
        const lng = points.reduce((s, a) => s + (a.lng ?? 0), 0) / points.length;
        return { lat, lng, zoom: 11 };
    }, [activeDay, days]);

    const mapLocations = useMemo(
        () =>
            (activeDay?.activities ?? [])
                .filter((a) => a.lat != null && a.lng != null)
                .map((a, idx) => ({
                    id: a.id,
                    title: `${idx + 1}. ${a.title}`,
                    coordinates: { latitude: a.lat as number, longitude: a.lng as number },
                    type: 'activity',
                })),
        [activeDay],
    );

    const mapSegments: RouteMapSegment[] = useMemo(() => {
        if (!activeDay) return [];
        const daySegments = routes.filter((r) => r.day_id === activeDay.day_id);
        return daySegments.map((seg) => ({
            id: `${seg.from.id}-${seg.to.id}`,
            profile: seg.profile === 'cycling' ? 'cycling' : seg.profile === 'walking' ? 'walking' : 'driving',
            geometry: {
                type: 'LineString',
                coordinates: [
                    [seg.from.lng, seg.from.lat],
                    [seg.to.lng, seg.to.lat],
                ],
            },
            durationSec: seg.estimated_minutes * 60,
        }));
    }, [activeDay, routes]);

    const totalLiked = useMemo(
        () => days.reduce((sum, d) => sum + d.activities.filter((a) => a.liked_state === 'liked').length, 0),
        [days],
    );
    const totalActivities = useMemo(() => days.reduce((sum, d) => sum + d.activities.length, 0), [days]);

    const handleShare = useCallback(async () => {
        if (!recap?.trip || !authClient.getToken()) return;
        setShareLoading(true);
        setShareError(null);
        try {
            const link = await recapClient.createShareLink(recap.trip.id, { ttl_days: shareTtlDays });
            setShareUrl(link.share_url);
        } catch (err) {
            setShareError(err instanceof Error ? err.message : 'Impossible de générer le lien.');
        } finally {
            setShareLoading(false);
        }
    }, [recap, shareTtlDays]);

    const handleFinalizeBooking = useCallback(async () => {
        if (!recap?.trip) return;
        setBookingLoading(true);
        setBookingError(null);
        try {
            const result = await bookingClient.checkout(recap.trip.id, {
                provider: 'booking',
                kind: 'hotel',
                destination: recap.trip.destination,
                check_in: recap.trip.start_date,
                check_out: recap.trip.end_date,
                adults: recap.trip.travelers_count,
            });
            if (typeof window !== 'undefined') {
                window.open(result.attributes.deeplink, '_blank', 'noopener,noreferrer');
            }
        } catch (err) {
            setBookingError(err instanceof Error ? err.message : 'Lien indisponible pour le moment.');
        } finally {
            setBookingLoading(false);
        }
    }, [recap]);

    const handleCopy = useCallback(async () => {
        if (!shareUrl) return;
        try {
            await navigator.clipboard.writeText(shareUrl);
            setShareCopied(true);
            window.setTimeout(() => setShareCopied(false), 2000);
        } catch {
            // Ignore clipboard errors
        }
    }, [shareUrl]);

    if (authLoading || loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-10 w-10 border-2 border-[var(--primary)] border-t-transparent" />
                    <p className="mt-4 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                        Chargement du récap…
                    </p>
                </div>
            </div>
        );
    }

    if (!isPublic && !isConnected) {
        return (
            <AuthRequiredCard
                title="Connectez-vous pour voir ce récap"
                description="Le récapitulatif de vos voyages est réservé aux comptes connectés."
            />
        );
    }

    if (error || !recap) {
        return (
            <div className="px-6 py-10">
                <ErrorState title="Récap indisponible" description={error ?? 'Voyage introuvable.'} />
            </div>
        );
    }

    const trip = recap.trip;
    if (!trip) {
        return (
            <div className="px-6 py-10">
                <ErrorState title="Récap incomplet" description="Les informations du voyage sont indisponibles." />
            </div>
        );
    }

    const dateRange = `${trip.start_date} → ${trip.end_date}`;

    return (
        <div className="pb-24">
            {/* Hero header */}
            <header
                className="relative overflow-hidden"
                style={{
                    background:
                        'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 50%, var(--accent) 100%)',
                    color: '#ffffff',
                }}
            >
                <div className="max-w-7xl mx-auto px-6 py-10">
                    {!isPublic && (
                        <Link
                            href={`/voyages/${trip.id}`}
                            className="inline-flex items-center gap-2 text-sm/none font-bold mb-6 opacity-90 hover:opacity-100"
                        >
                            <ArrowLeft size={16} /> Retour au voyage
                        </Link>
                    )}
                    <div className="flex flex-wrap items-end justify-between gap-6">
                        <div className="min-w-0">
                            <p className="uppercase tracking-widest text-xs font-bold opacity-80">Récapitulatif du voyage</p>
                            <h1 className="mt-2 text-4xl md:text-5xl font-black leading-tight">{trip.title}</h1>
                            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm opacity-95">
                                <span className="inline-flex items-center gap-2">
                                    <MapPin size={16} /> {trip.destination}
                                </span>
                                <span className="inline-flex items-center gap-2">
                                    <Calendar size={16} /> {dateRange}
                                </span>
                                <span className="inline-flex items-center gap-2">
                                    <Users size={16} /> {trip.travelers_count}{' '}
                                    {trip.travelers_count > 1 ? 'voyageurs' : 'voyageur'}
                                </span>
                                {typeof trip.budget_total === 'number' && (
                                    <span className="inline-flex items-center gap-2">
                                        <Wallet size={16} /> {trip.budget_total} {trip.currency ?? 'EUR'}
                                    </span>
                                )}
                            </div>
                        </div>
                        {!isPublic && (
                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleFinalizeBooking}
                                    disabled={bookingLoading}
                                    className="btn-secondary py-2 px-4 text-sm"
                                    title="Ouvrir une page de réservation préremplie (Booking.com)"
                                >
                                    <ExternalLink size={16} /> {bookingLoading ? 'Préparation…' : 'Finaliser via Triply'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShareModalOpen(true);
                                        setShareUrl(null);
                                        setShareError(null);
                                    }}
                                    className="btn-primary py-2 px-4 text-sm"
                                >
                                    <Share2 size={16} /> Partager
                                </button>
                            </div>
                        )}
                        {bookingError && (
                            <p className="basis-full text-xs text-red-200 mt-2">{bookingError}</p>
                        )}
                    </div>

                    {/* Stats */}
                    <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <StatTile icon={<Calendar size={18} />} label="Jours" value={trip.travel_days.toString()} />
                        <StatTile icon={<Sparkles size={18} />} label="Activités" value={totalActivities.toString()} />
                        <StatTile icon={<Heart size={18} />} label="Coups de cœur" value={totalLiked.toString()} />
                        <StatTile
                            icon={<Plane size={18} />}
                            label="Vols"
                            value={flights.length.toString()}
                        />
                    </div>
                </div>
            </header>

            {/* Main grid: timeline + sticky map */}
            <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-[1fr_minmax(320px,420px)] gap-8">
                <section className="space-y-8 min-w-0">
                    {flights.length > 0 && (
                        <BookingSummarySection title="Vols" icon={<Plane size={18} />}>
                            {flights.map((f) => (
                                <SummaryRow
                                    key={f.transport_id}
                                    title={`${f.depart_lieu ?? '—'} → ${f.arrivee_lieu ?? '—'}`}
                                    subtitle={formatRange(f.depart_le, f.arrivee_le)}
                                    extra={f.information_supplementaire ?? null}
                                    price={f.prix ?? null}
                                    currency={f.devise ?? null}
                                />
                            ))}
                        </BookingSummarySection>
                    )}

                    {hotels.length > 0 && (
                        <BookingSummarySection title="Hébergements" icon={<MapPin size={18} />}>
                            {hotels.map((h, idx) => (
                                <SummaryRow
                                    key={`${h.nom}-${idx}`}
                                    title={h.nom ?? 'Hébergement'}
                                    subtitle={[h.ville, h.adresse].filter(Boolean).join(' · ') || null}
                                    extra={formatRange(h.arrivee_le, h.depart_le)}
                                    price={h.prix ?? null}
                                    currency={h.devise ?? null}
                                />
                            ))}
                        </BookingSummarySection>
                    )}

                    {/* Day tabs */}
                    {days.length > 0 && (
                        <div>
                            <div className="flex flex-wrap items-center gap-2 mb-4">
                                {days.map((d) => {
                                    const active = d.day_id === activeDay?.day_id;
                                    return (
                                        <button
                                            key={d.day_id}
                                            type="button"
                                            onClick={() => setActiveDayId(d.day_id)}
                                            className={cn(
                                                'px-3 py-1.5 rounded-full text-xs font-bold transition-all',
                                                active
                                                    ? 'bg-[var(--primary)] text-white shadow-sm'
                                                    : 'bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface-hover)]',
                                            )}
                                        >
                                            Jour {d.day_index}
                                        </button>
                                    );
                                })}
                            </div>

                            {activeDay && <DayTimeline day={activeDay} />}
                        </div>
                    )}
                </section>

                {/* Sticky map */}
                <aside className="lg:sticky lg:top-24 self-start">
                    <div
                        className="rounded-3xl overflow-hidden border"
                        style={{ borderColor: 'var(--border)', height: 'min(640px, 70vh)' }}
                    >
                        {MAPBOX_TOKEN ? (
                            <Map
                                accessToken={MAPBOX_TOKEN}
                                initialLatitude={mapCenter.lat}
                                initialLongitude={mapCenter.lng}
                                initialZoom={mapCenter.zoom}
                                mapStyle="mapbox://styles/mapbox/standard"
                                locations={mapLocations}
                                routeSegments={mapSegments}
                                interactive
                                height="100%"
                                width="100%"
                            />
                        ) : (
                            <div className="h-full w-full flex items-center justify-center text-sm" style={{ color: 'var(--muted-foreground)' }}>
                                Carte indisponible pour le moment
                            </div>
                        )}
                    </div>
                    {activeDay && (
                        <div className="mt-3 text-xs px-2 flex items-center gap-2" style={{ color: 'var(--muted-foreground)' }}>
                            <Clock size={14} />
                            {mapSegments.length > 0
                                ? `${mapSegments.length} trajet${mapSegments.length > 1 ? 's' : ''} ce jour-là`
                                : 'Pas de trajet calculé sur ce jour'}
                        </div>
                    )}
                </aside>
            </div>

            <AnimatePresence>
                {shareModalOpen && !isPublic && (
                    <ShareModal
                        onClose={() => setShareModalOpen(false)}
                        shareUrl={shareUrl}
                        ttlDays={shareTtlDays}
                        onTtlChange={setShareTtlDays}
                        onGenerate={handleShare}
                        loading={shareLoading}
                        copied={shareCopied}
                        onCopy={handleCopy}
                        error={shareError}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

function StatTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="rounded-2xl backdrop-blur-sm px-4 py-3" style={{ background: 'rgba(255,255,255,0.14)' }}>
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide opacity-90">
                {icon}
                {label}
            </div>
            <div className="mt-1 text-2xl font-black leading-none">{value}</div>
        </div>
    );
}

function BookingSummarySection({
    title,
    icon,
    children,
}: {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <section
            className="rounded-3xl border p-5"
            style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
        >
            <header className="flex items-center gap-2 mb-3">
                <div
                    className="w-9 h-9 rounded-2xl flex items-center justify-center"
                    style={{ background: 'var(--surface)', color: 'var(--primary)' }}
                >
                    {icon}
                </div>
                <h2 className="text-lg font-bold">{title}</h2>
            </header>
            <div className="space-y-2">{children}</div>
        </section>
    );
}

function SummaryRow({
    title,
    subtitle,
    extra,
    price,
    currency,
}: {
    title: string;
    subtitle: string | null;
    extra?: string | null;
    price?: number | null;
    currency?: string | null;
}) {
    return (
        <div
            className="flex flex-wrap items-center justify-between gap-3 px-3 py-3 rounded-2xl"
            style={{ background: 'var(--surface)' }}
        >
            <div className="min-w-0">
                <div className="text-sm font-bold truncate">{title}</div>
                {subtitle && (
                    <div className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                        {subtitle}
                    </div>
                )}
                {extra && (
                    <div className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                        {extra}
                    </div>
                )}
            </div>
            {price != null && (
                <div className="text-sm font-bold whitespace-nowrap" style={{ color: 'var(--primary)' }}>
                    {price} {currency ?? 'EUR'}
                </div>
            )}
        </div>
    );
}

function DayTimeline({ day }: { day: Extract<RecapSection, { type: 'day' }> }) {
    return (
        <div
            className="rounded-3xl border p-5"
            style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
        >
            <header className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">
                    Jour {day.day_index}
                    {day.date && (
                        <span className="ml-2 text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>
                            · {day.date}
                        </span>
                    )}
                </h2>
                <span
                    className="px-3 py-1 rounded-full text-xs font-bold"
                    style={{ background: 'var(--surface)' }}
                >
                    {day.activities.length} activité{day.activities.length > 1 ? 's' : ''}
                </span>
            </header>
            {day.activities.length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    Aucune activité programmée ce jour-là.
                </p>
            ) : (
                <ol className="relative pl-6 space-y-3">
                    <div
                        aria-hidden
                        className="absolute left-2 top-2 bottom-2 w-px"
                        style={{ background: 'var(--border)' }}
                    />
                    {day.activities.map((act, idx) => (
                        <li key={act.id} className="relative">
                            <span
                                className="absolute -left-[22px] top-3 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black"
                                style={{
                                    background: 'var(--primary)',
                                    color: '#fff',
                                    boxShadow: '0 0 0 3px var(--card)',
                                }}
                            >
                                {idx + 1}
                            </span>
                            <motion.div
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.04 }}
                                className="rounded-2xl p-4 ml-2"
                                style={{ background: 'var(--surface)' }}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="text-sm font-bold">{act.title}</div>
                                        <div
                                            className="mt-1 flex flex-wrap items-center gap-3 text-xs"
                                            style={{ color: 'var(--muted-foreground)' }}
                                        >
                                            {act.city && (
                                                <span className="inline-flex items-center gap-1">
                                                    <MapPin size={12} /> {act.city}
                                                    {act.country ? `, ${act.country}` : ''}
                                                </span>
                                            )}
                                            {act.duration != null && (
                                                <span className="inline-flex items-center gap-1">
                                                    <Clock size={12} /> {act.duration} min
                                                </span>
                                            )}
                                            {act.cost != null && (
                                                <span className="inline-flex items-center gap-1">
                                                    <Wallet size={12} /> {act.cost} €
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <LikedBadge state={act.liked_state ?? 'neutral'} />
                                </div>
                            </motion.div>
                        </li>
                    ))}
                </ol>
            )}
        </div>
    );
}

function LikedBadge({ state }: { state: 'liked' | 'disliked' | 'neutral' }) {
    if (state === 'liked') {
        return (
            <span
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold uppercase"
                style={{ background: 'rgba(34,197,94,0.12)', color: 'rgb(22,163,74)' }}
            >
                <ThumbsUp size={12} /> Aimé
            </span>
        );
    }
    if (state === 'disliked') {
        return (
            <span
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold uppercase"
                style={{ background: 'rgba(244,63,94,0.12)', color: 'rgb(190,18,60)' }}
            >
                <ThumbsDown size={12} /> Pas aimé
            </span>
        );
    }
    return null;
}

function ShareModal({
    onClose,
    shareUrl,
    ttlDays,
    onTtlChange,
    onGenerate,
    loading,
    copied,
    onCopy,
    error,
}: {
    onClose: () => void;
    shareUrl: string | null;
    ttlDays: number;
    onTtlChange: (v: number) => void;
    onGenerate: () => void;
    loading: boolean;
    copied: boolean;
    onCopy: () => void;
    error: string | null;
}) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.45)' }}
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md rounded-3xl p-6 relative"
                style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
            >
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[var(--surface-hover)]"
                    aria-label="Fermer"
                >
                    <X size={16} />
                </button>
                <h3 className="text-xl font-black mb-1">Partager ce voyage</h3>
                <p className="text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>
                    Génère un lien public en lecture seule. Aucune information personnelle n'est partagée.
                </p>

                <label className="block text-xs font-bold uppercase tracking-wide mb-2">Durée de validité</label>
                <div className="flex gap-2 mb-4">
                    {[7, 30, 90].map((d) => (
                        <button
                            key={d}
                            type="button"
                            onClick={() => onTtlChange(d)}
                            className={cn(
                                'px-3 py-1.5 rounded-full text-xs font-bold',
                                ttlDays === d
                                    ? 'bg-[var(--primary)] text-white'
                                    : 'bg-[var(--surface)] hover:bg-[var(--surface-hover)]',
                            )}
                        >
                            {d} jours
                        </button>
                    ))}
                </div>

                {error && (
                    <div className="mb-3 text-xs px-3 py-2 rounded-xl" style={{ background: 'rgba(244,63,94,0.1)', color: 'rgb(190,18,60)' }}>
                        {error}
                    </div>
                )}

                {!shareUrl ? (
                    <button
                        type="button"
                        onClick={onGenerate}
                        disabled={loading}
                        className="btn-primary py-2.5 px-4 text-sm w-full"
                    >
                        {loading ? 'Génération…' : 'Générer le lien'}
                    </button>
                ) : (
                    <div>
                        <div
                            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs break-all"
                            style={{ background: 'var(--surface)' }}
                        >
                            <span className="flex-1 min-w-0">{shareUrl}</span>
                            <button
                                type="button"
                                onClick={onCopy}
                                className="btn-secondary py-1.5 px-2 text-xs"
                            >
                                {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                                {copied ? 'Copié' : 'Copier'}
                            </button>
                        </div>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
}

function formatRange(start: string | null, end: string | null): string | null {
    if (!start && !end) return null;
    if (start && end) return `${start.slice(0, 16).replace('T', ' ')} → ${end.slice(0, 16).replace('T', ' ')}`;
    return (start ?? end ?? '').slice(0, 16).replace('T', ' ');
}
