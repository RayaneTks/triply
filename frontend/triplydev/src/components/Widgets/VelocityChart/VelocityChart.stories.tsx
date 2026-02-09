import type { Meta, StoryObj } from '@storybook/react';
import { VelocityChart } from './VelocityChart';
import {VelocityDataPoint} from "../../../types/velocity";

const mockVelocityData: VelocityDataPoint[] = [
    { sprint: 'S1', committed: 20, completed: 18 },
    { sprint: 'S2', committed: 25, completed: 25 },
    { sprint: 'S3', committed: 22, completed: 15 },
    { sprint: 'S4', committed: 30, completed: 28 },
    { sprint: 'S5', committed: 20, completed: 20 },
];

const DeepCloneDecorator = (Story, context) => {
    const clonedArgs = { ...context.args };
    if (clonedArgs.data && Array.isArray(clonedArgs.data)) {
        clonedArgs.data = clonedArgs.data.map(item => ({ ...item }));
    }
    return <Story args={clonedArgs} />;
};


const meta: Meta<typeof VelocityChart> = {
    title: 'Dashboard/Visualisation/VelocityChart',
    component: VelocityChart,
    tags: ['autodocs'],
    args: {
        title: 'Vélocité des 5 Derniers Sprints',
        data: mockVelocityData,
    },
    decorators: [DeepCloneDecorator],
};

export default meta;
type Story = StoryObj<typeof VelocityChart>;


export const StandardVelocity: Story = {};

export const LowPredictability: Story = {
    args: {
        title: 'Faible Prédictibilité (Variance Élevée)',
        data: [
            { sprint: 'S10', committed: 10, completed: 20 },
            { sprint: 'S11', committed: 40, completed: 15 },
            { sprint: 'S12', committed: 20, completed: 20 },
            { sprint: 'S13', committed: 30, completed: 10 },
        ],
    },
};