'use client';

import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Sidebar } from '@/src/components/Sidebar/Sidebar';
import { SearchBar } from '@/src/components/Searchbar/Searchbar';
import { Slide } from '@/src/components/PowerPoint/Slide';
import { WorldMap } from '@/src/components/Map/Map';
import { SlideDefinition } from '@/src/components/PowerPoint/types';

// Données de démonstration pour les slides
const mockSlides: SlideDefinition[] = [
    { 
        id: '1', 
        title: 'Introduction', 
        content: (
            <div className="flex flex-col items-center justify-center h-full p-8">
                <h1 className="text-4xl font-bold mb-4">Bienvenue</h1>
                <p className="text-lg text-gray-600 max-w-md text-center">
                    Ceci est la première slide de présentation.
                </p>
            </div>
        )
    },
    { 
        id: '2', 
        title: 'Architecture', 
        content: (
            <div className="flex flex-col items-center justify-center h-full p-8">
                <h1 className="text-4xl font-bold mb-4">Architecture</h1>
                <p className="text-lg text-gray-600 max-w-md text-center">
                    Vue d'ensemble de l'architecture du système.
                </p>
            </div>
        )
    },
    { 
        id: '3', 
        title: 'Conclusion', 
        content: (
            <div className="flex flex-col items-center justify-center h-full p-8">
                <h1 className="text-4xl font-bold mb-4">Conclusion</h1>
                <p className="text-lg text-gray-600 max-w-md text-center">
                    Résumé et prochaines étapes.
                </p>
            </div>
        )
    },
];

export default function Home() {
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [slideDirection, setSlideDirection] = useState<1 | -1>(1);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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
                            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground, #ededed)' }}>Assistant LLM</h2>
                            <SearchBar 
                                placeholder="Posez votre question à l'assistant..."
                                className="w-full mb-4"
                            />
                            <div className="mt-auto text-sm" style={{ color: 'var(--foreground, #ededed)' }}>
                                L'assistant est prêt à répondre à vos questions.
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
