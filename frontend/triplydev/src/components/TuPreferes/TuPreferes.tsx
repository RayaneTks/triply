'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/src/components/Button/Button';

export const PREFERENCES_STORAGE_KEY = 'triply-user-preferences';

export interface PreferencePair {
    id: string;
    left: { value: string; label: string; emoji: string };
    right: { value: string; label: string; emoji: string };
}

const PREFERENCE_PAIRS: PreferencePair[] = [
    { id: 'env', left: { value: 'plage', label: 'Plage', emoji: '🏖️' }, right: { value: 'montagne', label: 'Montagne', emoji: '⛰️' } },
    { id: 'cadre', left: { value: 'ville', label: 'Ville', emoji: '🏙️' }, right: { value: 'campagne', label: 'Campagne', emoji: '🌾' } },
    { id: 'rythme', left: { value: 'aventure', label: 'Aventure', emoji: '🧗' }, right: { value: 'detente', label: 'Détente', emoji: '🛋️' } },
    { id: 'budget', left: { value: 'budget', label: 'Budget', emoji: '💰' }, right: { value: 'luxe', label: 'Luxe', emoji: '✨' } },
];

export interface TuPreferesProps {
    visible: boolean;
    onComplete: (preferences: string[]) => void;
    onSkip: () => void;
}

export function TuPreferes({ visible, onComplete, onSkip }: TuPreferesProps) {
    const [selections, setSelections] = useState<Record<string, string>>({});

    const handleSelect = (pairId: string, value: string) => {
        setSelections((prev) => ({ ...prev, [pairId]: value }));
    };

    const handleValidate = () => {
        const prefs = Object.values(selections).filter(Boolean);
        if (typeof window !== 'undefined') {
            window.localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(prefs));
        }
        onComplete(prefs);
    };

    const handleSkip = () => {
        if (typeof window !== 'undefined') {
            window.localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify([]));
        }
        onSkip();
    };

    const selectedCount = Object.keys(selections).length;

    if (!visible) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
                style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="w-full max-w-lg rounded-2xl overflow-hidden"
                    style={{
                        backgroundColor: 'var(--background, #222222)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        boxShadow: '0 24px 48px rgba(0, 0, 0, 0.5)',
                    }}
                >
                    <div className="p-6 pb-4 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                        <h2 className="text-xl font-semibold" style={{ color: 'var(--foreground)' }}>
                            Tu préfères ?
                        </h2>
                        <p className="text-sm mt-1" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                            Aide-nous à personnaliser tes recommandations (optionnel)
                        </p>
                    </div>

                    <div className="p-6 space-y-4">
                        {PREFERENCE_PAIRS.map((pair) => (
                            <div key={pair.id} className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => handleSelect(pair.id, pair.left.value)}
                                    className="flex-1 flex flex-col items-center justify-center gap-1 p-4 rounded-xl transition-all border-2 min-h-[80px]"
                                    style={{
                                        backgroundColor: selections[pair.id] === pair.left.value ? 'rgba(0, 150, 199, 0.2)' : 'rgba(255,255,255,0.05)',
                                        borderColor: selections[pair.id] === pair.left.value ? 'var(--primary, #0096c7)' : 'rgba(255,255,255,0.1)',
                                        color: 'var(--foreground)',
                                    }}
                                >
                                    <span className="text-2xl">{pair.left.emoji}</span>
                                    <span className="font-medium text-sm">{pair.left.label}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleSelect(pair.id, pair.right.value)}
                                    className="flex-1 flex flex-col items-center justify-center gap-1 p-4 rounded-xl transition-all border-2 min-h-[80px]"
                                    style={{
                                        backgroundColor: selections[pair.id] === pair.right.value ? 'rgba(0, 150, 199, 0.2)' : 'rgba(255,255,255,0.05)',
                                        borderColor: selections[pair.id] === pair.right.value ? 'var(--primary, #0096c7)' : 'rgba(255,255,255,0.1)',
                                        color: 'var(--foreground)',
                                    }}
                                >
                                    <span className="text-2xl">{pair.right.emoji}</span>
                                    <span className="font-medium text-sm">{pair.right.label}</span>
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="p-6 pt-2 flex flex-col sm:flex-row gap-3">
                        <button
                            type="button"
                            onClick={handleSkip}
                            className="text-sm px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
                            style={{ color: 'rgba(255, 255, 255, 0.6)' }}
                        >
                            Passer
                        </button>
                        <div className="flex-1" />
                        <Button
                            label={selectedCount > 0 ? `Valider (${selectedCount})` : 'Valider'}
                            onClick={handleValidate}
                            variant="dark"
                            tone="tone1"
                        />
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
