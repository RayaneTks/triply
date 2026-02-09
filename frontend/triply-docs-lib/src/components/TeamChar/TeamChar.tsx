import React from 'react';
import {Tree, TreeNode} from 'react-organizational-chart';
import {TeamCharCard} from "./TeamCharCard.tsx";


/**
 * Définit la structure des données que l'organigramme attend.
 * C'est ce que votre application devra fournir.
 */
export interface TeamCharNode {
    id: string;
    label: React.ReactNode;
    sousTitre?: string;
    enfants?: TeamCharNode[];
}

/**
 * Définit les props de votre composant principal
 */
export interface TeamCharProps {
    /** Les données de l'organigramme, en commençant par la racine */
    data: TeamCharNode;
    /** Couleur des lignes (optionnel, gris par défaut) */
    lineColor?: string;
}

// --- FIN DES TYPES ---

/**
 * C'est le seul composant que l'application utilisera.
 * Il assemble la logique (lignes) et le design (votre carte).
 */
export const TeamChar: React.FC<TeamCharProps> = ({
                                                             data,
                                                             lineColor = '#F5E6CA',
                                                         }) => {

    const renderNode = (node: TeamCharNode) => (
        <TreeNode
            key={node.id}
            label={
                <TeamCharCard titre={node.label} sousTitre={node.sousTitre}/>
            }
        >
            {node.enfants && node.enfants.map(renderNode)}
        </TreeNode>
    );

    return (
        <Tree
            label={
                <TeamCharCard titre={data.label} sousTitre={data.sousTitre}/>
            }
            lineWidth={'2px'}
            lineColor={lineColor}
            lineBorderRadius={'10px'}
        >
            {data.enfants && data.enfants.map(renderNode)}
        </Tree>
    );
};