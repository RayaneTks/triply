import React, { useMemo, useState } from 'react';
import { Node, Edge, SlidingDoorCard } from "triply-docs-lib";
import { AnimatePresence, motion } from 'framer-motion';
import roadmapData from '../../data/roadmap.json';

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

const typedRoadmapData = roadmapData as RoadmapJson;

const NODE_Y_POS = 400;
const NODE_SPACING = 250;
const INITIAL_X_OFFSET = 150;
const SMALL_EDGE_LENGTH = NODE_SPACING / 2;

const OFFSET_BEFORE_NODE = 30;
const OFFSET_AFTER_NODE = -30;

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

export default function Roadmap(): React.ReactElement {
    const [selectedSprint, setSelectedSprint] = useState<RawSprint | null>(null);

    const sprints = useMemo(() => mapSprintsData(typedRoadmapData), []);
    const nodePositions = useMemo(() => calculateNodePositions(sprints), [sprints]);

    const lastSprintIndex = sprints.length - 1;
    const lastNodePos = nodePositions[sprints[lastSprintIndex].id];
    const projectEndDateLabel = typedRoadmapData.end_date;
    const totalWidth = INITIAL_X_OFFSET + lastSprintIndex * NODE_SPACING + INITIAL_X_OFFSET + SMALL_EDGE_LENGTH;

    const handleCloseModal = () => setSelectedSprint(null);

    return (
        <>
            <div className="flex justify-center items-center min-h-screen w-full relative">
                <div
                    style={{
                        position: 'relative',
                        height: '800px',
                        width: `${totalWidth}px`,
                    }}
                >
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

            <AnimatePresence>
                {selectedSprint && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                        onClick={handleCloseModal}
                    >
                        <div onClick={(e) => e.stopPropagation()}>
                            <SlidingDoorCard
                                imageSrc="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80"
                                imageAlt={selectedSprint.phase}
                                title={selectedSprint.phase}
                                description={`Objectifs Principaux: ${selectedSprint.product.join(', ')}. Risques: ${selectedSprint.risk_assessment.join(', ')}`}
                                buttonText="Fermer"
                                onButtonClick={handleCloseModal}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}