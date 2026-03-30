'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, Calendar, Clock3, FolderClock, MapPin, Plus, Sparkles } from 'lucide-react';
import { AppShell } from '@/src/components/AppShell/AppShell';
import { ContextSummaryCard } from '@/src/components/GuidedUI/ContextSummaryCard';
import { EmptyStateAction } from '@/src/components/GuidedUI/EmptyStateAction';
import { InlineStatus } from '@/src/components/GuidedUI/InlineStatus';
import { clearSession, getStoredSession, type AuthUser } from '@/src/lib/auth-client';
import { listTrips, type TripSummary } from '@/src/lib/trips-client';

const parseAmount = (value: unknown): number => {
    const parsed = Number.parseFloat(String(value ?? '').replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : 0;
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

const formatShortDate = (dateStr: string) => {
    const parsed = parseTripDate(dateStr);
    if (!parsed) return 'A definir';
    return parsed.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
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

const getTripCity = (trip: TripSummary): string => {
    return trip.plan_snapshot?.destinationSummary?.cityName || trip.plan_snapshot?.hotelSummary?.cityName || trip.destination || 'Destination';
};

const getTripTitle = (trip: TripSummary): string => {
    const city = getTripCity(trip);
    const airport = (trip.plan_snapshot?.destinationSummary?.airportName || '').trim();
    return airport && airport.toLowerCase() !== city.toLowerCase() ? `${city} - ${airport}` : city;
};

const getUserFacingStatus = (trip: TripSummary): string => {
    const raw = String(trip.status || '').toLowerCase();
    const endDate = parseTripDate(trip.end_date);
    const now = new Date();

    if (raw.includes('draft') || raw.includes('brouillon') || raw.includes('pending')) return 'A continuer';
    if (raw.includes('ready') || raw.includes('review') || raw.includes('validate')) return 'Pret a valider';
    if (raw.includes('confirm') || raw.includes('valid')) return 'Confirme';
    if (raw.includes('done') || raw.includes('finished') || raw.includes('archiv') || raw.includes('termine')) return 'Termine';
    if (endDate && endDate < now) return 'Termine';
    return 'A continuer';
};

const isArchivedTrip = (trip: TripSummary): boolean => getUserFacingStatus(trip) === 'Termine';

function TripCard({ trip, compact = false }: { trip: TripSummary; compact?: boolean }) {
    const budget = getComputedBudget(trip);
    const statusLabel = getUserFacingStatus(trip);

    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <Link
                href={`/voyages/${trip.id}`}
                className={`group flex h-full flex-col rounded-[1.9rem] border border-[var(--app-border)] bg-white/82 p-5 shadow-[var(--shadow-sm)] transition-all hover:-translate-y-1 hover:bg-white hover:shadow-[var(--shadow-md)] ${compact ? '' : ''}`}
            >
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--app-muted)]">{statusLabel}</p>
                        <h3 className="mt-2 truncate text-xl font-semibold text-[color:var(--foreground)]">{getTripTitle(trip)}</h3>
                    </div>
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--app-brand-soft)] text-[color:var(--primary)]">
                        <ArrowRight size={18} />
                    </div>
                </div>

                <div className="mt-5 space-y-3 text-sm text-[color:var(--app-muted)]">
                    <div className="flex items-center gap-2">
                        <MapPin size={16} />
                        <span>{getTripCity(trip)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar size={16} />
                        <span>{`${formatShortDate(trip.start_date)} -> ${formatShortDate(trip.end_date)}`}</span>
                    </div>
                </div>

                <div className="mt-6 rounded-[1.5rem] bg-[var(--app-brand-soft)] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--app-muted)]">Budget estime</p>
                    <p className="mt-2 text-2xl font-semibold text-[color:var(--foreground)]">
                        {Math.round(budget.amount)} {budget.currency}
                    </p>
                </div>
            </Link>
        </motion.div>
    );
}

