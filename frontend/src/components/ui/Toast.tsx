'use client';

import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Info, RotateCcw, X } from 'lucide-react';

export type ToastVariant = 'info' | 'success' | 'error';

/** Why a toast left the stack — lets callers distinguish "undo" from "commit". */
export type ToastDismissReason = 'timeout' | 'manual' | 'action';

export interface ToastAction {
    label: string;
    onClick: () => void;
}

export interface ToastOptions {
    title: string;
    description?: string;
    variant?: ToastVariant;
    /** Auto-dismiss delay in ms. `0` keeps the toast until dismissed manually. */
    duration?: number;
    action?: ToastAction;
    /**
     * Fired exactly once when the toast is removed. `reason` is `'action'` when
     * the action button was pressed, `'timeout'` on auto-dismiss, `'manual'` on
     * the close button. Used by the trip-delete flow to commit/rollback.
     */
    onDismiss?: (reason: ToastDismissReason) => void;
}

interface ToastItem extends Required<Pick<ToastOptions, 'title' | 'variant' | 'duration'>> {
    id: string;
    description?: string;
    action?: ToastAction;
    onDismiss?: (reason: ToastDismissReason) => void;
}

interface ToastContextValue {
    toast: (options: ToastOptions) => string;
    dismiss: (id: string, reason?: ToastDismissReason) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION = 5000;

const VARIANT_STYLES: Record<
    ToastVariant,
    { Icon: typeof Info; iconWrap: string; accent: string }
> = {
    // Charte cyan : info & succès s'appuient sur var(--primary) via .text-brand / .bg-brand.
    info: {
        Icon: Info,
        iconWrap: 'bg-brand/10 text-brand',
        accent: 'before:bg-brand',
    },
    success: {
        Icon: CheckCircle2,
        iconWrap: 'bg-brand/10 text-brand',
        accent: 'before:bg-brand',
    },
    error: {
        Icon: AlertTriangle,
        iconWrap: 'bg-error/15 text-error',
        accent: 'before:bg-error',
    },
};

let toastSeq = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

    const clearTimer = useCallback((id: string) => {
        const timer = timersRef.current.get(id);
        if (timer) {
            clearTimeout(timer);
            timersRef.current.delete(id);
        }
    }, []);

    const dismiss = useCallback(
        (id: string, reason: ToastDismissReason = 'manual') => {
            clearTimer(id);
            setToasts((current) => {
                const target = current.find((t) => t.id === id);
                if (target?.onDismiss) {
                    // Defer so we never call a parent setState during this render.
                    queueMicrotask(() => target.onDismiss?.(reason));
                }
                return current.filter((t) => t.id !== id);
            });
        },
        [clearTimer],
    );

    const toast = useCallback(
        (options: ToastOptions): string => {
            const id = `toast-${++toastSeq}`;
            const item: ToastItem = {
                id,
                title: options.title,
                description: options.description,
                variant: options.variant ?? 'info',
                duration: options.duration ?? DEFAULT_DURATION,
                action: options.action,
                onDismiss: options.onDismiss,
            };
            setToasts((current) => [...current, item]);

            if (item.duration > 0) {
                const timer = setTimeout(() => dismiss(id, 'timeout'), item.duration);
                timersRef.current.set(id, timer);
            }
            return id;
        },
        [dismiss],
    );

    useEffect(() => {
        const timers = timersRef.current;
        return () => {
            timers.forEach((timer) => clearTimeout(timer));
            timers.clear();
        };
    }, []);

    const value = useMemo<ToastContextValue>(() => ({ toast, dismiss }), [toast, dismiss]);

    return (
        <ToastContext.Provider value={value}>
            {children}
            <Toaster toasts={toasts} onDismiss={dismiss} />
        </ToastContext.Provider>
    );
}

function Toaster({
    toasts,
    onDismiss,
}: {
    toasts: ToastItem[];
    onDismiss: (id: string, reason?: ToastDismissReason) => void;
}) {
    if (typeof document === 'undefined') return null;

    return createPortal(
        <div
            // iOS safe-area + barre de nav mobile (lg:hidden, 64px) : on remonte la
            // pile au-dessus de la home bar et de la bottom-nav sous le breakpoint lg.
            className="pointer-events-none fixed inset-x-0 bottom-0 z-[10050] flex flex-col items-center gap-2 px-4 pb-[calc(72px+env(safe-area-inset-bottom))] lg:pb-[max(1.75rem,env(safe-area-inset-bottom))]"
            aria-live="polite"
            aria-atomic="false"
        >
            <AnimatePresence initial={false}>
                {toasts.map((t) => (
                    <ToastCard key={t.id} toast={t} onDismiss={onDismiss} />
                ))}
            </AnimatePresence>
        </div>,
        document.body,
    );
}

function ToastCard({
    toast,
    onDismiss,
}: {
    toast: ToastItem;
    onDismiss: (id: string, reason?: ToastDismissReason) => void;
}) {
    const { Icon, iconWrap, accent } = VARIANT_STYLES[toast.variant];

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            role={toast.variant === 'error' ? 'alert' : 'status'}
            className={`triply-card pointer-events-auto relative w-full max-w-md overflow-hidden p-4 pl-5 shadow-2xl
                before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:content-[''] ${accent}`}
        >
            <div className="flex items-start gap-3">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${iconWrap}`}>
                    <Icon size={18} strokeWidth={2.25} />
                </span>
                <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-sm font-bold text-light-foreground">{toast.title}</p>
                    {toast.description && (
                        <p className="mt-0.5 text-xs font-medium leading-relaxed text-light-muted">
                            {toast.description}
                        </p>
                    )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                    {toast.action && (
                        <button
                            type="button"
                            onClick={() => {
                                toast.action?.onClick();
                                onDismiss(toast.id, 'action');
                            }}
                            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold text-brand transition-colors hover:bg-brand/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                        >
                            <RotateCcw size={13} />
                            {toast.action.label}
                        </button>
                    )}
                    <button
                        type="button"
                        aria-label="Fermer la notification"
                        onClick={() => onDismiss(toast.id, 'manual')}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-light-muted transition-colors hover:bg-light-bg hover:text-light-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                    >
                        <X size={15} />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

/**
 * Accès au système de toasts global. Hors d'un ToastProvider, renvoie un no-op
 * silencieux pour ne jamais casser le rendu (ex: tests, Storybook).
 */
export function useToast(): ToastContextValue {
    const ctx = useContext(ToastContext);
    if (ctx) return ctx;
    return {
        toast: () => '',
        dismiss: () => undefined,
    };
}
