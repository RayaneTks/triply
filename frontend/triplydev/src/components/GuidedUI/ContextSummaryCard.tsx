'use client';

interface ContextSummaryItem {
    label: string;
    value: string;
}

function joinClasses(...values: Array<string | null | undefined | false>): string {
    return values.filter(Boolean).join(' ');
}

export function ContextSummaryCard({
    eyebrow,
    title,
    description,
    items,
    tone = 'light',
    className,
}: {
    eyebrow: string;
    title: string;
    description?: string;
    items: ContextSummaryItem[];
    tone?: 'light' | 'dark';
    className?: string;
}) {
    return (
        <section
            className={joinClasses(
                'rounded-[1.8rem] border p-5 shadow-[var(--shadow-sm)]',
                tone === 'dark'
                    ? 'border-white/10 bg-[var(--app-surface-dark)] text-white'
                    : 'border-[var(--app-border)] bg-white/82 text-[color:var(--foreground)]',
                className,
            )}
        >
            <p
                className={joinClasses(
                    'text-xs font-semibold uppercase tracking-[0.18em]',
                    tone === 'dark' ? 'text-slate-400' : 'text-[color:var(--app-muted)]',
                )}
            >
                {eyebrow}
            </p>
            <h2 className="mt-2 text-xl font-semibold">{title}</h2>
            {description ? (
                <p
                    className={joinClasses(
                        'mt-2 text-sm leading-relaxed',
                        tone === 'dark' ? 'text-slate-300' : 'text-[color:var(--app-muted)]',
                    )}
                >
                    {description}
                </p>
            ) : null}
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {items.map((item) => (
                    <div
                        key={item.label}
                        className={joinClasses(
                            'rounded-[1.35rem] p-4',
                            tone === 'dark' ? 'bg-white/5' : 'bg-[var(--app-brand-soft)]',
                        )}
                    >
                        <p
                            className={joinClasses(
                                'text-xs font-semibold uppercase tracking-[0.18em]',
                                tone === 'dark' ? 'text-slate-400' : 'text-[color:var(--app-muted)]',
                            )}
                        >
                            {item.label}
                        </p>
                        <p className="mt-2 text-sm font-semibold">{item.value}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}
