'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Utensils, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { authClient } from '../../lib/auth-client';

interface RestaurantItem {
    id: string | null;
    name: string;
    category: string;
    rank: number | null;
    tags: string[];
    lat: number;
    lng: number;
    distance_meters?: number;
}

interface NearbyRestaurantsResponse {
    success: boolean;
    data?: {
        items: RestaurantItem[];
        activity?: { city?: string | null } | null;
    };
    error?: { message?: string };
}

interface NearbyRestaurantsProps {
    activityId: string;
    activityTitle?: string;
}

const API_BASE_URL = (process.env.NEXT_PUBLIC_BACKEND_API_URL || '/api/v1').replace(/\/$/, '');

export function NearbyRestaurants({ activityId, activityTitle }: NearbyRestaurantsProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [items, setItems] = useState<RestaurantItem[] | null>(null);

    const loadRestaurants = async () => {
        const token = authClient.getToken();
        if (!token) {
            setError('Session expirée.');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const url = `${API_BASE_URL}/restaurants/nearby?activity_id=${encodeURIComponent(activityId)}&radius=800&limit=8`;
            const response = await fetch(url, {
                method: 'GET',
                headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
            });
            const payload = (await response.json().catch(() => null)) as NearbyRestaurantsResponse | null;
            if (!response.ok || !payload?.success) {
                throw new Error(payload?.error?.message ?? 'Impossible de charger les restaurants.');
            }
            setItems(payload.data?.items ?? []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur de chargement.');
        } finally {
            setLoading(false);
        }
    };

    const toggle = () => {
        const next = !open;
        setOpen(next);
        if (next && items === null && !loading) {
            void loadRestaurants();
        }
    };

    return (
        <div className="mt-2">
            <button
                type="button"
                onClick={toggle}
                className="inline-flex items-center gap-2 text-xs font-bold text-light-muted hover:text-brand transition-colors"
                aria-expanded={open}
            >
                <Utensils size={12} />
                Restaurants à proximité
                {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>

            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.18 }}
                        className="overflow-hidden"
                    >
                        <div className="mt-2 space-y-2">
                            {loading && (
                                <p className="text-[11px] text-light-muted">Recherche autour de {activityTitle ?? 'l\'activité'}…</p>
                            )}
                            {error && (
                                <p className="text-[11px] text-error">{error}</p>
                            )}
                            {!loading && !error && items && items.length === 0 && (
                                <p className="text-[11px] text-light-muted">
                                    Aucun restaurant trouvé à proximité.
                                </p>
                            )}
                            {!loading && items && items.length > 0 && (
                                <ul className="space-y-1.5">
                                    {items.map((r, idx) => (
                                        <li
                                            key={`${r.id ?? r.name}-${idx}`}
                                            className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-light-bg/40 border border-light-border"
                                        >
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold truncate">{r.name}</p>
                                                {r.tags && r.tags.length > 0 && (
                                                    <p className="text-[10px] text-light-muted truncate">
                                                        {r.tags.slice(0, 3).join(' · ')}
                                                    </p>
                                                )}
                                            </div>
                                            {typeof r.distance_meters === 'number' && (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-light-muted whitespace-nowrap">
                                                    <MapPin size={10} />
                                                    {r.distance_meters < 1000
                                                        ? `${r.distance_meters} m`
                                                        : `${(r.distance_meters / 1000).toFixed(1)} km`}
                                                </span>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
