'use client';

import React, { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface DayCarouselSlide {
  id: string;
  /** Numéro de jour (1-indexed) affiché dans les pills. */
  dayNumber: number;
  /** Label optionnel court (ex: "Lun. 23 juin"). */
  shortLabel?: string;
  /** Statut visuel (ex: "Prêt", "À compléter"). */
  status?: string;
  /** Indique si le jour contient des activités (pour le style de pill). */
  hasContent?: boolean;
  /** Contenu du slide — DayTimeline + FreeTimeWidget, etc. */
  content: ReactNode;
}

interface DayCarouselProps {
  slides: DayCarouselSlide[];
  className?: string;
  emptyHint?: ReactNode;
}

/**
 * Carrousel horizontal scroll-snap pour l’itinéraire jour par jour.
 * Inspiré de patterns Awwwards : snap-mandatory, navigation pills, flèches discrètes.
 * Mobile : swipe natif. Desktop : flèches + clic sur pills.
 */
export function DayCarousel({ slides, className, emptyHint }: DayCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<Array<HTMLElement | null>>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  // Track-level scroll state for buttons + active pill detection (IntersectionObserver).
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const updateScrollEnds = () => {
      setCanScrollPrev(track.scrollLeft > 4);
      setCanScrollNext(track.scrollLeft + track.clientWidth < track.scrollWidth - 4);
    };
    updateScrollEnds();
    track.addEventListener('scroll', updateScrollEnds, { passive: true });
    const ro = new ResizeObserver(updateScrollEnds);
    ro.observe(track);
    return () => {
      track.removeEventListener('scroll', updateScrollEnds);
      ro.disconnect();
    };
  }, [slides.length]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the most visible slide as active.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const idx = slideRefs.current.findIndex((el) => el === visible.target);
        if (idx >= 0) setActiveIndex(idx);
      },
      { root: track, threshold: [0.4, 0.6, 0.8] },
    );
    slideRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [slides.length]);

  const scrollToIndex = useCallback((idx: number) => {
    const target = slideRefs.current[idx];
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
  }, []);

  const scrollBy = useCallback((dir: 1 | -1) => {
    const next = Math.min(Math.max(activeIndex + dir, 0), slides.length - 1);
    scrollToIndex(next);
  }, [activeIndex, scrollToIndex, slides.length]);

  if (slides.length === 0) {
    return (
      <div className={cn('triply-card p-8 text-center text-sm text-light-muted font-bold', className)}>
        {emptyHint ?? 'Pas encore de journées planifiées.'}
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header — pills + flèches */}
      <div className="flex items-center gap-3">
        <div className="-mx-1 flex flex-1 items-center gap-1.5 overflow-x-auto px-1 py-1 scrollbar-thin">
          {slides.map((s, i) => (
            <button
              key={`pill-${s.id}`}
              type="button"
              onClick={() => scrollToIndex(i)}
              aria-label={`Aller au jour ${s.dayNumber}`}
              aria-current={i === activeIndex}
              className={cn(
                'shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-colors',
                i === activeIndex
                  ? 'bg-brand text-white shadow-sm'
                  : s.hasContent
                    ? 'border border-light-border bg-card text-light-foreground hover:border-brand/40 hover:text-brand'
                    : 'border border-dashed border-light-border bg-light-bg/60 text-light-muted hover:text-light-foreground',
              )}
            >
              J{s.dayNumber}
              {s.shortLabel && <span className="ml-1 hidden sm:inline opacity-70">· {s.shortLabel}</span>}
            </button>
          ))}
        </div>
        <div className="hidden shrink-0 items-center gap-1 sm:flex">
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            disabled={!canScrollPrev}
            aria-label="Jour précédent"
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-full border border-light-border bg-card text-light-foreground transition-opacity',
              canScrollPrev ? 'hover:border-brand hover:text-brand' : 'opacity-30 cursor-not-allowed',
            )}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => scrollBy(1)}
            disabled={!canScrollNext}
            aria-label="Jour suivant"
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-full border border-light-border bg-card text-light-foreground transition-opacity',
              canScrollNext ? 'hover:border-brand hover:text-brand' : 'opacity-30 cursor-not-allowed',
            )}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Track scroll-snap horizontal */}
      <div
        ref={trackRef}
        className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 pb-4 sm:-mx-6 sm:px-6 [scrollbar-width:thin]"
        role="region"
        aria-roledescription="carrousel"
        aria-label="Itinéraire jour par jour"
      >
        {slides.map((s, i) => (
          <article
            key={s.id}
            ref={(el) => { slideRefs.current[i] = el; }}
            aria-roledescription="slide"
            aria-label={`Jour ${s.dayNumber}${s.shortLabel ? ' — ' + s.shortLabel : ''}`}
            className="shrink-0 snap-start basis-[88%] sm:basis-[520px] lg:basis-[560px]"
          >
            <div className="h-full rounded-3xl border border-light-border bg-card p-5 shadow-sm sm:p-6">
              <header className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-brand/10 font-display text-sm font-black text-brand">
                    {s.dayNumber}
                  </span>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-light-muted">Jour</p>
                    {s.shortLabel && (
                      <p className="text-sm font-bold text-light-foreground">{s.shortLabel}</p>
                    )}
                  </div>
                </div>
                {s.status && (
                  <span className="rounded-full bg-light-bg px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-light-muted">
                    {s.status}
                  </span>
                )}
              </header>
              {s.content}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
