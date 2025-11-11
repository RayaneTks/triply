import type { Meta, StoryObj } from '@storybook/react';
import { Logo } from './Logo';

const meta: Meta<typeof Logo> = {
    title: 'Components/Logo',
    component: Logo,
    tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Logo>;

export const Default: Story = {
    args: {
        width: 120,
        height: 120,
        alt: 'Mon Logo',
    },
};

export const Small: Story = {
    args: {
        width: 60,
        height: 60,
        alt: 'Logo petit',
    },
};

export const Large: Story = {
    args: {
        width: 200,
        height: 200,
        alt: 'Logo grand',
    },
};
