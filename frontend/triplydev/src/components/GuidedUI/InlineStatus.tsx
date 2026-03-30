'use client';

import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info, LoaderCircle } from 'lucide-react';

type InlineStatusTone = 'success' | 'error' | 'saving' | 'info';

const TONE_STYLES: Record<InlineStatusTone, { icon: ReactNode; className: string }> = {
    success: {
        icon: <CheckCircle2 size={16} />,
        className: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100',
    },
    error: {
        icon: <AlertCircle size={16} />,
        className: 'border-red-500/20 bg-red-500/10 text-red-100',
    },
    saving: {
        icon: <LoaderCircle size={16} className="animate-spin" />,
        className: 'border-cyan-500/20 bg-cyan-500/10 text-cyan-100',
    },
    info: {
        icon: <Info size={16} />,
        className: 'border-white/10 bg-white/8 text-slate-100',
    },
};

function joinClasses(...values: Array<string | null | undefined | false>): string {
    return values.filter(Boolean).join(' ');
}

export function InlineStatus({
    tone,
    message,
    className,
}: {
    tone: InlineStatusTone;
    message: string;
    className?: string;
}) {
    const config = TONE_STYLES[tone];
    return (
        <div
            className={joinClasses(
                'inline-flex min-h-11 items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium',
                config.className,
                className,
            )}
        >
            <span className="shrink-0">{config.icon}</span>
            <span>{message}</span>
        </div>
    );
}
