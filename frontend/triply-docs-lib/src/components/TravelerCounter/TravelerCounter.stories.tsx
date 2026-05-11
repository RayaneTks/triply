import type { Meta, StoryObj } from '@storybook/react';
import { TravelerCounter, TravelerCounterProps } from './TravelerCounter';

const meta: Meta<TravelerCounterProps> = {
    title: 'Components/TravelerCounter (Simple Field)',
    component: TravelerCounter,
    tags: ['autodocs'],
    argTypes: {
        count: {
            control: { type: 'number', min: 1 },
            description: 'Le nombre de voyageurs affiché dans le champ.',
        },
        onClick: {
            action: 'fieldClicked',
            description: "Action déclenchée lors du clic sur le champ, qui devrait ouvrir le sélecteur réel.",
        },
        className: { control: 'text' },
    },
    parameters: {
        layout: 'centered',
    },
};

export default meta;

type Story = StoryObj<TravelerCounterProps>;

export const Default: Story = {
    args: {
        count: 2,
    },
};

export const SingleTraveler: Story = {
    args: {
        count: 1,
    },
};

export const GroupTravel: Story = {
    args: {
        count: 5,
    },
};