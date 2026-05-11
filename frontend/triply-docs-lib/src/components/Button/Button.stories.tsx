import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
    title: 'Components/Button',
    component: Button,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Button>;

export const DarkVariants: Story = {
    render: (args) => (
        <div className="flex gap-4 bg-black p-4">
            <Button {...args} label="Dark Tone 1" variant="dark" tone="tone1" />
            <Button {...args} label="Dark Tone 2" variant="dark" tone="tone2" />
        </div>
    ),
};

export const LightVariants: Story = {
    render: (args) => (
        <div className="flex gap-4">
            <Button {...args} label="Light Tone 1" variant="light" tone="tone1" />
            <Button {...args} label="Light Tone 2" variant="light" tone="tone2" />
        </div>
    ),
};
