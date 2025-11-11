import { Node } from "triply-docs-lib";
import { Edge } from "triply-docs-lib";

export default function Roadmap() {
    const node1Pos = { x: 150, y: 150 };
    const node2Pos = { x: 350, y: 150 };
    const node3Pos = { x: 550, y: 150 };
    const node4Pos = { x: 750, y: 150 };
    const node5Pos = { x: 950, y: 150 };

    return (
        <div className="flex justify-center items-center min-h-screen w-full">
            <div
                style={{
                    position: 'relative',
                    height: '300px',
                    width: '1100px',
                }}
            >
                <Node
                    id="node-1"
                    label="Étape 1"
                    x={node1Pos.x}
                    y={node1Pos.y}
                    colorScheme="primary"
                />
                <Node
                    id="node-2"
                    label="Étape 2"
                    x={node2Pos.x}
                    y={node2Pos.y}
                    colorScheme="secondary"
                />
                <Node
                    id="node-3"
                    label="Étape 3"
                    x={node3Pos.x}
                    y={node3Pos.y}
                    colorScheme="primary"
                />
                <Node
                    id="node-4"
                    label="Étape 4"
                    x={node4Pos.x}
                    y={node4Pos.y}
                    colorScheme="secondary"
                />
                <Node
                    id="node-5"
                    label="Étape 5"
                    x={node5Pos.x}
                    y={node5Pos.y}
                    colorScheme="primary"
                />

                <Edge
                    x1={node1Pos.x} y1={node1Pos.y}
                    x2={node2Pos.x} y2={node2Pos.y}
                />
                <Edge
                    x1={node2Pos.x} y1={node2Pos.y}
                    x2={node3Pos.x} y2={node3Pos.y}
                />
                <Edge
                    x1={node3Pos.x} y1={node3Pos.y}
                    x2={node4Pos.x} y2={node4Pos.y}
                />
                <Edge
                    x1={node4Pos.x} y1={node4Pos.y}
                    x2={node5Pos.x} y2={node5Pos.y}
                />
            </div>
        </div>
    );
}