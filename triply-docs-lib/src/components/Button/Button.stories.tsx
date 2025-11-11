import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
    title: 'Components/Button',
    component: Button,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Button>;

export const PrimaryVariants: Story = {
    render: (args) => (
        <div className="flex gap-4">
            <Button {...args} label="Primary Light" variant="primary" tone="light" />
            <Button {...args} label="Primary Default" variant="primary" tone="default" />
            <Button {...args} label="Primary Dark" variant="primary" tone="dark" />
        </div>
    ),
};

export const SecondaryVariants: Story = {
    render: (args) => (
        <div className="flex gap-4">
            <Button {...args} label="Secondary Light" variant="secondary" tone="light" />
            <Button {...args} label="Secondary Default" variant="secondary" tone="default" />
            <Button {...args} label="Secondary Dark" variant="secondary" tone="dark" />
        </div>
    ),
};
