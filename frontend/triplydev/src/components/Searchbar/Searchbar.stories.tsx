import type { Meta, StoryObj } from '@storybook/react';
import { SearchBar } from './SearchBar';

const meta: Meta<typeof SearchBar> = {
    title: 'Components/SearchBar',
    component: SearchBar,
    tags: ['autodocs'],
    argTypes: {
        placeholder: { control: 'text' },
        className: { control: 'text' },
    },
    parameters: {
        layout: 'centered',
    },
};

export default meta;

type Story = StoryObj<typeof SearchBar>;

export const Default: Story = {
    args: {
        placeholder: 'Où voulez-vous aller?',
    },
};

export const CustomWidth: Story = {
    args: {
        placeholder: 'Recherchez votre destination...',
        className: 'max-w-xl',
    },
};

export const Disabled: Story = {
    args: {
        placeholder: 'Recherche désactivée',
        disabled: true,
    },
};