export default function VoyagesPage() {
    const router = useRouter();
    const [isConnected, setIsConnected] = useState(false);
    const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [trips, setTrips] = useState<TripSummary[]>([]);

    useEffect(() => {
        let active = true;

        const load = async () => {
            const session = getStoredSession();
            if (!session?.token) {
                setIsConnected(false);
                setLoading(false);
                return;
            }

            try {
                setIsConnected(true);
                setCurrentUser(session.user);
                const items = await listTrips(session.token);
                if (active) setTrips(items);
            } catch (err) {
                if (active) {
                    const message = err instanceof Error ? err.message : 'Impossible de recuperer les voyages.';
                    setError(message);
                }
            } finally {
                if (active) setLoading(false);
            }
        };

        void load();
        return () => {
            active = false;
        };
    }, []);

    const sortedTrips = useMemo(() => {
        return [...trips].sort((a, b) => {
            const aTime = parseTripDate(a.updated_at || a.created_at || a.start_date)?.getTime() || 0;
            const bTime = parseTripDate(b.updated_at || b.created_at || b.start_date)?.getTime() || 0;
            return bTime - aTime;
        });
    }, [trips]);

    const continueTrip = useMemo(
        () => sortedTrips.find((trip) => !isArchivedTrip(trip)) ?? sortedTrips[0] ?? null,
        [sortedTrips]
    );

    const recentTrips = useMemo(
        () => sortedTrips.filter((trip) => trip.id !== continueTrip?.id && !isArchivedTrip(trip)),
        [continueTrip?.id, sortedTrips]
    );

    const archivedTrips = useMemo(
        () => sortedTrips.filter((trip) => isArchivedTrip(trip)),
        [sortedTrips]
    );

    const handleLogout = () => {
        clearSession();
        router.push('/');
    };

    return (
        <AppShell
            activeTab="voyages"
            title="Mes voyages"
            subtitle="Reprendre, verifier, partir."
            user={currentUser}
            isConnected={isConnected}
            onLoginClick={() => router.push('/')}
            onLogoutClick={handleLogout}
        >
            {!loading && !isConnected ? (
                <EmptyStateAction
                    icon={<FolderClock size={30} />}
                    eyebrow="Connexion requise"
                    title="Retrouvez vos voyages sur tous vos appareils"
                    description="Connectez-vous pour reprendre un voyage."
                    action={
                        <button
                            type="button"
                            onClick={() => router.push('/')}
                            className="inline-flex min-h-12 items-center justify-center rounded-[1.25rem] bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition-colors hover:bg-[var(--secondary)]"
                        >
                            Me connecter
                        </button>
                    }
                />
            ) : null}

            {loading ? (
                <div className="space-y-5">
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
                        <div className="h-60 animate-pulse rounded-[1.9rem] border border-[var(--app-border)] bg-white/60" />
                        <div className="h-60 animate-pulse rounded-[1.9rem] border border-[var(--app-border)] bg-white/60" />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {[1, 2, 3].map((item) => (
                            <div key={item} className="h-52 animate-pulse rounded-[1.75rem] border border-[var(--app-border)] bg-white/50" />
                        ))}
                    </div>
                </div>
            ) : null}

            {!loading && isConnected ? (
                <div className="space-y-5">
                    <section className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
                        <ContextSummaryCard
                            eyebrow="Reprise rapide"
                            title={continueTrip ? 'Reprendre' : 'Mes voyages'}
                            description={
                                continueTrip
                                    ? 'Le bon voyage, au bon endroit.'
                                    : 'Vos voyages apparaitront ici.'
                            }
                            items={[
                                { label: 'A continuer', value: sortedTrips.filter((trip) => getUserFacingStatus(trip) === 'A continuer').length ? `${sortedTrips.filter((trip) => getUserFacingStatus(trip) === 'A continuer').length} voyage(s)` : 'Aucun' },
                                { label: 'Pret a valider', value: sortedTrips.filter((trip) => getUserFacingStatus(trip) === 'Pret a valider').length ? `${sortedTrips.filter((trip) => getUserFacingStatus(trip) === 'Pret a valider').length} voyage(s)` : 'Aucun' },
                                { label: 'Confirmes', value: sortedTrips.filter((trip) => getUserFacingStatus(trip) === 'Confirme').length ? `${sortedTrips.filter((trip) => getUserFacingStatus(trip) === 'Confirme').length} voyage(s)` : 'Aucun' },
                                { label: 'Termines', value: archivedTrips.length ? `${archivedTrips.length} voyage(s)` : 'Aucun' },
                            ]}
                        />

                        <section className="rounded-[1.9rem] border border-[var(--app-border)] bg-white/82 p-5 shadow-[var(--shadow-sm)]">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--app-muted)]">Action principale</p>
                            <h2 className="mt-2 text-2xl font-semibold text-[color:var(--foreground)]">
                                {continueTrip ? `Continuer ${getTripTitle(continueTrip)}` : 'Creer un premier voyage'}
                            </h2>
                            <p className="mt-3 text-sm leading-relaxed text-[color:var(--app-muted)]">
                                {continueTrip
                                    ? `${getUserFacingStatus(continueTrip)} - ${formatShortDate(continueTrip.start_date)} -> ${formatShortDate(continueTrip.end_date)}`
                                    : 'Demarrez un voyage puis revenez ici.'}
                            </p>
                            <div className="mt-6 flex flex-col gap-3">
                                {continueTrip ? (
                                    <Link
                                        href={`/voyages/${continueTrip.id}`}
                                        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[1.25rem] bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition-colors hover:bg-[var(--secondary)]"
                                    >
                                        <Clock3 size={16} />
                                        Continuer ce voyage
                                    </Link>
                                ) : null}
                                <Link
                                    href="/"
                                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[1.25rem] border border-[var(--app-border)] bg-white px-5 py-3 text-sm font-semibold text-[color:var(--foreground)] shadow-[var(--shadow-sm)] transition-colors hover:bg-[var(--app-brand-soft)]"
                                >
                                    <Plus size={16} />
                                    Creer un nouveau voyage
                                </Link>
                            </div>
                        </section>
                    </section>

                    {error ? <InlineStatus tone="error" message={error} className="w-full" /> : null}

                    {!error && sortedTrips.length === 0 ? (
                        <EmptyStateAction
                            icon={<Sparkles size={30} />}
                            eyebrow="Aucun voyage"
                            title="Votre espace est pret"
                            description="Demarrez un voyage depuis l accueil."
                            action={
                                <Link
                                    href="/"
                                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[1.25rem] bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition-colors hover:bg-[var(--secondary)]"
                                >
                                    Creer mon voyage
                                </Link>
                            }
                        />
                    ) : null}

                    {!error && continueTrip ? (
                        <section className="space-y-3">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--app-muted)]">A reprendre</p>
                                    <h2 className="mt-1 text-xl font-semibold text-[color:var(--foreground)]">En cours</h2>
                                </div>
                            </div>
                            <TripCard trip={continueTrip} />
                        </section>
                    ) : null}

                    {!error && recentTrips.length > 0 ? (
                        <section className="space-y-3">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--app-muted)]">Recents</p>
                                <h2 className="mt-1 text-xl font-semibold text-[color:var(--foreground)]">Autres voyages</h2>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {recentTrips.map((trip) => (
                                    <TripCard key={trip.id} trip={trip} compact />
                                ))}
                            </div>
                        </section>
                    ) : null}

                    {!error && archivedTrips.length > 0 ? (
                        <section className="space-y-3">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--app-muted)]">Archives</p>
                                <h2 className="mt-1 text-xl font-semibold text-[color:var(--foreground)]">Archives</h2>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {archivedTrips.map((trip) => (
                                    <TripCard key={trip.id} trip={trip} compact />
                                ))}
                            </div>
                        </section>
                    ) : null}
                </div>
            ) : null}
        </AppShell>
    );
}
