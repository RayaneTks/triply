import type { MetadataRoute } from 'next';

// Manifest PWA natif Next (App Router). Next injecte automatiquement
// <link rel="manifest" href="/manifest.webmanifest"> dans le <head>.
// Couleurs : charte designer cyan (--primary #0096C7). Aucun emerald.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Triply — Planification de voyage',
    short_name: 'Triply',
    description:
      'Planifiez vos voyages et gardez votre itinéraire accessible même hors-ligne, à l’étranger sans réseau.',
    lang: 'fr',
    dir: 'ltr',
    start_url: '/voyages',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0B1120',
    theme_color: '#0096C7',
    categories: ['travel', 'navigation', 'lifestyle'],
    icons: [
      {
        src: '/icons/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  };
}
