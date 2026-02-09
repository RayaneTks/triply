'use client';

import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Sidebar } from '@/src/components/Sidebar/Sidebar';
import { SearchBar } from '@/src/components/Searchbar/Searchbar';
import { Button } from '@/src/components/Button/Button';
import { Slide } from '@/src/components/PowerPoint/Slide';
import { WorldMap } from '@/src/components/Map/Map';
import { SlideDefinition } from '@/src/components/PowerPoint/types';
import { TravelerCounter } from '@/src/components/TravelerCounter/TravelerCounter';
import { DateRangePicker } from '@/src/components/DataRangePicker/DataRangePicker';
import { MultiSelect } from '@/src/components/MultiSelect/MultiSelect';
import { TimePicker } from '@/src/components/TimePicker/TimePicker';

// Données de démonstration pour les slides
const getMockSlides = (
    travelerCount: number,
    budget: string,
    activityTime: string,
    arrivalDate: string,
    departureDate: string,
    arrivalTime: string,
    departureTime: string,
    selectedOptions: string[],
    setTravelerCount: (count: number) => void,
    setBudget: (budget: string) => void,
    setActivityTime: (time: string) => void,
    setArrivalDate: (date: string) => void,
    setDepartureDate: (date: string) => void,
    setArrivalTime: (time: string) => void,
    setDepartureTime: (time: string) => void,
    setSelectedOptions: (options: string[]) => void,
    multiSelectOptions: string[]
): SlideDefinition[] => [
    { 
        id: '1', 
        title: 'Paramètres de voyage', 
        content: (
            <div 
                className="flex flex-col h-full p-8 overflow-y-auto slide-content-scroll"
                style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                }}
            >
                <style>{`
                    .slide-content-scroll::-webkit-scrollbar {
                        display: none !important;
                    }
                `}</style>
                <h1 className="text-3xl font-bold mb-6" style={{ color: 'var(--foreground, #ededed)' }}>Configurez votre voyage</h1>
                
                <div className="space-y-4 max-w-2xl">
                    {/* Nombre de voyageurs */}
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground, #ededed)' }}>
                            Nombre de voyageurs
                        </label>
                        <TravelerCounter
                            count={travelerCount}
                            onChange={setTravelerCount}
                            className="w-full"
                            style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                borderColor: 'rgba(255, 255, 255, 0.2)',
                                color: 'rgba(255, 255, 255, 0.5)',
                            }}
                        />
                    </div>

                    {/* Budget maximum */}
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground, #ededed)' }}>
                            Budget maximum (€)
                        </label>
                        <div className="flex items-center bg-white border border-gray-300 rounded-lg py-2 px-4 shadow-sm w-full"
                             style={{ 
                                 backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                 borderColor: 'rgba(255, 255, 255, 0.2)',
                             }}>
                            <span className="mr-2" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>€</span>
                            <input
                                type="number"
                                value={budget}
                                onChange={(e) => setBudget(e.target.value)}
                                placeholder="0"
                                className="flex-grow bg-transparent focus:outline-none"
                                style={{ color: 'var(--foreground, #ededed)' }}
                            />
                        </div>
                    </div>

                    {/* Temps par jour d'activité */}
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground, #ededed)' }}>
                            Temps par jour d'activité (heures)
                        </label>
                        <div className="flex items-center bg-white border border-gray-300 rounded-lg py-2 px-4 shadow-sm w-full"
                             style={{ 
                                 backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                 borderColor: 'rgba(255, 255, 255, 0.2)',
                             }}>
                            <input
                                type="number"
                                value={activityTime}
                                onChange={(e) => setActivityTime(e.target.value)}
                                placeholder="0"
                                min="0"
                                max="24"
                                className="flex-grow bg-transparent focus:outline-none"
                                style={{ color: 'var(--foreground, #ededed)' }}
                            />
                            <span className="ml-2" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>h</span>
                        </div>
                    </div>

                    {/* Date et heure d'arrivée/départ */}
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground, #ededed)' }}>
                            Date d'arrivée / Départ
                        </label>
                        <DateRangePicker
                            startDate={arrivalDate}
                            endDate={departureDate}
                            onDatesChange={(start, end) => {
                                setArrivalDate(start);
                                setDepartureDate(end);
                            }}
                            className="w-full mb-2"
                            containerStyle={{
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                borderColor: 'rgba(255, 255, 255, 0.2)',
                                color: 'rgba(255, 255, 255, 0.5)',
                            }}
                        />
                        <div className="flex flex-col sm:flex-row gap-2 mt-2">
                            <div className="flex-1 min-w-0">
                                <TimePicker
                                    value={arrivalTime}
                                    onChange={setArrivalTime}
                                    label="Heure d'arrivée"
                                    containerStyle={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                        borderColor: 'rgba(255, 255, 255, 0.2)',
                                        color: 'rgba(255, 255, 255, 0.7)',
                                    }}
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <TimePicker
                                    value={departureTime}
                                    onChange={setDepartureTime}
                                    label="Heure de départ"
                                    containerStyle={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                        borderColor: 'rgba(255, 255, 255, 0.2)',
                                        color: 'rgba(255, 255, 255, 0.7)',
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* MultiSelect */}
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground, #ededed)' }}>
                            Préférences
                        </label>
                        <MultiSelect
                            options={multiSelectOptions}
                            selectedValues={selectedOptions}
                            onChange={setSelectedOptions}
                            placeholder="Sélectionner des préférences..."
                            className="w-full"
                        />
                    </div>
                </div>
            </div>
        )
    },
    { 
        id: '2', 
        title: 'Architecture', 
        content: (
            <div className="flex flex-col items-center justify-center h-full p-8">
                <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--foreground, #ededed)' }}>Architecture</h1>
                <p className="text-lg max-w-md text-center" style={{ color: 'var(--foreground, #ededed)' }}>
                    Vue d'ensemble de l'architecture du système.
                </p>
            </div>
        )
    },
];

