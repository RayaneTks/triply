'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/src/components/Sidebar/Sidebar';
import { clearSession, getStoredSession } from '@/src/lib/auth-client';
import { listTrips, type TripSummary } from '@/src/lib/trips-client';

const formatShortDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(`${dateStr}T12:00:00`).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
};

const PlaneIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.5c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2L8 14l3-3 5.5 4.5c1.5 1.5 2 3.5 1.5 4.5-.5 1-2.5 1.5-4.5 0L17.8 19.2Z" />
    </svg>
);

const ChevronIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m9 18 6-6-6-6" />
    </svg>
);

function statusStyle(status: string): { backgroundColor: string; color: string } {
    if (status === 'Termine') {
        return {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            color: 'rgba(255, 255, 255, 0.7)',
        };
    }

    if (status === 'A venir') {
        return {
            backgroundColor: 'rgba(0, 150, 199, 0.2)',
            color: 'var(--primary)',
        };
    }

    return {
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        color: '#22c55e',
    };
}

export default function VoyagesPage() {
    const router = useRouter();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [trips, setTrips] = useState<TripSummary[]>([]);

    useEffect(() => {
        let active = true;

        const loadTrips = async () => {
            const session = getStoredSession();
            if (!session?.token) {
                router.replace('/');
                return;
            }

            try {
                setLoading(true);
                setError('');
                const items = await listTrips(session.token);
                if (active) {
                    setTrips(items);
                }
            } catch (err) {
                if (active) {
                    setError(err instanceof Error ? err.message : 'Impossible de recuperer les voyages.');
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        void loadTrips();
        return () => {
            active = false;
        };
    }, [router]);

    const hasTrips = useMemo(() => trips.length > 0, [trips]);

    return (
        <div className="flex h-[100dvh] min-h-0 overflow-hidden w-full" style={{ backgroundColor: 'var(--background, #222222)' }}>
            <Sidebar
                isCollapsed={isSidebarCollapsed}
                onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                isConnected={true}
                onLoginClick={() => router.push('/')}
                onLogoutClick={() => {
                    clearSession();
                    router.push('/');
                }}
            />

            <main className="flex-1 overflow-y-auto min-w-0">
                <div className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8 lg:p-12">
                    <div className="flex items-center gap-4 mb-8">
                        <Link
                            href="/"
                            className="text-sm font-medium hover:underline"
                            style={{ color: 'rgba(255, 255, 255, 0.7)' }}
                        >
                            {'<- Retour a l accueil'}
                        </Link>
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: 'var(--foreground)', fontFamily: 'var(--font-title)' }}>
                        Mes voyages
                    </h1>
                    <p className="mb-10" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                        Consultez et gerez tous vos voyages
                    </p>

                    {loading && (
                        <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            Chargement des voyages...
                        </p>
                    )}

                    {!loading && error && (
                        <div
                            className="rounded-2xl p-6 mb-6"
                            style={{
                                backgroundColor: 'rgba(255, 0, 0, 0.08)',
                                border: '1px solid rgba(255, 0, 0, 0.25)',
                                color: '#ffb3b3',
                            }}
                        >
                            {error}
                        </div>
                    )}

                    {!loading && !error && hasTrips && (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {trips.map((trip) => (
                                <Link key={trip.id} href={`/voyages/${trip.id}`}>
                                    <article
                                        className="rounded-2xl p-5 h-full cursor-pointer transition-all hover:border-[var(--primary)] hover:bg-white/5"
                                        style={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                        }}
                                    >
                                        <div className="flex items-start justify-between gap-3 mb-3">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className="flex-shrink-0" style={{ color: 'var(--primary)' }}>
                                                    <PlaneIcon />
                                                </span>
                                                <span className="font-semibold truncate" style={{ color: 'var(--foreground)' }}>
                                                    {trip.title || trip.destination}
                                                </span>
                                            </div>
                                            <span
                                                className="flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium"
                                                style={statusStyle(trip.status)}
                                            >
                                                {trip.status}
                                            </span>
                                        </div>

                                        <p className="text-sm mb-2" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                            {formatShortDate(trip.start_date)} - {formatShortDate(trip.end_date)}
                                        </p>

                                        <p className="text-sm mb-3" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                            {trip.travel_days} jours{trip.flight?.carrier ? ` - ${trip.flight.carrier}` : ''}
                                        </p>

                                        <div className="flex items-center justify-between">
                                            <span className="font-bold" style={{ color: 'var(--primary)' }}>
                                                {trip.budget_total} {trip.currency}
                                            </span>
                                            <span className="flex items-center gap-1" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                                                Voir le detail
                                                <ChevronIcon />
                                            </span>
                                        </div>
                                    </article>
                                </Link>
                            ))}
                        </div>
                    )}

                    {!loading && !error && !hasTrips && (
                        <div
                            className="rounded-2xl p-12 text-center"
                            style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                            }}
                        >
                            <p className="mb-4" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                Aucun voyage pour le moment
                            </p>
                            <Link href="/">
                                <span className="font-medium" style={{ color: 'var(--primary)' }}>
                                    Creer un voyage -&gt;
                                </span>
                            </Link>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
