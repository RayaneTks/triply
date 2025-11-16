import React from 'react';

export interface TeamCharCardProps {
    /** Le titre principal de la carte */
    titre: React.ReactNode;
    /** Le texte secondaire (optionnel) */
    sousTitre?: string;
}

/**
 * C'est VOTRE composant "Card" personnalisé avec Tailwind.
 * Il est "stupide" et ne fait qu'afficher ce qu'on lui donne.
 */
export const TeamCharCard: React.FC<TeamCharCardProps> = ({ titre, sousTitre }) => {
    return (
        <div className="p-4 bg-white border-2 border-primary-dark rounded-lg shadow-md min-w-[180px] hover:shadow-xl transition-shadow">
            <div className="font-bold text-lg text-primary">{titre}</div>
            {sousTitre && (
                <div className="text-sm text-gray-500 italic">{sousTitre}</div>
            )}
        </div>
    );
};