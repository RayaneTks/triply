'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Sidebar } from '@/src/components/Sidebar/Sidebar';
import { Button } from '@/src/components/Button/Button';

// Données de démonstration – à remplacer par les données réelles
const DEMO_TRIPS: Record<string, {
    departure: string;
    departureCity: string;
    arrival: string;
    arrivalCity: string;
    outboundDate: string;
    returnDate: string;
    travelerCount: number;
    budget: string;
    currency: string;
    travelDays: number;
    selectedOptions: string[];
    flight: { carrier: string; departure: string; arrival: string; price: string; currency: string };
    hotels: { name: string; stars: number; nights: number }[];
}> = {
    '1': {
        departure: 'CDG',
        departureCity: 'Paris',
        arrival: 'FCO',
        arrivalCity: 'Rome',
        outboundDate: '2025-03-15',
        returnDate: '2025-03-22',
        travelerCount: 2,
        budget: '450',
        currency: 'EUR',
        travelDays: 7,
        selectedOptions: ['Petit déjeuner inclus', 'Proche du centre ville'],
        flight: { carrier: 'Air France', departure: '08:30', arrival: '10:45', price: '320', currency: 'EUR' },
        hotels: [
            { name: 'Hotel Roma Centro', stars: 4, nights: 4 },
            { name: 'B&B Trastevere', stars: 3, nights: 3 },
        ],
    },
    '2': {
        departure: 'LYS',
        departureCity: 'Lyon',
        arrival: 'BCN',
        arrivalCity: 'Barcelone',
        outboundDate: '2025-04-10',
        returnDate: '2025-04-14',
        travelerCount: 1,
        budget: '280',
        currency: 'EUR',
        travelDays: 4,
        selectedOptions: ['Plage'],
        flight: { carrier: 'Vueling', departure: '14:20', arrival: '15:45', price: '89', currency: 'EUR' },
        hotels: [{ name: 'Hotel Gothic Quarter', stars: 4, nights: 4 }],
    },
    '3': {
        departure: 'CDG',
        departureCity: 'Paris',
        arrival: 'LIS',
        arrivalCity: 'Lisbonne',
        outboundDate: '2025-06-20',
        returnDate: '2025-06-27',
        travelerCount: 2,
        budget: '520',
        currency: 'EUR',
        travelDays: 7,
        selectedOptions: ['Petit déjeuner inclus', 'Vue mer'],
        flight: { carrier: 'TAP Air Portugal', departure: '09:15', arrival: '11:00', price: '195', currency: 'EUR' },
        hotels: [
            { name: 'Pensão Amor', stars: 3, nights: 4 },
            { name: 'Hotel Avenida Palace', stars: 5, nights: 3 },
        ],
    },
};

const formatDate = (dateStr: string) => {
    if (!dateStr) return '–';
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
};

const StarIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
);

