import type { Meta, StoryObj } from '@storybook/react';
import { ImageCard } from './ImageCard';

// @ts-ignore
import node1 from '@assets/node1.jpg';
// @ts-ignore
import node2 from '@assets/node2.jpg';
// @ts-ignore
import node3 from '@assets/node3.jpg';

const meta: Meta<typeof ImageCard> = {
    title: 'Components/ImageCard',
    component: ImageCard,
    tags: ['autodocs'],
    argTypes: {
        imageSrc: { control: 'text' },
        imageAlt: { control: 'text' },
        title: { control: 'text' },
        description: { control: 'text' },
        buttonText: { control: 'text' },
        onButtonClick: { action: 'buttonClicked' },
        className: { control: 'text' },
    },
    parameters: {
        layout: 'centered',
    },
};

export default meta;
type Story = StoryObj<typeof ImageCard>;

export const Default: Story = {
    args: {
        imageSrc: node1 || 'https://via.placeholder.com/400x300',
        imageAlt: 'Nature view',
        title: 'Titre par défaut',
        description: "Ceci est une description qui va se révéler lors de l'ouverture de la carte.",
        buttonText: 'Action',
        onButtonClick: () => alert('Bouton cliqué !'),
    },
};

export const VueMer: Story = {
    args: {
        imageSrc: node2 || 'https://via.placeholder.com/400x300',
        imageAlt: 'Vue sur mer',
        title: 'Vue Océan',
        description: "Découvrez les merveilles de l'océan avec cette carte interactive.",
        buttonText: 'Explorer',
        onButtonClick: () => alert('Exploration lancée !'),
    },
};

export const PaysageUrbain: Story = {
    args: {
        imageSrc: node3 || 'https://via.placeholder.com/400x300',
        imageAlt: 'Ville',
        title: 'Architecture',
        description: "L'urbanisme moderne rencontre le design interactif dans cet exemple.",
        buttonText: 'Détails',
        onButtonClick: () => alert('Détails affichés !'),
    },
};

export const CardGrid: Story = {
    render: (args) => (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-8 bg-gray-100 min-h-screen items-start justify-center">
            <ImageCard
                {...args}
                imageSrc={node1 || 'https://via.placeholder.com/400x300'}
                title="Carte 1"
                description="Description longue pour la carte 1 qui prendra de la place une fois ouverte."
            />
            <ImageCard
                {...args}
                imageSrc={node2 || 'https://via.placeholder.com/400x300'}
                title="Carte 2"
                description="Description pour la carte 2."
            />
            <ImageCard
                {...args}
                imageSrc={node3 || 'https://via.placeholder.com/400x300'}
                title="Carte 3"
                description="Description pour la carte 3."
            />
        </div>
    ),
    args: {
        imageAlt: 'Image grille',
        buttonText: 'Voir plus',
        onButtonClick: () => console.log('Interaction grille'),
    },
    parameters: {
        layout: 'fullscreen',
        controls: {
            exclude: ['imageSrc', 'imageAlt', 'title', 'description', 'buttonText', 'onButtonClick'],
        },
    },
};