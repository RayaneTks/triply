import type { Meta, StoryObj } from '@storybook/react';
import { PaperAirplane } from './PaperAirplane';

const meta: Meta<typeof PaperAirplane> = {
    title: 'Animations/PaperAirplane',
    component: PaperAirplane,
    tags: ['autodocs'],
    args: {
        size: 48,
        color: '#0096c7',
    },
    argTypes: {
        size: { control: { type: 'range', min: 24, max: 200, step: 1 } },
        color: { control: 'color' },
    },
};

export default meta;
type Story = StoryObj<typeof PaperAirplane>;

export const DefaultAirplane: Story = {};

export const LargeBlueAirplane: Story = {
    args: {
        size: 96,
        color: '#0096c7',
    },
};

export const SmallRedAirplane: Story = {
    args: {
        size: 32,
        color: '#0096c7',
    },
};