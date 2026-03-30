'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plane, Calendar, MapPin, CreditCard, ChevronRight, Plus, ArrowLeft } from 'lucide-react';
import { Sidebar } from '@/src/components/Sidebar/Sidebar';
import { Header } from '@/src/components/Header/Header';
import { clearSession, getStoredSession, type AuthUser } from '@/src/lib/auth-client';
import { listTrips, type TripSummary } from '@/src/lib/trips-client';

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

const formatShortDate = (dateStr: string) => {
    const parsed = parseTripDate(dateStr);
    if (!parsed) return '—';
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
    return airport && airport.toLowerCase() !== city.toLowerCase() ? `${city} | ${airport}` : city;
};

function statusBadge(status: string) {
    if (status === 'Termine') return <span className="px-2.5 py-1 rounded-md bg-white/10 text-slate-400 text-[10px] font-bold uppercase tracking-wider border border-white/5">{status}</span>;
    if (status === 'A venir') return <span className="px-2.5 py-1 rounded-md bg-cyan-500/20 text-cyan-400 text-[10px] font-bold uppercase tracking-wider border border-cyan-500/20">{status}</span>;
    return <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/20">{status}</span>;
}

export default function VoyagesPage() {
    const router = useRouter();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [trips, setTrips] = useState<TripSummary[]>([]);
    const [creationOrder, setCreationOrder] = useState<'desc' | 'asc'>('desc');

    useEffect(() => {
        let active = true;
        const load = async () => {
            const session = getStoredSession();
            if (!session?.token) {
                setIsConnected(false);
                router.replace('/');
                return;
            }
            try {
                setIsConnected(true);
                setCurrentUser(session.user);
                const items = await listTrips(session.token);
                if (active) setTrips(items);
            } catch (err) {
                if (active) {
                    const message = err instanceof Error ? err.message : undefined;
                    setError(message || 'Impossible de récupérer les voyages.');
                }
            } finally {
                if (active) setLoading(false);
            }
        };
        void load();
        return () => { active = false; };
    }, [router]);

    const sortedTrips = useMemo(() => {
        return [...trips].sort((a, b) => {
            const aTime = parseTripDate(a.created_at || a.start_date)?.getTime() || 0;
            const bTime = parseTripDate(b.created_at || b.start_date)?.getTime() || 0;
            return creationOrder === 'asc' ? aTime - bTime : bTime - aTime;
        });
    }, [trips, creationOrder]);

    const hasTrips = sortedTrips.length > 0;

    const handleLogout = () => {
        clearSession();
        setIsMobileSidebarOpen(false);
        router.push('/');
    };

    return (
        <div className="flex h-dvh w-full flex-col overflow-hidden bg-[#020617] text-slate-100 lg:flex-row">
            <Sidebar
                isCollapsed={isSidebarCollapsed}
                onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                isConnected={isConnected}
                onLoginClick={() => { setIsMobileSidebarOpen(false); router.push('/'); }}
                onLogoutClick={handleLogout}
                mobileOpen={isMobileSidebarOpen}
                onMobileClose={() => setIsMobileSidebarOpen(false)}
            />

            <div className="relative flex flex-1 flex-col overflow-hidden">
                <Header 
                    user={currentUser}
                    isConnected={isConnected}
                    onLoginClick={() => { setIsMobileSidebarOpen(false); router.push('/'); }}
                    onLogoutClick={handleLogout}
                    isSidebarCollapsed={isSidebarCollapsed}
                    onMenuClick={() => setIsMobileSidebarOpen(true)}
                />

                <main className="flex-1 overflow-y-auto mt-16 px-6 py-8 md:p-12">
                    <div className="mx-auto max-w-6xl">
                        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
                            <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors mb-6">
                                <ArrowLeft size={16} /> Retour au Dashboard
                            </Link>
                            
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                                <div>
                                    <h1 className="text-4xl font-bold text-white font-chillax tracking-tight">Mes Voyages</h1>
                                    <p className="mt-2 text-slate-400">Retrouvez l&apos;historique et les détails de vos aventures.</p>
                                </div>
                                
                                {!loading && !error && hasTrips && (
                                    <div className="flex items-center gap-3">
                                        <select
                                            value={creationOrder}
                                            onChange={(e) => setCreationOrder(e.target.value as 'desc' | 'asc')}
                                            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-500/50"
                                        >
                                            <option value="desc" className="bg-[#0f172a]">Plus récents</option>
                                            <option value="asc" className="bg-[#0f172a]">Plus anciens</option>
                                        </select>
                                        <Link href="/" className="flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-900/20 hover:bg-cyan-400 transition-all">
                                            <Plus size={16} /> Nouveau
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {loading && (
                            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                {[1, 2, 3].map(i => <div key={i} className="h-48 rounded-3xl bg-white/5 animate-pulse border border-white/5" />)}
                            </div>
                        )}

                        {!loading && error && (
                            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center text-red-400">
                                {error}
                            </div>
                        )}

                        {!loading && !error && hasTrips && (
                            <motion.div 
                                initial="hidden" animate="show"
                                variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
                                className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3"
                            >
                                {sortedTrips.map((trip) => (
                                    <motion.div key={trip.id} variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
                                        <Link href={`/voyages/${trip.id}`}>
                                            <article className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 transition-all hover:border-cyan-500/50 hover:bg-white/10 shadow-xl">
                                                <div className="flex items-start justify-between mb-6">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white group-hover:bg-cyan-500 group-hover:text-white transition-colors">
                                                            <MapPin size={20} />
                                                        </div>
                                                        <h3 className="text-lg font-bold text-white truncate">{getTripTitle(trip)}</h3>
                                                    </div>
                                                    {statusBadge(trip.status)}
                                                </div>

                                                <div className="flex-1 space-y-4">
                                                    <div className="flex items-center gap-3 text-sm text-slate-300">
                                                        <Calendar size={16} className="text-cyan-500/70" />
                                                        <span>{formatShortDate(trip.start_date)} <span className="text-slate-600 mx-1">→</span> {formatShortDate(trip.end_date)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-sm text-slate-300">
                                                        <Plane size={16} className="text-cyan-500/70" />
                                                        <span>{trip.travel_days} Jours {trip.flight?.carrier ? `• ${trip.flight.carrier}` : ''}</span>
                                                    </div>
                                                </div>

                                                <div className="mt-6 flex items-end justify-between border-t border-white/10 pt-4">
                                                    <div>
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Budget Total</span>
                                                        <div className="flex items-baseline gap-1">
                                                            <span className="text-2xl font-black text-emerald-400 font-chillax">{Math.round(getComputedBudget(trip).amount)}</span>
                                                            <span className="text-xs font-bold text-emerald-500/80">{getComputedBudget(trip).currency}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-slate-400 group-hover:bg-cyan-500 group-hover:text-white transition-all">
                                                        <ChevronRight size={16} />
                                                    </div>
                                                </div>
                                            </article>
                                        </Link>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}

                        {!loading && !error && !hasTrips && (
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/20 bg-white/5 py-24 text-center">
                                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/20 text-cyan-400">
                                    <Plane size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Aucun voyage prévu</h3>
                                <p className="text-slate-400 mb-8 max-w-md">Il est temps de planifier votre prochaine aventure. Laissez notre IA vous guider !</p>
                                <Link href="/" className="rounded-xl bg-cyan-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-900/20 hover:bg-cyan-400 transition-all active:scale-95">
                                    Créer mon premier voyage
                                </Link>
                            </motion.div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}