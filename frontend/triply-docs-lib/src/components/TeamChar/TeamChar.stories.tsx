import type { Meta, StoryObj } from '@storybook/react';
import {TeamCharNode} from "./TeamChar";
import {TeamChar} from "./TeamChar";

const meta: Meta<typeof TeamChar> = {
    title: 'Composants/Organigramme/TeamChar',
    component: TeamChar,
    tags: ['autodocs'],
    argTypes: {
        data: { control: 'object' },
        lineColor: { control: 'color' },
    },
};

export default meta;
type Story = StoryObj<typeof TeamChar>;

const dataTest: TeamCharNode = {
    id: '1',
    label: 'Rayane BOUDAOUD',
    sousTitre: 'Chef de projet',
    enfants: [
        {
            id: '2',
            label: 'Elias SAADI ',
            sousTitre: 'Lead Tech',
            enfants: [
                { id: '4', label: 'Florent', sousTitre: 'Dev Front' },
                { id: '5', label: 'Kévin', sousTitre: 'Dev Back' },
            ],
        },
        {
            id: '3',
            label: 'Duncan GAUBERT ',
            sousTitre: 'Product Owner',
        },
        {
            id: '4',
            label: 'Amir SAID',
            sousTitre: 'Scrum Master',
            enfants: [
                { id: '6', label: 'Cissé ABDOU ', sousTitre: 'UX Designer' },
            ]
        },
    ],
};


/**
 * Affichage par défaut de l'organigramme complet.
 */
export const Defaut: Story = {
    args: {
        data: dataTest,
    },
};

/**
 * Un organigramme simple avec un seul enfant.
 */
export const Simple: Story = {
    args: {
        data: {
            id: 'a',
            label: 'Parent',
            enfants: [
                { id: 'b', label: 'Enfant 1', sousTitre: 'Rôle 1' },
            ],
        },
    },
};

/**
 * Test de la prop 'lineColor' pour changer la couleur des lignes.
 */
export const LignesRouges: Story = {
    args: {
        data: dataTest,
        lineColor: '#EF4444',
    },
};