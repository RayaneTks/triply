import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { SliderMenu } from './SliderMenu';
import { SlideDefinition } from './types';

const createSlides = (count: number): SlideDefinition[] =>
    Array.from({ length: count }).map((_, i) => ({
        id: `slide-${i}`,
        title: `Slide ${i + 1} : ${['Introduction', 'Concept', 'Architecture', 'Demo', 'Conclusion'][i % 5]}`,
        content: null,
    }));

const simpleSlides = createSlides(5);
const manySlides = createSlides(20);

const meta = {
    title: 'Powerpoint/SliderMenu',
    component: SliderMenu,
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component: "Menu latéral coulissant (Drawer) avec animation 'stagger' sur les éléments de la liste. Il gère son propre état d'ouverture mais reçoit l'index actif via les props.",
            },
            story: {
                inline: false,
                height: '400px',
            },
        },
    },
    tags: ['autodocs'],
    argTypes: {
        currentIndex: {
            control: { type: 'number', min: 0 },
            description: "Index de la slide active",
        },
        slides: {
            description: "Liste des définitions de slides (titre, id, etc.)",
        },
    },
    args: {
        onSelect: fn(),
    },
} satisfies Meta<typeof SliderMenu>;

export default meta;
type Story = StoryObj<typeof meta>;


export const Default: Story = {
    args: {
        slides: simpleSlides,
        currentIndex: 0,
    },
    render: (args) => (
        <div className="h-screen w-full bg-slate-100 p-8 transform scale-100">
            <p className="text-slate-500 mb-4 pl-10">
                Le menu est fermé par défaut. Cliquez sur l'icône burger en haut à gauche.
            </p>
            <SliderMenu {...args} />
        </div>
    ),
};

export const ActiveSlideSelected: Story = {
    args: {
        slides: simpleSlides,
        currentIndex: 2,
    },
    render: (args) => (
        <div className="h-screen w-full bg-slate-100 p-8 transform scale-100">
            <p className="text-slate-500 mb-4 pl-10">
                Ouvrez le menu pour voir l'état actif sur la 3ème slide.
            </p>
            <SliderMenu {...args} />
        </div>
    ),
};

export const ScrollingContent: Story = {
    args: {
        slides: manySlides,
        currentIndex: 15,
    },
    render: (args) => (
        <div className="h-screen w-full bg-slate-100 p-8 transform scale-100">
            <p className="text-slate-500 mb-4 pl-10">
                Ce menu contient 20 éléments pour tester le défilement vertical à l'intérieur du drawer.
            </p>
            <SliderMenu {...args} />
        </div>
    ),
};