import React, { useMemo, useState, useEffect } from 'react';
import { Node, Edge, SlidingDoorCard } from "triply-docs-lib";
import { AnimatePresence, motion } from 'framer-motion';
import roadmapData from '../../data/roadmap.json';

// --- Types ---

interface RawSprint {
    phase: string;
    period: string;
    start_date: string;
    end_date: string;
    product: string[];
    development: string[];
    user_experience: string[];
    quality_assurance: string[];
    risk_assessment: string[];
    [key: string]: any;
}

interface RoadmapJson {
    project_name: string;
    start_date: string;
    end_date: string;
    number_of_sprints: number;
    standard_sprint_duration: string;
    number_of_features: number;
    sprints: RawSprint[];
}

interface ComponentSprintData {
    id: string;
    label: string;
    period: string;
    product: string[];
    risk_assessment: string[];
}

interface SlideCategory {
    key: keyof RawSprint;
    title: string;
    imageKeyword: string;
}

interface SlideNavButtonProps {
    direction: 'prev' | 'next';
    onClick: () => void;
    disabled?: boolean;
    className?: string;
}

// --- Configuration ---

const SLIDE_CATEGORIES: SlideCategory[] = [
    { key: 'product', title: 'Product Management', imageKeyword: 'strategy' },
    { key: 'development', title: 'Développement', imageKeyword: 'code' },
    { key: 'user_experience', title: 'User Experience', imageKeyword: 'ux' },
    { key: 'quality_assurance', title: 'Quality Assurance', imageKeyword: 'testing' },
    { key: 'risk_assessment', title: 'Gestion des Risques', imageKeyword: 'risk' },
];

// --- Composants Utilitaires ---

const SlideNavButton: React.FC<SlideNavButtonProps> = ({
                                                           direction,
                                                           onClick,
                                                           disabled = false,
                                                           className = '',
                                                       }) => {
    const isNext = direction === 'next';

    return (
        <motion.button
            whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.2)' }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
                e.stopPropagation();
                onClick();
            }}
            disabled={disabled}
            className={`
                p-3 rounded-full flex items-center justify-center transition-colors
                text-white bg-white/10 hover:bg-white/20 backdrop-blur-md
                disabled:opacity-30 disabled:cursor-not-allowed
                ${className}
            `}
            aria-label={isNext ? "Suivant" : "Précédent"}
        >
            <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={isNext ? "" : "transform rotate-180"}
            >
                <path d="M9 18l6-6-6-6" />
            </svg>
        </motion.button>
    );
};

// --- Constantes Layout ---

const typedRoadmapData = roadmapData as RoadmapJson;
const NODE_Y_POS = 400;
const NODE_SPACING = 250;
const INITIAL_X_OFFSET = 150;
const SMALL_EDGE_LENGTH = NODE_SPACING / 2;
const OFFSET_BEFORE_NODE = 30;
const OFFSET_AFTER_NODE = -30;

// --- Helper Functions ---

const mapSprintsData = (data: RoadmapJson): ComponentSprintData[] => {
    return data.sprints.map((sprint, index) => ({
        id: `node-${index + 1}`,
        label: sprint.phase,
        period: sprint.period,
        product: sprint.product,
        risk_assessment: sprint.risk_assessment,
    }));
};

const calculateNodePositions = (sprints: ComponentSprintData[]) => {
    return sprints.reduce((acc, sprint, index) => {
        acc[sprint.id] = {
            x: INITIAL_X_OFFSET + index * NODE_SPACING,
            y: NODE_Y_POS,
        };
        return acc;
    }, {} as Record<string, { x: number, y: number }>);
};

// --- Composant Principal ---

