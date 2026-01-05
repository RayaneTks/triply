import type { Meta, StoryObj } from '@storybook/react';
import {Header, HeaderProps, NavItem} from "./Header";
import {ButtonProps} from "../Button/Button";


const DEFAULT_NAV_ITEMS: NavItem[] = [
    { id: 1, label: 'Accueil', href: '/' },
    { id: 2, label: 'Destinations', href: '/destinations' },
    { id: 3, label: 'Voyages', href: '/voyages' },
];

const DEFAULT_CTA_BUTTONS: ButtonProps[] = [
    {
        label: 'Connexion',
        onClick: () => alert('Action Connexion'),
        variant: 'secondary',
        tone: 'light',
    },
    {
        label: 'Inscription',
        onClick: () => alert('Action Inscription'),
        variant: 'primary',
        tone: 'default',
    },
];


const meta: Meta<HeaderProps> = {
    title: 'Layout/Header',
    component: Header,
    tags: ['autodocs'],
    args: {
        logoAlt: 'Triply Logo',
        navItems: DEFAULT_NAV_ITEMS,
        ctaButtons: DEFAULT_CTA_BUTTONS,
    },
    decorators: [
        (Story) => (
            <div style={{ width: '100%', borderBottom: '1px solid #eee' }}>
                <Story />
            </div>
        ),
    ],
};

export default meta;

type Story = StoryObj<HeaderProps>;

export const DefaultHeader: Story = {};

export const LoggedInHeader: Story = {
    args: {
        ctaButtons: [
            {
                label: 'Profil',
                onClick: () => alert('Aller au profil'),
                variant: 'secondary',
                tone: 'light',
            },
        ],
    },
};

export const MinimalHeader: Story = {
    args: {
        navItems: [],
        ctaButtons: [
            {
                label: 'Connexion',
                onClick: () => alert('Action Connexion'),
                variant: 'primary',
                tone: 'default',
            },
        ],
    },
};