import type { Meta, StoryObj } from '@storybook/react';
import { CentralText } from './CentralText';

const meta: Meta<typeof CentralText> = {
    title: 'Components/CentralText',
    component: CentralText,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof CentralText>;

export const Default: Story = {
    args: {
        title: 'Titre Principal',
        subtitle: 'Sous-titre optionnel',
        linkText: 'En savoir plus',
        linkHref: '#',
    },
};

export const WithLogo: Story = {
    args: {
        title: 'Bienvenue',
        subtitle: 'Votre compagnon de voyage idéal',
        linkText: 'Commencer',
        linkHref: '#',
        logoSize: 'large',
        logoTone: 'light',
    },
};

export const LogoVariants: Story = {
    render: () => (
        <div className="space-y-12">
            <div>
                <h3 className="text-lg font-semibold mb-4">Small</h3>
                <CentralText
                    title="Titre Small"
                    subtitle="Logo small"
                    logoSize="small"
                    logoTone="light"
                />
            </div>
            <div>
                <h3 className="text-lg font-semibold mb-4">Default</h3>
                <CentralText
                    title="Titre Default"
                    subtitle="Logo default"
                    logoSize="default"
                    logoTone="light"
                />
            </div>
            <div>
                <h3 className="text-lg font-semibold mb-4">Large</h3>
                <CentralText
                    title="Titre Large"
                    subtitle="Logo large"
                    logoSize="large"
                    logoTone="light"
                />
            </div>
        </div>
    ),
};

export const LogoTones: Story = {
    render: () => (
        <div className="space-y-12">
            <div className="bg-white p-8">
                <h3 className="text-lg font-semibold mb-4">Light</h3>
                <CentralText
                    title="Logo Light"
                    logoSize="default"
                    logoTone="light"
                />
            </div>
            <div className="bg-white p-8">
                <h3 className="text-lg font-semibold mb-4">Light Colorless</h3>
                <CentralText
                    title="Logo Light Colorless"
                    logoSize="default"
                    logoTone="light-colorless"
                />
            </div>
            <div className="bg-gray-800 p-8">
                <h3 className="text-lg font-semibold mb-4 text-white">Dark</h3>
                <CentralText
                    title="Logo Dark"
                    logoSize="default"
                    logoTone="dark"
                    textColor="white"
                />
            </div>
            <div className="bg-gray-800 p-8">
                <h3 className="text-lg font-semibold mb-4 text-white">Dark Colorless</h3>
                <CentralText
                    title="Logo Dark Colorless"
                    logoSize="default"
                    logoTone="dark-colorless"
                    textColor="white"
                />
            </div>
        </div>
    ),
};

export const TextColors: Story = {
    render: () => (
        <div className="space-y-12">
            <div className="bg-white p-8">
                <h3 className="text-lg font-semibold mb-4">Texte Noir</h3>
                <CentralText
                    title="Titre en noir"
                    subtitle="Sous-titre en noir"
                    textColor="black"
                />
            </div>
            <div className="bg-gray-800 p-8">
                <h3 className="text-lg font-semibold mb-4 text-white">Texte Blanc</h3>
                <CentralText
                    title="Titre en blanc"
                    subtitle="Sous-titre en blanc"
                    textColor="white"
                />
            </div>
        </div>
    ),
};

export const WithoutButton: Story = {
    args: {
        title: 'Titre seul',
        subtitle: 'Sans bouton',
    },
};

