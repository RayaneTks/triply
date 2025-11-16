import React, { useState } from 'react';
import { ImageCard, Node } from "triply-docs-lib";
import { Edge } from "triply-docs-lib";

// ... (Le type CardContent et l'objet cardData restent identiques) ...
type CardContent = {
    title: string;
    description: string;
    imageSrc: string;
    imageAlt: string;
    buttonText: string;
};

const cardData: Record<string, CardContent> = {
    'node-1': {
        title: 'Étape 1: Découverte',
        description: 'Voici la description de la première étape du processus.',
        imageSrc: 'https://via.placeholder.com/300x200?text=Etape+1',
        imageAlt: 'Illustration de l\'étape 1',
        buttonText: 'Suivant'
    },
    'node-2': {
        title: 'Étape 2: Planification',
        description: 'Planification détaillée des ressources et du calendrier.',
        imageSrc: 'https://via.placeholder.com/300x200?text=Etape+2',
        imageAlt: 'Illustration de l\'étape 2',
        buttonText: 'Suivant'
    },
    'node-3': {
        title: 'Étape 3: Exécution',
        description: 'Mise en œuvre du plan établi lors de l\'étape 2.',
        imageSrc: 'https://via.placeholder.com/300x200?text=Etape+3',
        imageAlt: 'Illustration de l\'étape 3',
        buttonText: 'Suivant'
    },
    'node-4': {
        title: 'Étape 4: Révision',
        description: 'Examen des résultats et ajustements si nécessaire.',
        imageSrc: 'https://via.placeholder.com/300x200?text=Etape+4',
        imageAlt: 'Illustration de l\'étape 4',
        buttonText: 'Suivant'
    },
    'node-5': {
        title: 'Étape 5: Lancement',
        description: 'Déploiement final et lancement officiel.',
        imageSrc: 'https://via.placeholder.com/300x200?text=Etape+5',
        imageAlt: 'Illustration de l\'étape 5',
        buttonText: 'Terminer'
    },
};


export default function Roadmap(): React.ReactElement {
    const [activeNodeId, setActiveNodeId] = useState<string | null>(null);

    // 2. Nœuds centrés verticalement (y: 400)
    const nodeYPos = 400;
    const node1Pos = { x: 150, y: nodeYPos };
    const node2Pos = { x: 350, y: nodeYPos };
    const node3Pos = { x: 550, y: nodeYPos };
    const node4Pos = { x: 750, y: nodeYPos };
    const node5Pos = { x: 950, y: nodeYPos };

    type NodePosition = { x: number, y: number };

    const nodePositions: Record<string, NodePosition> = {
        'node-1': node1Pos,
        'node-2': node2Pos,
        'node-3': node3Pos,
        'node-4': node4Pos,
        'node-5': node5Pos,
    };

    // 3. Créer un tableau ordonné des IDs
    const nodeIds = Object.keys(nodePositions); // ['node-1', 'node-2', ...]

    const handleNodeClick = (nodeId: string) => {
        setActiveNodeId(prevActiveId => (prevActiveId === nodeId ? null : nodeId));
    };

    const activeNodePos: NodePosition | null = activeNodeId
        ? nodePositions[activeNodeId]
        : null;

    const activeNodeData: CardContent | null = activeNodeId
        ? cardData[activeNodeId]
        : null;

    // 4. Logique pour le style de la carte dynamique
    let dynamicCardStyle: React.CSSProperties = {
        position: 'absolute',
        zIndex: 20,
        // Ajout d'une transition pour un effet plus doux
        transition: 'transform 0.3s ease-in-out, top 0.3s ease-in-out',
    };

    if (activeNodeId && activeNodePos) {
        const activeIndex = nodeIds.indexOf(activeNodeId);
        // Nœuds 2 (index 1) et 4 (index 3) iront au-dessus
        const positionAbove = activeIndex % 2 === 1;

        dynamicCardStyle.left = activeNodePos.x;
        dynamicCardStyle.top = activeNodePos.y; // On part toujours du 'y' du nœud

        if (positionAbove) {
            // **POSITION AU-DESSUS**
            // 1. translateX(-50%): Centre horizontalement
            // 2. translateY(-100%): Monte la carte de 100% de sa propre hauteur 
            //    (le bas de la carte touche maintenant le centre du nœud)
            // 3. translateY(-70px): Ajoute 70px d'espace
            dynamicCardStyle.transform = 'translateX(-50%) translateY(-100%) translateY(-70px)';
        } else {
            // **POSITION EN DESSOUS** (Nœuds 1, 3, 5)
            // 1. translateX(-50%): Centre horizontalement
            // 2. translateY(70px): Ajoute 70px d'espace vers le bas
            dynamicCardStyle.transform = 'translateX(-50%) translateY(70px)';
        }
    }


    return (
        <div className="flex justify-center items-center min-h-screen w-full">
            <div
                style={{
                    position: 'relative',
                    // 1. Augmentation de la hauteur pour laisser de la place
                    height: '800px',
                    width: '1100px',
                }}
            >
                {/* --- Nœuds (utilisent maintenant nodeYPos) --- */}
                <Node
                    id="node-1"
                    label="Étape 1"
                    x={node1Pos.x}
                    y={node1Pos.y}
                    /* ... reste des props ... */
                    onClick={() => handleNodeClick("node-1")}
                    isActive={activeNodeId === "node-1"}
                />
                <Node
                    id="node-2"
                    label="Étape 2"
                    x={node2Pos.x}
                    y={node2Pos.y}
                    /* ... reste des props ... */
                    onClick={() => handleNodeClick("node-2")}
                    isActive={activeNodeId === "node-2"}
                />
                <Node
                    id="node-3"
                    label="Étape 3"
                    x={node3Pos.x}
                    y={node3Pos.y}
                    /* ... reste des props ... */
                    onClick={() => handleNodeClick("node-3")}
                    isActive={activeNodeId === "node-3"}
                />
                <Node
                    id="node-4"
                    label="Étape 4"
                    x={node4Pos.x}
                    y={node4Pos.y}
                    /* ... reste des props ... */
                    onClick={() => handleNodeClick("node-4")}
                    isActive={activeNodeId === "node-4"}
                />
                <Node
                    id="node-5"
                    label="Étape 5"
                    x={node5Pos.x}
                    y={node5Pos.y}
                    /* ... reste des props ... */
                    onClick={() => handleNodeClick("node-5")}
                    isActive={activeNodeId === "node-5"}
                />

                {/* --- Liens (Edges) --- */}
                <Edge x1={node1Pos.x} y1={node1Pos.y} x2={node2Pos.x} y2={node2Pos.y} />
                <Edge x1={node2Pos.x} y1={node2Pos.y} x2={node3Pos.x} y2={node3Pos.y} />
                <Edge x1={node3Pos.x} y1={node3Pos.y} x2={node4Pos.x} y2={node4Pos.y} />
                <Edge x1={node4Pos.x} y1={node4Pos.y} x2={node5Pos.x} y2={node5Pos.y} />

                {/* --- Rendu conditionnel de la ImageCard --- */}
                {/* Le div wrapper utilise maintenant le style dynamique */}
                {activeNodePos && activeNodeData && (
                    <div style={dynamicCardStyle}>
                        <ImageCard
                            title={activeNodeData.title}
                            description={activeNodeData.description}
                            imageSrc={activeNodeData.imageSrc}
                            imageAlt={activeNodeData.imageAlt}
                            buttonText={activeNodeData.buttonText}
                            onButtonClick={() => setActiveNodeId(null)}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}