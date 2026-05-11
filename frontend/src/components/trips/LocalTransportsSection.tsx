'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bus, Plus, Train, X, Car, Trash2 } from 'lucide-react';

import {
    localTransportsClient,
    type CreateLocalTransportPayload,
    type LocalTransport,
} from '../../lib/local-transports-client';
import { authClient } from '../../lib/auth-client';

interface LocalTransportsSectionProps {
    tripId: string;
}

const MODES: Array<{ value: string; label: string; icon: React.ReactNode }> = [
    { value: 'metro', label: 'Métro', icon: <Train size={14} /> },
    { value: 'bus', label: 'Bus', icon: <Bus size={14} /> },
    { value: 'taxi', label: 'Taxi', icon: <Car size={14} /> },
    { value: 'tram', label: 'Tram', icon: <Train size={14} /> },
    { value: 'autre', label: 'Autre', icon: <Bus size={14} /> },
];

export function LocalTransportsSection({ tripId }: LocalTransportsSectionProps) {
    const [items, setItems] = useState<LocalTransport[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [modalOpen, setModalOpen] = useState(false);

    const reload = useCallback(async () => {
        if (!authClient.getToken()) return;
        setLoading(true);
        setError(null);
        try {
            const data = await localTransportsClient.list(tripId);
            setItems(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur de chargement.');
        } finally {
            setLoading(false);
        }
    }, [tripId]);

    useEffect(() => {
        void reload();
    }, [reload]);

    const handleAdded = (transport: LocalTransport) => {
        setItems((cur) => [...cur, transport]);
        setModalOpen(false);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Supprimer ce transport local ?')) return;
        try {
            await localTransportsClient.delete(tripId, id);
            setItems((cur) => cur.filter((t) => t.id !== id));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Suppression impossible.');
        }
    };

    return (
        <section className="triply-card p-6 space-y-4">
            <header className="flex items-center justify-between gap-4">
                <div>
                    <h3 className="font-black text-lg">Transports locaux</h3>
                    <p className="text-xs text-light-muted">Métro, bus, taxi : ajoutez vos trajets sur place.</p>
                </div>
                <button
                    type="button"
                    onClick={() => setModalOpen(true)}
                    className="btn-primary py-2 px-3 text-xs"
                >
                    <Plus size={14} /> Ajouter
                </button>
            </header>

            {error && <p className="text-xs text-error">{error}</p>}
            {loading && <p className="text-xs text-light-muted">Chargement…</p>}

            {!loading && items.length === 0 && !error && (
                <p className="text-xs text-light-muted">Aucun transport local enregistré.</p>
            )}

            {items.length > 0 && (
                <ul className="space-y-2">
                    {items.map((t) => (
                        <li
                            key={t.id}
                            className="flex flex-wrap items-center justify-between gap-3 px-3 py-2 rounded-2xl bg-light-bg/40 border border-light-border"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <span
                                    className="w-8 h-8 rounded-full flex items-center justify-center"
                                    style={{ background: 'var(--surface)', color: 'var(--primary)' }}
                                >
                                    {MODES.find((m) => m.value === t.attributes.mode)?.icon ?? <Bus size={14} />}
                                </span>
                                <div className="min-w-0">
                                    <p className="text-sm font-bold truncate">
                                        {t.attributes.from} → {t.attributes.to}
                                    </p>
                                    <p className="text-xs text-light-muted">
                                        {t.attributes.mode.toUpperCase()}
                                        {t.attributes.departure_at &&
                                            ` · ${new Date(t.attributes.departure_at).toLocaleString('fr-FR', {
                                                dateStyle: 'short',
                                                timeStyle: 'short',
                                            })}`}
                                        {t.attributes.price != null &&
                                            ` · ${t.attributes.price} ${t.attributes.currency ?? 'EUR'}`}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleDelete(t.id)}
                                aria-label="Supprimer ce transport"
                                className="w-8 h-8 rounded-full flex items-center justify-center text-light-muted hover:text-error hover:bg-red-50 transition-colors"
                            >
                                <Trash2 size={14} />
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            <AnimatePresence>
                {modalOpen && (
                    <AddLocalTransportModal
                        tripId={tripId}
                        onClose={() => setModalOpen(false)}
                        onCreated={handleAdded}
                    />
                )}
            </AnimatePresence>
        </section>
    );
}

interface AddLocalTransportModalProps {
    tripId: string;
    onClose: () => void;
    onCreated: (transport: LocalTransport) => void;
}

function AddLocalTransportModal({ tripId, onClose, onCreated }: AddLocalTransportModalProps) {
    const [type, setType] = useState<string>('metro');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [departureAt, setDepartureAt] = useState('');
    const [price, setPrice] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!from.trim() || !to.trim()) {
            setError('Précisez le départ et l\'arrivée.');
            return;
        }
        setSubmitting(true);
        setError(null);
        const payload: CreateLocalTransportPayload = {
            type,
            from: from.trim(),
            to: to.trim(),
            departure_at: departureAt ? new Date(departureAt).toISOString() : null,
            price: price ? Number(price) : null,
            currency: price ? 'EUR' : null,
        };
        try {
            const created = await localTransportsClient.create(tripId, payload);
            onCreated(created);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Impossible d'ajouter le transport.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.45)' }}
            onClick={onClose}
        >
            <motion.form
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                onSubmit={handleSubmit}
                className="w-full max-w-md rounded-3xl p-6 space-y-4 relative"
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
                <h3 className="text-xl font-black">Ajouter un transport local</h3>

                <div>
                    <label className="block text-xs font-bold uppercase tracking-wide mb-2">Type</label>
                    <div className="flex flex-wrap gap-2">
                        {MODES.map((m) => (
                            <button
                                key={m.value}
                                type="button"
                                onClick={() => setType(m.value)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                                    type === m.value
                                        ? 'bg-[var(--primary)] text-white'
                                        : 'bg-[var(--surface)] hover:bg-[var(--surface-hover)]'
                                }`}
                            >
                                {m.icon}
                                {m.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <label className="block text-xs font-bold uppercase tracking-wide">
                        Départ
                        <input
                            value={from}
                            onChange={(e) => setFrom(e.target.value)}
                            placeholder="Châtelet"
                            className="mt-1 w-full rounded-xl px-3 py-2 text-sm font-medium normal-case"
                            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                        />
                    </label>
                    <label className="block text-xs font-bold uppercase tracking-wide">
                        Arrivée
                        <input
                            value={to}
                            onChange={(e) => setTo(e.target.value)}
                            placeholder="Louvre"
                            className="mt-1 w-full rounded-xl px-3 py-2 text-sm font-medium normal-case"
                            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                        />
                    </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <label className="block text-xs font-bold uppercase tracking-wide">
                        Heure de départ
                        <input
                            type="datetime-local"
                            value={departureAt}
                            onChange={(e) => setDepartureAt(e.target.value)}
                            className="mt-1 w-full rounded-xl px-3 py-2 text-sm font-medium"
                            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                        />
                    </label>
                    <label className="block text-xs font-bold uppercase tracking-wide">
                        Prix (€)
                        <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder="2.10"
                            className="mt-1 w-full rounded-xl px-3 py-2 text-sm font-medium"
                            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                        />
                    </label>
                </div>

                {error && <p className="text-xs text-error">{error}</p>}

                <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={onClose} className="btn-secondary py-2 px-3 text-xs">
                        Annuler
                    </button>
                    <button type="submit" disabled={submitting} className="btn-primary py-2 px-3 text-xs">
                        {submitting ? 'Ajout…' : 'Ajouter'}
                    </button>
                </div>
            </motion.form>
        </motion.div>
    );
}
