// src/components/PieChartWidget.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { PieChartWidget } from './PieChartWidget';
import {PieChartDataPoint} from "../../../types/piechart";

const mockJiraData: PieChartDataPoint[] = [
    { name: 'À Faire', value: 40 },
    { name: 'En Cours', value: 90 },
    { name: 'Revue', value: 20 },
    { name: 'Terminé', value: 150 },
    { name: 'Bloqué', value: 5 },
];

const meta: Meta<typeof PieChartWidget> = {
    title: 'Dashboard/Widgets/JiraPieChart',
    component: PieChartWidget,
    tags: ['autodocs'],
    args: {
        title: 'Distribution des Tickets par Statut',
        data: mockJiraData.map(item => ({ ...item })),
    },
};

export default meta;
type Story = StoryObj<typeof PieChartWidget>;

export const JiraStatusDistribution: Story = {};

export const SmallDataSample: Story = {
    args: {
        title: 'Distribution des Priorités',
        data: [
            { name: 'Haute', value: 15 },
            { name: 'Moyenne', value: 45 },
            { name: 'Basse', value: 80 },
        ].map(item => ({ ...item })),
    },
};