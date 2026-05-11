import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { Slide } from './Slide';
import { SlideDefinition } from './types';

// Mock Data
const mockSlides: SlideDefinition[] = [
    { id: '1', title: 'Introduction', content: null },
    { id: '2', title: 'Architecture', content: null },
    { id: '3', title: 'Conclusion', content: null },
];

const meta = {
    title: 'Powerpoint/Slide',
    component: Slide,
    parameters: {
        layout: 'fullscreen',
    },
    tags: ['autodocs'],
    argTypes: {
        direction: {
            control: { type: 'inline-radio', options: [1, -1] },
            description: "Direction de l'animation (-1 gauche, 1 droite)",
        },
        canNext: { control: 'boolean' },
        canPrev: { control: 'boolean' },
    },
    args: {
        onNext: fn(),
        onPrev: fn(),
        onJumpTo: fn(),
        slides: mockSlides,
        slideIndex: 0,
        direction: 1,
    },
    // Wrapper pour simuler le cadre de la présentation
    decorators: [
        (Story) => (
            <div className="w-full h-[600px] relative bg-slate-200 flex items-center justify-center p-8">
                <div className="relative w-[800px] h-[500px]">
                    <Story />
                </div>
            </div>
        ),
    ],
} satisfies Meta<typeof Slide>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        children: (
            <div className="flex flex-col items-center justify-center h-full text-slate-700">
                <h1 className="text-4xl font-bold mb-4">Titre de la Slide</h1>
                <p className="text-lg text-slate-500 max-w-md text-center">
                    Contenu centré par défaut. Les contrôles sont visibles aux coins.
                </p>
            </div>
        ),
    },
};

export const FirstSlide: Story = {
    args: {
        slideIndex: 0,
        canPrev: false, // Désactive le bouton précédent
        children: (
            <div className="flex flex-col items-center justify-center h-full bg-blue-50 text-blue-900">
                <h1 className="text-6xl font-black mb-6">Bienvenue</h1>
                <p className="text-xl">Ceci est la première slide.</p>
            </div>
        ),
    },
};

export const LastSlide: Story = {
    args: {
        slideIndex: 2,
        canNext: false, // Désactive le bouton suivant
        children: (
            <div className="flex flex-col items-center justify-center h-full bg-slate-900 text-white">
                <h1 className="text-5xl font-bold mb-8">Merci !</h1>
                <button className="px-6 py-3 bg-blue-600 rounded-full font-bold hover:bg-blue-500 transition">
                    Recommencer
                </button>
            </div>
        ),
    },
};