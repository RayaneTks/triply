import type { Meta, StoryObj } from '@storybook/react';
import {TeamCharCard} from "./TeamCharCard";

const meta: Meta<typeof TeamCharCard> = {
    title: 'Composants/Organigramme/TeamCharCard',
    component: TeamCharCard,
    tags: ['autodocs'],
    argTypes: {
        titre: { control: 'text' },
        sousTitre: { control: 'text' },
    },
};

export default meta;
type Story = StoryObj<typeof TeamCharCard>;


/**
 * L'état par défaut de la carte, avec un titre et un sous-titre.
 */
export const Defaut: Story = {
    args: {
        titre: 'Léa Dalfin',
        sousTitre: 'Directrice Générale',
    },
};

/**
 * Une carte avec seulement un titre.
 */
export const TitreSeul: Story = {
    args: {
        titre: 'Service Comptabilité',
    },
};

/**
 * Vous pouvez même passer du JSX dans le titre,
 * car nous l'avons typé en React.ReactNode.
 */
export const AvecTitreJSX: Story = {
    args: {
        titre: (
            <div className="flex items-center gap-2">
                <span className="text-red-500">Triply Project</span>
            </div>
        ),
        sousTitre: 'Équipe prioritaire',
    },
};