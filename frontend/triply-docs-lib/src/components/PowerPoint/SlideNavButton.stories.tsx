import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { SlideNavButton } from './SlideNavButton';

const meta = {
    title: 'Powerpoint/SlideNavButton',
    component: SlideNavButton,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {
        direction: {
            control: 'inline-radio',
            options: ['prev', 'next'],
            description: 'Direction de la navigation',
        },
        disabled: {
            control: 'boolean',
        },
        className: {
            control: 'text',
        },
    },
    args: {
        onClick: fn(),
    },
} satisfies Meta<typeof SlideNavButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Next: Story = {
    args: {
        direction: 'next',
    },
};

export const Previous: Story = {
    args: {
        direction: 'prev',
    },
};

export const Disabled: Story = {
    args: {
        direction: 'next',
        disabled: true,
    },
};

export const RevealStyle: Story = {
    args: {
        direction: 'next',
        className: 'hover:bg-transparent hover:text-blue-600 scale-125',
    },
    parameters: {
        backgrounds: { default: 'dark' },
    }
};