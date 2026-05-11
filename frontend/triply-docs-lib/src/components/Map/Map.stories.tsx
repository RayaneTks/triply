import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { WorldMap } from './Map';

// Token d'accès API - Pour utiliser une variable d'environnement, configurez-la dans .storybook/main.ts
const ACCESS_TOKEN = 'pk.eyJ1IjoiZHVuY2FuZ2F1YmVydCIsImEiOiJjbWs1em50ZjgwaHc3M2VxczYweWR2djBwIn0.pwM2awFdHHSRsQeYiTtkXA';

const meta: Meta<typeof WorldMap> = {
    title: 'Components/Map',
    component: WorldMap,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Composant de carte interactive. Nécessite un token d\'accès API pour fonctionner.',
            },
        },
    },
    argTypes: {
        accessToken: {
            control: 'text',
            description: 'Token d\'accès API (obligatoire)',
        },
        initialLatitude: {
            control: 'number',
            description: 'Latitude initiale',
        },
        initialLongitude: {
            control: 'number',
            description: 'Longitude initiale',
        },
        initialZoom: {
            control: { type: 'range', min: 0, max: 20, step: 0.5 },
            description: 'Niveau de zoom initial',
        },
        mapStyle: {
            control: 'select',
            options: [
                'mapbox://styles/mapbox/streets-v12',
                'mapbox://styles/mapbox/outdoors-v12',
                'mapbox://styles/mapbox/light-v11',
                'mapbox://styles/mapbox/dark-v11',
                'mapbox://styles/mapbox/satellite-v9',
                'mapbox://styles/mapbox/satellite-streets-v12',
                'mapbox://styles/mapbox/navigation-day-v1',
                'mapbox://styles/mapbox/navigation-night-v1',
            ],
            description: 'Style de la carte',
        },
        height: {
            control: 'text',
            description: 'Hauteur de la carte',
        },
        width: {
            control: 'text',
            description: 'Largeur de la carte',
        },
    },
};

export default meta;
type Story = StoryObj<typeof WorldMap>;

export const Default: Story = {
    args: {
        accessToken: ACCESS_TOKEN,
        initialLatitude: 46.6034,
        initialLongitude: 1.8883,
        initialZoom: 2,
        height: '600px',
        width: '100%',
    },
};

export const SatelliteView: Story = {
    args: {
        accessToken: ACCESS_TOKEN,
        initialLatitude: 46.6034,
        initialLongitude: 1.8883,
        initialZoom: 2,
        mapStyle: 'mapbox://styles/mapbox/satellite-v9',
        height: '600px',
        width: '100%',
    },
};

export const DarkMode: Story = {
    args: {
        accessToken: ACCESS_TOKEN,
        initialLatitude: 46.6034,
        initialLongitude: 1.8883,
        initialZoom: 2,
        mapStyle: 'mapbox://styles/mapbox/dark-v11',
        height: '600px',
        width: '100%',
    },
};

export const CustomLocation: Story = {
    args: {
        accessToken: ACCESS_TOKEN,
        initialLatitude: 48.8566,
        initialLongitude: 2.3522,
        initialZoom: 10,
        height: '600px',
        width: '100%',
    },
};

