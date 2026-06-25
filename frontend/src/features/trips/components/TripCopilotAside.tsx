'use client';

import { FC } from 'react';
import { motion } from 'framer-motion';
import { Bot, Calendar, ExternalLink, Map as MapIcon, Users } from 'lucide-react';
import type { PlanSnapshot } from '../../../lib/plan-snapshot';
import type { TripTab } from './TripTabsNav';

interface TripCopilotAsideProps {
    dates: string;
    travelers: number;
    flightSummary?: PlanSnapshot['flightSummary'];
    hotelSummary?: PlanSnapshot['hotelSummary'];
    onNavigateTab?: (tab: TripTab) => void;
}

function formatShortDate(iso: string): string {
    try {
        return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    } catch {
        return iso.slice(0, 10);
    }
}

function hasFlightSummary(s?: PlanSnapshot['flightSummary']): boolean {
    if (!s) return false;
    return Boolean(s.carrier || s.originIata || s.destinationIata || s.price);
}

function hasHotelSummary(s?: PlanSnapshot['hotelSummary']): boolean {
    if (!s) return false;
    return Boolean(s.name || s.cityName || s.totalPrice);
}

function formatFlightSummary(s: NonNullable<PlanSnapshot['flightSummary']>): string {
    const parts: string[] = [];
    if (s.carrier) parts.push(s.carrier);
    if (s.originIata && s.destinationIata) {
        parts.push(`${s.originIata} → ${s.destinationIata}`);
    } else if (s.originIata || s.destinationIata) {
        parts.push(s.originIata ?? s.destinationIata!);
    }
    if (s.outboundAt) parts.push(formatShortDate(s.outboundAt));
    if (s.price) {
        const cur = s.currency?.trim() || 'EUR';
        parts.push(`${s.price} ${cur}`);
    }
    return parts.join(' · ');
}

function formatHotelSummary(s: NonNullable<PlanSnapshot['hotelSummary']>): string {
    const parts: string[] = [];
    if (s.name) parts.push(s.name);
    if (s.cityName) parts.push(s.cityName);
    if (s.checkInDate && s.checkOutDate) {
        parts.push(`${formatShortDate(s.checkInDate)} → ${formatShortDate(s.checkOutDate)}`);
    } else if (s.checkInDate) {
        parts.push(formatShortDate(s.checkInDate));
    }
    if (s.totalPrice) {
        const cur = s.currency?.trim() || 'EUR';
        parts.push(`${s.totalPrice} ${cur}`);
    }
    return parts.join(' · ');
}

function isHttpUrl(url?: string | null): url is string {
    return typeof url === 'string' && /^https?:\/\//i.test(url);
}

interface ResourceRowProps {
    title: string;
    description: string;
    bookingUrl?: string | null;
    tab: TripTab;
    onNavigateTab?: (tab: TripTab) => void;
}

const ResourceRow: FC<ResourceRowProps> = ({ title, description, bookingUrl, tab, onNavigateTab }) => {
    const content = (
        <>
            <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">{title}</p>
                <p className="text-xs text-light-muted truncate">{description}</p>
            </div>
            <ExternalLink size={14} className="shrink-0 text-light-muted group-hover:text-brand" />
        </>
    );

    const className =
        'flex items-center justify-between gap-3 p-4 bg-light-bg rounded-xl group hover:bg-card border border-transparent hover:border-light-border transition-all w-full text-left';

    if (isHttpUrl(bookingUrl)) {
        return (
            <li>
                <a
                    href={bookingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={className}
                >
                    {content}
                </a>
            </li>
        );
    }

    return (
        <li>
            <button
                type="button"
                onClick={() => onNavigateTab?.(tab)}
                className={className}
                disabled={!onNavigateTab}
            >
                {content}
            </button>
        </li>
    );
};

export const TripCopilotAside: FC<TripCopilotAsideProps> = ({
    dates,
    travelers,
    flightSummary,
    hotelSummary,
    onNavigateTab,
}) => {
    const flightDescription = hasFlightSummary(flightSummary)
        ? formatFlightSummary(flightSummary!)
        : 'Bientôt disponible';
    const hotelDescription = hasHotelSummary(hotelSummary)
        ? formatHotelSummary(hotelSummary!)
        : 'Bientôt disponible';

    return (
        <aside className="space-y-8">
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="triply-card p-8 border-2 border-brand/20 bg-brand/5 space-y-6"
            >
                <header className="flex items-center gap-3 text-brand">
                    <Bot size={24} />
                    <h3 className="font-bold">Copilote</h3>
                </header>
                <p className="text-sm text-brand leading-relaxed">
                    Suggestion : likez les activités que vous avez préférées pour aider Triply à affiner vos
                    prochaines recommandations.
                </p>
            </motion.div>

            <div className="triply-card p-8 space-y-6">
                <h4 className="font-bold flex items-center gap-2">
                    <MapIcon size={18} className="text-light-muted" /> Ressources
                </h4>
                <ul className="space-y-4">
                    <ResourceRow
                        title="Billets & réservations"
                        description={flightDescription}
                        bookingUrl={flightSummary?.bookingUrl}
                        tab="flights"
                        onNavigateTab={onNavigateTab}
                    />
                    <ResourceRow
                        title="Hébergement"
                        description={hotelDescription}
                        bookingUrl={hotelSummary?.bookingUrl}
                        tab="hotels"
                        onNavigateTab={onNavigateTab}
                    />
                </ul>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-light-muted">
                <Calendar size={14} />
                <span>{dates}</span>
                <Users size={14} className="ml-2" />
                <span>{travelers}</span>
            </div>
        </aside>
    );
};
