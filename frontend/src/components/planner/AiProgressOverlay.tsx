'use client';

import { FC } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Loader2, Circle, Sparkles, Brain, Compass, Wand2, Save } from 'lucide-react';
import { cn } from '../../lib/utils';

export type AiStage =
    | 'idle'
    | 'analyzing'
    | 'researching'
    | 'generating'
    | 'saving'
    | 'redirecting';

interface AiProgressOverlayProps {
    stage: AiStage;
    destination: string;
    travelDays: number;
    budget: number;
}

interface StepDef {
    key: Exclude<AiStage, 'idle' | 'redirecting'>;
    label: string;
    Icon: typeof Brain;
}

const STEPS: StepDef[] = [
    { key: 'analyzing', label: 'Analyse de vos préférences', Icon: Brain },
    { key: 'researching', label: 'Repérage des incontournables', Icon: Compass },
    { key: 'generating', label: 'Génération du programme jour par jour', Icon: Wand2 },
    { key: 'saving', label: 'Sauvegarde de votre itinéraire', Icon: Save },
];

const STAGE_ORDER: Record<AiStage, number> = {
    idle: -1,
    analyzing: 0,
    researching: 1,
    generating: 2,
    saving: 3,
    redirecting: 4,
};

/**
 * Full-screen overlay rendered during AI generation + save. Shows a 4-step
 * checklist whose icons transition pending → spinning → done as the parent
 * advances `stage`. Designed for the investor demo: the user sees concrete
 * progress instead of a generic spinner.
 */
export const AiProgressOverlay: FC<AiProgressOverlayProps> = ({ stage, destination, travelDays, budget }) => {
    const visible = stage !== 'idle';
    const currentIndex = STAGE_ORDER[stage];

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[10000] flex flex-col items-center justify-center gap-10 bg-background/95 backdrop-blur-md px-6"
                >
                    <div className="flex flex-col items-center gap-6 text-center max-w-md">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                            className="w-16 h-16 rounded-full border-4 border-brand/20 border-t-brand"
                        />
                        <div className="space-y-2">
                            <div className="flex items-center justify-center gap-2 text-brand">
                                <Sparkles size={18} />
                                <span className="text-xs font-bold uppercase tracking-widest">Copilote Triply</span>
                            </div>
                            <h2 className="text-2xl font-display font-bold text-light-foreground">
                                Préparation de votre voyage à {destination.trim() || 'votre destination'}
                            </h2>
                            <p className="text-sm text-light-muted font-bold leading-relaxed">
                                Sélection d'activités sur {travelDays} jour{travelDays > 1 ? 's' : ''} adaptées à votre budget de {budget.toLocaleString()}€.
                            </p>
                            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 text-brand border border-brand/20 px-3 py-1 text-xs font-bold">
                                    {travelDays} jour{travelDays > 1 ? 's' : ''}
                                </span>
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 text-brand border border-brand/20 px-3 py-1 text-xs font-bold">
                                    {budget.toLocaleString()}€
                                </span>
                            </div>
                        </div>
                    </div>

                    <ol className="w-full max-w-md space-y-3" aria-label="Étapes de génération">
                        {STEPS.map((step, index) => {
                            const isDone = index < currentIndex;
                            const isActive = index === currentIndex;
                            return (
                                <li
                                    key={step.key}
                                    className={cn(
                                        'flex items-center gap-4 px-4 py-3 rounded-2xl border transition-colors bg-card',
                                        isDone && 'border-brand/30 text-brand',
                                        isActive && 'border-brand/30 text-light-foreground shadow-sm',
                                        !isDone && !isActive && 'border-light-border text-light-muted',
                                    )}
                                    aria-current={isActive ? 'step' : undefined}
                                >
                                    <span
                                        className={cn(
                                            'flex w-9 h-9 items-center justify-center rounded-full shrink-0',
                                            isDone && 'bg-brand text-white',
                                            isActive && 'bg-brand text-white',
                                            !isDone && !isActive && 'bg-light-bg text-light-muted',
                                        )}
                                    >
                                        {isDone ? (
                                            <CheckCircle2 size={18} strokeWidth={2.5} />
                                        ) : isActive ? (
                                            <Loader2 size={18} className="animate-spin" />
                                        ) : (
                                            <Circle size={18} />
                                        )}
                                    </span>
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <step.Icon
                                            size={18}
                                            className={cn(
                                                'shrink-0',
                                                isDone && 'text-white',
                                                isActive && 'text-brand',
                                                !isDone && !isActive && 'text-light-muted',
                                            )}
                                        />
                                        <span className="text-sm font-bold truncate">{step.label}</span>
                                    </div>
                                </li>
                            );
                        })}
                    </ol>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
