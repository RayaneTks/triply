'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Plane, 
    Hotel, 
    Calendar, 
    Users, 
    ArrowLeft, 
    MapPin, 
    Clock, 
    CreditCard, 
    ExternalLink,
    CheckCircle2,
    ChevronRight
} from 'lucide-react';
import { Sidebar } from '@/src/components/Sidebar/Sidebar';
import { Header } from '@/src/components/Header/Header';
import { clearSession, getStoredSession, me, type AuthUser } from '@/src/lib/auth-client';
import { getTrip, type TripSummary } from '@/src/lib/trips-client';
import { useTripMap } from '@/src/hooks/useTripMap';

// Import dynamique de la carte pour la performance
const WorldMap = dynamic(() => import('@/src/components/Map/Map').then(m => m.WorldMap), { 
    ssr: false,
    loading: () => <div className="h-full w-full bg-[#020617] animate-pulse" />
});

const formatShortDate = (dateStr: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

const formatTime = (iso: string | undefined) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};

export default function VoyageDetailPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = params?.id as string;
    const justValidated = searchParams.get('validated') === '1';

    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
    const [isConnected, setIsConnected] = useState(false);
    const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [trip, setTrip] = useState<TripSummary | null>(null);
    const [selectedDay, setSelectedDay] = useState(1);

    const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';

    useEffect(() => {
        const load = async () => {
            const session = getStoredSession();
            if (!session?.token) {
                router.replace('/');
                return;
            }
            try {
                const user = await me(session.token);
                setCurrentUser(user);
                setIsConnected(true);
                const item = await getTrip(session.token, id);
                setTrip(item);
            } catch (err: any) {
                setError(err.message || 'Erreur lors du chargement.');
            } finally {
                setLoading(false);
            }
        };
        if (id) void load();
    }, [id, router]);

    // Préparation des données pour useTripMap
    const dayActivitiesByDay = useMemo(() => {
        const map: Record<number, any[]> = {};
        if (trip?.plan_snapshot?.days) {
            trip.plan_snapshot.days.forEach(d => {
                map[d.dayIndex] = d.activities.map(a => ({
                    lngLat: { lng: a.lng, lat: a.lat },
                    properties: { name: a.title },
                    layer: { id: a.layerId || 'poi' }
                }));
            });
        }
        return map;
    }, [trip]);

    const {
        mapStyle, mapConfig, mapPitch,
        mapLocationsWithDayActivities
    } = useTripMap({
        mapboxToken: MAPBOX_TOKEN,
        selectedDay,
        wizardView: 'activity',
        dayActivitiesByDay,
        legTransportByDay: {} // Simplifié pour le détail
    });

    const flight = trip?.plan_snapshot?.flightSummary;
    const hotel = trip?.plan_snapshot?.hotelSummary;

    if (loading) return <div className="h-screen w-full bg-[#020617] flex items-center justify-center"><Plane className="text-cyan-500 animate-bounce" size={48} /></div>;

    return (
        <div className="flex h-dvh w-full overflow-hidden bg-[#020617] text-slate-100 lg:flex-row">
            <Sidebar
                isCollapsed={isSidebarCollapsed}
                onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                isConnected={isConnected}
                onLoginClick={() => router.push('/')}
                onLogoutClick={() => { clearSession(); router.push('/'); }}
            />

            <div className="relative flex flex-1 flex-col overflow-hidden">
                <Header 
                    user={currentUser}
                    isConnected={isConnected}
                    onLoginClick={() => router.push('/')}
                    onLogoutClick={() => { clearSession(); router.push('/'); }}
                    isSidebarCollapsed={isSidebarCollapsed}
                />

                <main className="relative mt-16 flex flex-1 overflow-hidden flex-col lg:flex-row">
                    {/* Left Scrollable Panel */}
                    <div className="z-40 flex w-full flex-col border-r border-white/10 bg-[#020617]/80 backdrop-blur-xl lg:w-[420px] overflow-y-auto scrollbar-hide">
                        <div className="p-6 md:p-8 space-y-8">
                            {/* Header Info */}
                            <div>
                                <Link href="/voyages" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest hover:text-white transition-colors mb-4">
                                    <ArrowLeft size={14} /> Tous mes voyages
                                </Link>
                                <h1 className="text-3xl font-bold text-white font-chillax tracking-tight leading-tight">{trip?.title}</h1>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-[10px] font-bold uppercase tracking-wider border border-cyan-500/20 flex items-center gap-1.5">
                                        <Calendar size={12} /> {formatShortDate(trip?.start_date || '')} — {formatShortDate(trip?.end_date || '')}
                                    </span>
                                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/20 flex items-center gap-1.5">
                                        <CheckCircle2 size={12} /> {trip?.status}
                                    </span>
                                </div>
                            </div>

                            {justValidated && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex gap-3">
                                    <CheckCircle2 className="text-emerald-400 shrink-0" size={20} />
                                    <p className="text-xs text-emerald-100 leading-relaxed">Votre voyage est prêt ! Explorez votre itinéraire jour par jour ci-dessous.</p>
                                </motion.div>
                            )}

                            {/* Essential Cards */}
                            <div className="grid grid-cols-1 gap-4">
                                {/* Flight Card */}
                                {flight && (
                                    <div className="p-5 rounded-3xl border border-white/10 bg-white/5 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-widest">
                                                <Plane size={16} /> Vol
                                            </div>
                                            {flight.bookingUrl && (
                                                <a href={flight.bookingUrl} target="_blank" className="text-slate-500 hover:text-white transition-colors"><ExternalLink size={14} /></a>
                                            )}
                                        </div>
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <p className="text-lg font-bold text-white">{flight.carrier}</p>
                                                <p className="text-xs text-slate-400 font-medium mt-1">{flight.originIata} <ChevronRight size={10} className="inline mx-1" /> {flight.destinationIata}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-black text-emerald-400">{flight.price} {flight.currency}</p>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Confirmé</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Hotel Card */}
                                {hotel && (
                                    <div className="p-5 rounded-3xl border border-white/10 bg-white/5 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-widest">
                                                <Hotel size={16} /> Hébergement
                                            </div>
                                            {hotel.bookingUrl && (
                                                <a href={hotel.bookingUrl} target="_blank" className="text-slate-500 hover:text-white transition-colors"><ExternalLink size={14} /></a>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-lg font-bold text-white truncate">{hotel.name}</p>
                                            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-400">
                                                <MapPin size={12} className="text-emerald-500/70" />
                                                <span className="truncate">{hotel.address || hotel.cityName}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Daily Itinerary */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-white uppercase tracking-widest">Planning Journalier</h3>
                                    <span className="text-[10px] font-bold text-slate-500">{trip?.plan_snapshot?.days?.length} Jours</span>
                                </div>

                                <div className="space-y-4">
                                    {trip?.plan_snapshot?.days?.map((day) => (
                                        <div key={day.dayIndex} className="relative">
                                            <button 
                                                onClick={() => setSelectedDay(day.dayIndex)}
                                                className={`w-full text-left p-5 rounded-3xl border transition-all ${selectedDay === day.dayIndex ? 'bg-cyan-500/10 border-cyan-500/30 ring-1 ring-cyan-500/20' : 'bg-white/5 border-white/5 hover:border-white/10'}`}
                                            >
                                                <div className="flex items-center justify-between mb-4">
                                                    <span className={`text-sm font-bold ${selectedDay === day.dayIndex ? 'text-cyan-400' : 'text-slate-400'}`}>Jour {day.dayIndex}</span>
                                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                                        <MapPin size={10} /> {day.activities.length} Lieux
                                                    </div>
                                                </div>
                                                
                                                <div className="space-y-3">
                                                    {day.activities.map((a, i) => (
                                                        <div key={i} className="flex items-start gap-3">
                                                            <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-xs font-bold text-white truncate">{a.title}</p>
                                                                {a.durationHours && <p className="text-[10px] text-slate-500 mt-0.5">Durée estimée : {a.durationHours}h</p>}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Map View */}
                    <div className="relative flex-1 h-[400px] lg:h-full">
                        <WorldMap
                            accessToken={MAPBOX_TOKEN}
                            initialLatitude={46.6}
                            initialLongitude={1.8}
                            initialZoom={5}
                            mapStyle={mapStyle}
                            mapConfig={mapConfig}
                            pitch={mapPitch}
                            locations={mapLocationsWithDayActivities}
                        />
                        
                        {/* Day Selector Overlay on Map */}
                        <div className="absolute top-6 left-6 z-30 flex gap-2">
                            {trip?.plan_snapshot?.days?.map((day) => (
                                <button
                                    key={day.dayIndex}
                                    onClick={() => setSelectedDay(day.dayIndex)}
                                    className={`h-10 w-10 flex items-center justify-center rounded-xl border font-bold text-sm transition-all ${selectedDay === day.dayIndex ? 'bg-cyan-500 text-white border-cyan-400 shadow-lg shadow-cyan-900/40 scale-110' : 'bg-[#020617]/80 text-slate-400 border-white/10 backdrop-blur-md hover:bg-white/10'}`}
                                >
                                    {day.dayIndex}
                                </button>
                            ))}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
