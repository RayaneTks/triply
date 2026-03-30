'use client';

import type { ReactNode } from 'react';

export function StickyActionBar({
    progressLabel,
    progressValue,
    progressMax,
    secondaryAction,
    primaryAction,
    children,
}: {
    progressLabel?: string;
    progressValue?: number;
    progressMax?: number;
    secondaryAction?: ReactNode;
    primaryAction?: ReactNode;
    children?: ReactNode;
}) {
    const hasProgress =
        typeof progressValue === 'number' &&
        typeof progressMax === 'number' &&
        Number.isFinite(progressValue) &&
        Number.isFinite(progressMax) &&
        progressMax > 0;

    return (
        <div className="border-t border-white/10 bg-[#07131f]/96 px-4 py-3 backdrop-blur">
            {hasProgress ? (
                <div className="mb-3">
                    <div className="mb-2 flex gap-1.5">
                        {Array.from({ length: progressMax }, (_, index) => (
                            <div
                                key={index}
                                className={`h-1 flex-1 rounded-full ${index < progressValue ? 'bg-cyan-500' : 'bg-white/10'}`}
                            />
                        ))}
                    </div>
                    {progressLabel ? <p className="text-xs text-slate-400">{progressLabel}</p> : null}
                </div>
            ) : null}

            {children}

            {(secondaryAction || primaryAction) ? (
                <div className="mt-3 flex gap-2">
                    {secondaryAction}
                    {primaryAction}
                </div>
            ) : null}
        </div>
    );
}