export default function Home() {
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [slideDirection, setSlideDirection] = useState<1 | -1>(1);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [message, setMessage] = useState('');
    
    // États pour la première slide
    const [travelerCount, setTravelerCount] = useState(1);
    const [budget, setBudget] = useState('');
    const [activityTime, setActivityTime] = useState('');
    const [arrivalDate, setArrivalDate] = useState('');
    const [departureDate, setDepartureDate] = useState('');
    const [arrivalTime, setArrivalTime] = useState('');
    const [departureTime, setDepartureTime] = useState('');
    const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
    
    const multiSelectOptions = [
        'Petit déjeuner inclus',
        'Proche du centre ville',
        'Spa/piscine',
        'Plage',
        'Équipement',
        'Retour positif',
        'Hôtel de luxe',
        'Animaux domestiques',
        'Réservé aux adultes',
        'LGBTQIA+ friendly'
    ];

    const handleSubmitMessage = () => {
        if (message.trim()) {
            // TODO: Implémenter la logique d'envoi du message
            console.log('Message envoyé:', message);
            setMessage('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSubmitMessage();
        }
    };

    // Générer les slides avec les états actuels
    const mockSlides = getMockSlides(
        travelerCount,
        budget,
        activityTime,
        arrivalDate,
        departureDate,
        arrivalTime,
        departureTime,
        selectedOptions,
        setTravelerCount,
        setBudget,
        setActivityTime,
        setArrivalDate,
        setDepartureDate,
        setArrivalTime,
        setDepartureTime,
        setSelectedOptions,
        multiSelectOptions
    );

    const handleNext = () => {
        if (currentSlideIndex < mockSlides.length - 1) {
            setSlideDirection(1);
            setCurrentSlideIndex(currentSlideIndex + 1);
        }
    };

    const handlePrev = () => {
        if (currentSlideIndex > 0) {
            setSlideDirection(-1);
            setCurrentSlideIndex(currentSlideIndex - 1);
        }
    };

    const handleJumpTo = (index: number) => {
        const direction = index > currentSlideIndex ? 1 : -1;
        setSlideDirection(direction);
        setCurrentSlideIndex(index);
    };

    // Token Mapbox - À remplacer par votre token ou une variable d'environnement
    const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1IjoiZHVuY2FuZ2F1YmVydCIsImEiOiJjbWs1em50ZjgwaHc3M2VxczYweWR2djBwIn0.pwM2awFdHHSRsQeYiTtkXA';

    return (
        <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--background, #222222)' }}>
            {/* Sidebar à gauche */}
            <Sidebar 
                isCollapsed={isSidebarCollapsed}
                onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            />

            {/* Contenu principal */}
            <div className="flex-1 flex overflow-hidden min-w-0 relative">
                {/* Map en arrière-plan (prend tout l'espace avec centre décalé) */}
                <div className="absolute inset-0 overflow-hidden" style={{ backgroundColor: 'var(--background, #222222)' }}>
                    <WorldMap
                        accessToken={MAPBOX_TOKEN}
                        initialLatitude={46.6034}
                        initialLongitude={1.8883}
                        initialZoom={5}
                        height="100%"
                        width="100%"
                        className="h-full"
                        padding={{ left: 400, top: 0, bottom: 0, right: 0 }}
                    />
                </div>

                {/* Div mère contenant LLM et Slide - positionnée en overlay sur la map */}
                <div className="absolute left-0 top-0 bottom-0 w-1/3 flex flex-col overflow-hidden gap-4 p-4 z-10">
                    {/* Module LLM en haut */}
                    <div className="p-6 rounded-lg flex-shrink-0 min-h-[300px]" style={{ backgroundColor: 'var(--background, #222222)', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)' }}>
                        <div className="max-w-2xl mx-auto h-full flex flex-col">
                            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground, #ededed)' }}>Triply Assistant</h2>
                            <div className="flex-1"></div>
                            <div className="flex gap-2 items-stretch mt-auto">
                                <div className="flex-1">
                                    <SearchBar 
                                        placeholder="Posez votre question à l'assistant..."
                                        className="w-full"
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        containerStyle={{ 
                                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                            borderColor: 'rgba(255, 255, 255, 0.2)',
                                            color: 'rgba(255, 255, 255, 0.5)',
                                        }}
                                        style={{ 
                                            color: 'var(--foreground, #ededed)',
                                            backgroundColor: 'transparent'
                                        }}
                                    />
                                </div>
                                <div className="flex-shrink-0">
                                    <Button
                                        label="Envoyer"
                                        onClick={handleSubmitMessage}
                                        variant="dark"
                                        tone="tone1"
                                        className="h-full"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Slide en dessous du LLM */}
                    <div className="flex-1 relative overflow-hidden rounded-lg" style={{ backgroundColor: 'var(--background, #222222)', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)' }}>
                        <AnimatePresence mode="wait" custom={slideDirection}>
                            <Slide
                                key={currentSlideIndex}
                                direction={slideDirection}
                                onNext={handleNext}
                                onPrev={handlePrev}
                                canNext={currentSlideIndex < mockSlides.length - 1}
                                canPrev={currentSlideIndex > 0}
                            >
                                {mockSlides[currentSlideIndex]?.content}
                            </Slide>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}
