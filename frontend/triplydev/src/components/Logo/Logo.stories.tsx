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
        tone: 'light',
    },
};

export const Small: Story = {
    args: {
        size: 'small',
        alt: 'Logo petit',
        tone: 'light',
    },
};

export const Large: Story = {
    args: {
        size: 'large',
        alt: 'Logo grand',
        tone: 'light',
    },
};

export const Light: Story = {
    args: {
        size: 'default',
        alt: 'Logo Light',
        tone: 'light',
    },
};

export const LightColorless: Story = {
    args: {
        size: 'default',
        alt: 'Logo Light Colorless',
        tone: 'light-colorless',
    },
};

export const Dark: Story = {
    args: {
        size: 'default',
        alt: 'Logo Dark',
        tone: 'dark',
    },
    decorators: [
        (Story) => (
            <div style={{ backgroundColor: '#1a1a1a', padding: '20px', display: 'inline-block' }}>
                <Story />
            </div>
        ),
    ],
};

export const DarkColorless: Story = {
    args: {
        size: 'default',
        alt: 'Logo Dark Colorless',
        tone: 'dark-colorless',
    },
    decorators: [
        (Story) => (
            <div style={{ backgroundColor: '#1a1a1a', padding: '20px', display: 'inline-block' }}>
                <Story />
            </div>
        ),
    ],
};

export const AllTones: Story = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
                <h3 style={{ margin: 0, color: '#333' }}>Light</h3>
                <Logo tone="light" size="default" alt="Logo Light" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
                <h3 style={{ margin: 0, color: '#333' }}>Light Colorless</h3>
                <Logo tone="light-colorless" size="default" alt="Logo Light Colorless" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', backgroundColor: '#1a1a1a', padding: '20px', borderRadius: '8px' }}>
                <h3 style={{ margin: 0, color: '#fff' }}>Dark</h3>
                <Logo tone="dark" size="default" alt="Logo Dark" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', backgroundColor: '#1a1a1a', padding: '20px', borderRadius: '8px' }}>
                <h3 style={{ margin: 0, color: '#fff' }}>Dark Colorless</h3>
                <Logo tone="dark-colorless" size="default" alt="Logo Dark Colorless" />
            </div>
        </div>
    ),
};
