import type { Meta, StoryObj } from '@storybook/react';
import { StackedWorkloadChart } from './StackedWorkloadChart';
import {WorkloadDataPoint} from "../../../types/workload";

const mockWorkloadData: WorkloadDataPoint[] = [
    { assignee: 'Alice', toDo: 2, inProgress: 5, inReview: 1, blocked: 0 },
    { assignee: 'Bob', toDo: 4, inProgress: 8, inReview: 0, blocked: 1 },
    { assignee: 'Charlie', toDo: 1, inProgress: 3, inReview: 6, blocked: 0 },
    { assignee: 'David', toDo: 6, inProgress: 2, inReview: 1, blocked: 0 },
];

const DeepCloneDecorator = (Story, context) => {
    const clonedArgs = { ...context.args };
    if (clonedArgs.data && Array.isArray(clonedArgs.data)) {
        clonedArgs.data = clonedArgs.data.map(item => ({ ...item }));
    }
    return <Story args={clonedArgs} />;
};


const meta: Meta<typeof StackedWorkloadChart> = {
    title: 'Dashboard/Visualisation/StackedWorkloadChart',
    component: StackedWorkloadChart,
    tags: ['autodocs'],
    args: {
        title: 'Charge de Travail par Assigné et par Statut',
        data: mockWorkloadData,
    },
    decorators: [DeepCloneDecorator],
};

export default meta;
type Story = StoryObj<typeof StackedWorkloadChart>;


export const CurrentWorkload: Story = {};

export const BottleneckScenario: Story = {
    args: {
        title: 'Goulot d\'Étranglement en Revue',
        data: [
            { assignee: 'Dev-1', toDo: 0, inProgress: 1, inReview: 8, blocked: 0 },
            { assignee: 'Dev-2', toDo: 5, inProgress: 1, inReview: 1, blocked: 0 },
            { assignee: 'QA-1', toDo: 0, inProgress: 0, inReview: 0, blocked: 0 }, // QA sous-utilisé
        ],
    },
};