export default function Roadmap(): React.ReactElement {
    const [selectedSprint, setSelectedSprint] = useState<RawSprint | null>(null);
    const [activeSlideIndex, setActiveSlideIndex] = useState(0);

    const sprints = useMemo(() => mapSprintsData(typedRoadmapData), []);
    const nodePositions = useMemo(() => calculateNodePositions(sprints), [sprints]);

    const lastSprintIndex = sprints.length - 1;
    const lastNodePos = nodePositions[sprints[lastSprintIndex].id];
    const projectEndDateLabel = typedRoadmapData.end_date;
    const totalWidth = INITIAL_X_OFFSET + lastSprintIndex * NODE_SPACING + INITIAL_X_OFFSET + SMALL_EDGE_LENGTH;

    useEffect(() => {
        if (selectedSprint) {
            setActiveSlideIndex(0);
        }
    }, [selectedSprint]);

    const handleCloseModal = () => setSelectedSprint(null);

    const handleNextSlide = () => {
        setActiveSlideIndex((prev) => (prev + 1) % SLIDE_CATEGORIES.length);
    };

    const handlePrevSlide = () => {
        setActiveSlideIndex((prev) => (prev - 1 + SLIDE_CATEGORIES.length) % SLIDE_CATEGORIES.length);
    };

    // Préparation des données pour la carte active
    const currentCategory = SLIDE_CATEGORIES[activeSlideIndex];

    // Construction dynamique du contenu textuel
    const cardContent = useMemo(() => {
        if (!selectedSprint) return { title: '', description: '', image: '' };

        const items = selectedSprint[currentCategory.key];
        // Transformation du tableau de string en une liste textuelle propre
        const descriptionList = Array.isArray(items)
            ? items.map(item => `• ${item}`).join('\n')
            : 'Aucune donnée disponible';

        return {
            title: `${selectedSprint.phase} : ${currentCategory.title}`,
            description: descriptionList,
            // Image fixe ou dynamique selon votre besoin. Ici dynamique par catégorie.
            image: `https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80`
        };
    }, [selectedSprint, currentCategory]);

    return (
        <>
            <div className="flex justify-center items-center min-h-screen w-full relative overflow-x-auto">
                <div
                    style={{
                        position: 'relative',
                        height: '800px',
                        width: `${totalWidth}px`,
                    }}
                >
                    {/* Rendu du Graphique Roadmap (Nodes & Edges) */}
                    {sprints.map((sprint, index) => {
                        const pos = nodePositions[sprint.id];
                        const rawSprint = typedRoadmapData.sprints[index];

                        return (
                            <React.Fragment key={sprint.id}>
                                <Edge
                                    x1={pos.x - SMALL_EDGE_LENGTH}
                                    y1={pos.y}
                                    x2={pos.x}
                                    y2={pos.y}
                                    label={rawSprint.start_date}
                                    labelOffset={OFFSET_BEFORE_NODE}
                                    labelPosition="above"
                                    variant='dashed'
                                    colorScheme='secondary'
                                />

                                <Node
                                    id={sprint.id}
                                    label={sprint.label}
                                    x={pos.x}
                                    y={pos.y}
                                    onClick={() => setSelectedSprint(rawSprint)}
                                />

                                {index < lastSprintIndex && (
                                    <Edge
                                        x1={pos.x}
                                        y1={pos.y}
                                        x2={pos.x + SMALL_EDGE_LENGTH}
                                        y2={pos.y}
                                        label={rawSprint.end_date}
                                        labelOffset={OFFSET_AFTER_NODE}
                                        labelPosition="below"
                                        variant='dashed'
                                        colorScheme='secondary'
                                    />
                                )}
                            </React.Fragment>
                        );
                    })}

                    <Edge
                        x1={lastNodePos.x}
                        y1={lastNodePos.y}
                        x2={lastNodePos.x + SMALL_EDGE_LENGTH}
                        y2={lastNodePos.y}
                        label={projectEndDateLabel}
                        labelOffset={OFFSET_AFTER_NODE}
                        labelPosition="below"
                        variant='dashed'
                        colorScheme='secondary'
                    />

                    {sprints.slice(0, -1).map((sprint, index) => {
                        const currentPos = nodePositions[sprint.id];
                        const nextPos = nodePositions[sprints[index + 1].id];

                        return (
                            <Edge
                                key={`edge-link-${index}`}
                                x1={currentPos.x + SMALL_EDGE_LENGTH}
                                y1={currentPos.y}
                                x2={nextPos.x - SMALL_EDGE_LENGTH}
                                y2={nextPos.y}
                                colorScheme='neutral'
                                variant='solid'
                            />
                        );
                    })}
                </div>
            </div>

            {/* Modale */}
            <AnimatePresence>
                {selectedSprint && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                        onClick={handleCloseModal}
                    >
                        <div
                            className="flex items-center justify-center gap-6 w-full max-w-5xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <SlideNavButton
                                direction="prev"
                                onClick={handlePrevSlide}
                            />

                            {/* Conteneur principal modifié en flex column */}
                            <div className="flex-1 max-w-2xl flex flex-col items-center gap-4">
                                <SlidingDoorCard
                                    imageSrc={cardContent.image}
                                    imageAlt={cardContent.title}
                                    title={cardContent.title}
                                    description={cardContent.description}
                                    buttonText="Fermer"
                                    onButtonClick={handleCloseModal}
                                />

                                {/* Pagination déplacée ici */}
                                <div className="flex gap-2 mt-2">
                                    {SLIDE_CATEGORIES.map((cat, idx) => (
                                        <button
                                            key={cat.key}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveSlideIndex(idx);
                                            }}
                                            className={`h-2 rounded-full transition-all duration-300 ${
                                                idx === activeSlideIndex ? 'bg-white w-8' : 'bg-white/40 w-2 hover:bg-white/70'
                                            }`}
                                        />
                                    ))}
                                </div>
                            </div>

                            <SlideNavButton
                                direction="next"
                                onClick={handleNextSlide}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}