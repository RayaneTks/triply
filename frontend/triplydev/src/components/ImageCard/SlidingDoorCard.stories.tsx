import type { Meta, StoryObj } from '@storybook/react';
import { SlidingDoorCard } from './SlidingDoorCard';

// @ts-ignore
import node1 from '@assets/node1.jpg';
// @ts-ignore
import node2 from '@assets/node2.jpg';

const meta: Meta<typeof SlidingDoorCard> = {
    title: 'Components/SlidingDoorCard',
    component: SlidingDoorCard,
    tags: ['autodocs'],
    parameters: {
        layout: 'centered',
    },
    argTypes: {
        onButtonClick: { action: 'clicked' }
    }
};

export default meta;
type Story = StoryObj<typeof SlidingDoorCard>;

export const Default: Story = {
    args: {
        imageSrc: node1 || 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80',
        imageAlt: 'Paysage brumeux',
        title: 'Projet Alpha',
        description: 'Une description détaillée du projet Alpha qui se révèle. Ce texte a plus de place pour respirer dans cette configuration horizontale.',
        buttonText: 'Accéder au Dashboard',
    },
};

export const ShowcaseGrid: Story = {
    render: (args) => (
        <div className="flex flex-col gap-8 bg-slate-50 p-10 min-h-screen items-center">
            <div className="text-slate-500 mb-4">Cliquez sur une carte pour faire coulisser</div>
            <SlidingDoorCard {...args} title="Module 1" imageSrc={node1 || 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80'} />
            <SlidingDoorCard {...args} title="Module 2" imageSrc={node2 || 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80'} />
        </div>
    ),
    args: {
        ...Default.args,
    }
};