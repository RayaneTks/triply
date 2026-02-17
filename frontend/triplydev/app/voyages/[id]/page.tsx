'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Sidebar } from '@/src/components/Sidebar/Sidebar';
import { Button } from '@/src/components/Button/Button';
import { clearSession, getStoredSession } from '@/src/lib/auth-client';
import { getTrip, type TripSummary } from '@/src/lib/trips-client';

const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(`${dateStr}T12:00:00`).toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
};

export default function VoyageDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;

    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [trip, setTrip] = useState<TripSummary | null>(null);

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
        <div className="flex h-[100dvh] min-h-0 overflow-hidden w-full" style={{ backgroundColor: 'var(--background, #222222)' }}>
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
                <div className="max-w-2xl mx-auto p-4 sm:p-6 md:p-8 lg:p-12">
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
                            <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: 'var(--foreground)', fontFamily: 'var(--font-title)' }}>
                                {trip.title}
                            </h1>
                            <p className="mb-10" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                Destination: {trip.destination}
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
                                            {trip.budget_total} {trip.currency}
                                        </p>
                                    </div>
                                </div>
                            </section>

                            <section className="mb-8">
                                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
                                    Transport
                                </h3>
                                <div
                                    className="rounded-2xl p-6"
                                    style={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                    }}
                                >
                                    <p className="font-medium" style={{ color: 'var(--foreground)' }}>
                                        {trip.flight?.carrier || 'Aucun transport renseigne'}
                                    </p>
                                    <p className="text-sm mt-1" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                        Prix: {trip.flight?.price ?? '-'} {trip.currency}
                                    </p>
                                </div>
                            </section>

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