export default function VoyageDetailPage() {
    const params = useParams();
    const id = params?.id as string;
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    const trip = id ? DEMO_TRIPS[id] : null;

    if (!trip) {
        return (
            <div className="flex h-[100dvh] min-h-0 overflow-hidden w-full" style={{ backgroundColor: 'var(--background, #222222)' }}>
                <Sidebar
                    isCollapsed={isSidebarCollapsed}
                    onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    isConnected={true}
                    onLoginClick={() => {}}
                    onLogoutClick={() => {}}
                />
                <main className="flex-1 flex items-center justify-center p-8">
                    <div className="text-center">
                        <p className="mb-4" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            Voyage introuvable
                        </p>
                        <Link href="/voyages" className="font-medium" style={{ color: 'var(--primary)' }}>
                            ← Retour aux voyages
                        </Link>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex h-[100dvh] min-h-0 overflow-hidden w-full" style={{ backgroundColor: 'var(--background, #222222)' }}>
            <Sidebar
                isCollapsed={isSidebarCollapsed}
                onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                isConnected={true}
                onLoginClick={() => {}}
                onLogoutClick={() => {}}
            />

            <main className="flex-1 overflow-y-auto min-w-0">
                <div className="max-w-2xl mx-auto p-4 sm:p-6 md:p-8 lg:p-12">
                    <div className="flex items-center gap-4 mb-8">
                        <Link
                            href="/voyages"
                            className="text-sm font-medium hover:underline"
                            style={{ color: 'rgba(255, 255, 255, 0.7)' }}
                        >
                            ← Retour aux voyages
                        </Link>
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: 'var(--foreground)', fontFamily: 'var(--font-title)' }}>
                        Récapitulatif de votre voyage
                    </h1>
                    <p className="mb-10" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                        {trip.departureCity} → {trip.arrivalCity}
                    </p>

                    {/* Dates et voyageurs */}
                    <section className="mb-8">
                        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
                            Dates et voyageurs
                        </h3>
                        <div
                            className="rounded-2xl p-6 grid gap-4 sm:grid-cols-2"
                            style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                            }}
                        >
                            <div>
                                <span className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Départ</span>
                                <p className="font-medium" style={{ color: 'var(--foreground)' }}>
                                    {formatDate(trip.outboundDate)}
                                </p>
                            </div>
                            <div>
                                <span className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Retour</span>
                                <p className="font-medium" style={{ color: 'var(--foreground)' }}>
                                    {formatDate(trip.returnDate)}
                                </p>
                            </div>
                            <div>
                                <span className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Durée</span>
                                <p className="font-medium" style={{ color: 'var(--foreground)' }}>
                                    {trip.travelDays} jours
                                </p>
                            </div>
                            <div>
                                <span className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Voyageurs</span>
                                <p className="font-medium" style={{ color: 'var(--foreground)' }}>
                                    {trip.travelerCount} {trip.travelerCount > 1 ? 'personnes' : 'personne'}
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Vol */}
                    <section className="mb-8">
                        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
                            Vol sélectionné
                        </h3>
                        <div
                            className="rounded-2xl p-6"
                            style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                            }}
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div>
                                    <p className="font-semibold text-lg" style={{ color: 'var(--foreground)' }}>
                                        {trip.departure} → {trip.arrival}
                                    </p>
                                    <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>{trip.flight.carrier}</p>
                                    <p className="text-sm mt-1" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                        Départ {trip.flight.departure} · Arrivée {trip.flight.arrival}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-bold" style={{ color: 'var(--primary)' }}>
                                        {trip.flight.price} {trip.flight.currency}
                                    </p>
                                    <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                        par personne
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Hébergements */}
                    <section className="mb-8">
                        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
                            Hébergements
                        </h3>
                        <div className="space-y-3">
                            {trip.hotels.map((hotel, i) => (
                                <div
                                    key={i}
                                    className="rounded-2xl p-4 flex items-center justify-between"
                                    style={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                    }}
                                >
                                    <div>
                                        <p className="font-medium" style={{ color: 'var(--foreground)' }}>
                                            {hotel.name}
                                        </p>
                                        <p className="text-sm flex items-center gap-1 mt-1" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                            {Array.from({ length: hotel.stars }).map((_, j) => (
                                                <span key={j} style={{ color: 'var(--primary)' }}>
                                                    <StarIcon />
                                                </span>
                                            ))}
                                            <span className="ml-1">· {hotel.nights} nuit{hotel.nights > 1 ? 's' : ''}</span>
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Options et budget */}
                    <section className="mb-8">
                        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
                            Options et budget
                        </h3>
                        <div
                            className="rounded-2xl p-6 space-y-4"
                            style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                            }}
                        >
                            <div className="flex justify-between items-center">
                                <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Budget total</span>
                                <span className="font-bold text-lg" style={{ color: 'var(--primary)' }}>
                                    {trip.budget} {trip.currency}
                                </span>
                            </div>
                            {trip.selectedOptions.length > 0 && (
                                <div>
                                    <span className="text-sm block mb-2" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                        Préférences
                                    </span>
                                    <div className="flex flex-wrap gap-2">
                                        {trip.selectedOptions.map((opt) => (
                                            <span
                                                key={opt}
                                                className="px-3 py-1 rounded-full text-sm"
                                                style={{
                                                    backgroundColor: 'rgba(0, 150, 199, 0.2)',
                                                    color: 'var(--primary)',
                                                }}
                                            >
                                                {opt}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
                        <Link href="/">
                            <Button label="Modifier le voyage" variant="dark" tone="tone2" />
                        </Link>
                        <Link href="/voyages">
                            <Button label="Retour aux voyages" variant="dark" tone="tone2" />
                        </Link>
                        <Button label="Confirmer et réserver" variant="dark" tone="tone1" onClick={() => alert('Réservation confirmée !')} />
                    </div>
                </div>
            </main>
        </div>
    );
}
