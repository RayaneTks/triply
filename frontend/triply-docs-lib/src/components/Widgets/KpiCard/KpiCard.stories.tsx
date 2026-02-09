import type { Meta, StoryObj } from '@storybook/react';
import { KpiCard } from './KpiCard';

const meta: Meta<typeof KpiCard> = {
    title: 'Dashboard/Widgets/KpiCard',
    component: KpiCard,
    tags: ['autodocs'],
    args: {
        title: 'Tickets Terminés',
        value: 125,
        trendValue: 5,
        trendType: 'positive',
        icon: '✅',
        accentColor: '#007bff'
    },
};

const BugIconComponent: React.FC = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 21c-3 0-5.5-2.2-6-5l-4-4 4-4c.5-2.8 3-5 6-5s5.5 2.2 6 5l4 4-4 4c-.5 2.8-3 5-6 5z" />
        <line x1="12" y1="12" x2="12" y2="12" />
    </svg>
);

export default meta;
type Story = StoryObj<typeof KpiCard>;


export const PositiveTrend: Story = {
    args: {
        title: 'Vélocité Moyenne (pts)',
        value: 15.5,
        trendValue: '+2.1 pts',
        trendType: 'positive',
        icon: <BugIconComponent />,
        accentColor: '#28a745',
    },
};

export const NegativeTrend: Story = {
    args: {
        title: 'Bugs Ouverts',
        value: 12,
        trendValue: 4,
        trendType: 'negative',
        icon: <BugIconComponent />,
        accentColor: '#dc3545',
    },
};

export const NeutralTrend: Story = {
    args: {
        title: 'Total Tickets (Backlog)',
        value: 345,
        trendValue: 'stable',
        trendType: 'neutral',
        icon: <BugIconComponent />,
        accentColor: '#ffc107',
    },
};