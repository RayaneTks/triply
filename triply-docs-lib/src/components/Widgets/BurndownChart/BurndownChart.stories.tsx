// src/components/BurndownChart.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { BurndownChart } from './BurndownChart';
import {BurndownDataPoint} from "../../../types/burndown";

const initialWork = 50;

const mockBurndownData: BurndownDataPoint[] = [
    { day: 'J1', ideal: 50, actual: 48 },
    { day: 'J2', ideal: 45, actual: 45 },
    { day: 'J3', ideal: 40, actual: 40 },
    { day: 'J4', ideal: 35, actual: 30 },
    { day: 'J5', ideal: 30, actual: 25 },
    { day: 'J6', ideal: 25, actual: 25 },
    { day: 'J7', ideal: 20, actual: 25 },
    { day: 'J8', ideal: 15, actual: 15 },
    { day: 'J9', ideal: 10, actual: 10 },
    { day: 'J10', ideal: 5, actual: 0 },
];

const meta: Meta<typeof BurndownChart> = {
    title: 'Dashboard/Visualisation/BurndownChart',
    component: BurndownChart,
    tags: ['autodocs'],
    args: {
        title: 'Suivi de Sprint (50 Points)',
        data: mockBurndownData.map(item => ({ ...item })),
    },
    decorators: [
        (Story, context) => {
            const clonedArgs = { ...context.args };
            if (clonedArgs.data && Array.isArray(clonedArgs.data)) {
                clonedArgs.data = clonedArgs.data.map(item => ({ ...item }));
            }
            return <Story args={clonedArgs} />;
        },
    ],
};

export default meta;
type Story = StoryObj<typeof BurndownChart>;

export const NormalProgress: Story = {
    args: {
        data: mockBurndownData.map(item => ({ ...item })),
    }
};

export const DelayedSprint: Story = {
    args: {
        title: 'Retard de Sprint (Nécessite une correction de trajectoire)',
        data: [
            { day: 'J1', ideal: 50, actual: 50 },
            { day: 'J2', ideal: 45, actual: 48 },
            { day: 'J3', ideal: 40, actual: 45 },
            { day: 'J4', ideal: 35, actual: 40 },
            { day: 'J5', ideal: 30, actual: 35 },
            { day: 'J10', ideal: 5, actual: 20 },
        ].map(item => ({ ...item })),
    },
};