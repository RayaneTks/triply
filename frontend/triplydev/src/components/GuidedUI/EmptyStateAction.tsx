'use client';

import type { ReactNode } from 'react';

export function EmptyStateAction({
    icon,
    eyebrow,
    title,
    description,
    action,
}: {
    icon: ReactNode;
    eyebrow: string;
    title: string;
    description: string;
    action?: ReactNode;
}) {
    return (
        <section className="rounded-[2rem] border border-dashed border-[var(--app-border-strong)] bg-white/74 px-5 py-14 text-center shadow-[var(--shadow-sm)]">
            <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-[var(--app-brand-soft)] text-[color:var(--primary)]">
                {icon}
            </div>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--app-muted)]">{eyebrow}</p>
            <h3 className="mt-2 text-2xl font-semibold text-[color:var(--foreground)]">{title}</h3>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[color:var(--app-muted)]">{description}</p>
            {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
        </section>
    );
}
