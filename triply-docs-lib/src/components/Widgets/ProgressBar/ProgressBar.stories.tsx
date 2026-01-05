import type { Meta, StoryObj } from '@storybook/react';
import { ProgressBar } from './ProgressBar';

const meta: Meta<typeof ProgressBar> = {
    title: 'Dashboard/Widgets/ProgressBar',
    component: ProgressBar,
    tags: ['autodocs'],
    args: {
        label: 'Avancement du Sprint (Story Points)',
        percentage: 65,
        color: '#0070c0',
        height: 20
    },
    argTypes: {
        percentage: { control: { type: 'range', min: 0, max: 100, step: 1 } },
        color: { control: 'color' },
    }
};

export default meta;
type Story = StoryObj<typeof ProgressBar>;

export const DefaultProgress: Story = {};

export const Completed: Story = {
    args: {
        percentage: 100,
        label: 'Tâche Finale Terminée',
        color: '#28a745',
    },
};

export const Warning: Story = {
    args: {
        percentage: 85,
        label: 'Tickets Bloqués (85% de l\'échéance écoulée)',
        color: '#ffc107',
    },
};

export const ThinBar: Story = {
    args: {
        percentage: 42,
        label: 'Avancement Tâche Personnelle',
        height: 10,
    },
};