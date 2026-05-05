# Triply Docs Lib

Librairie de composants React avec TypeScript et Tailwind CSS.

> L’application voyage par défaut est la **SPA à la racine du dépôt** ; cette librairie sert de catalogue de composants et peut être consommée par plusieurs frontends.

## 🚀 Installation

```bash
npm install
```

## 📦 Scripts disponibles

### Développement

```bash
# Lancer Storybook pour développer et visualiser les composants
npm run storybook
```

Storybook sera accessible sur : http://localhost:6006

### Build

```bash
# Builder la librairie pour la production
npm run build
```

Les fichiers buildés seront dans le dossier `dist/`

```bash
# Builder Storybook pour le déploiement
npm run build-storybook
```

## 🛠️ Stack technique

- **React** 19.2.0
- **TypeScript** 5.9.3
- **Tailwind CSS** 3.x
- **Vite** 6.4.1
- **Storybook** 8.6.14

## 📝 Créer un nouveau composant

### 1. Créer le composant dans `src/components/`

Exemple : `src/components/Card.tsx`

```tsx
import React from 'react';

export interface CardProps {
    title: string;
    description?: string;
    variant?: 'default' | 'bordered';
}

export const Card: React.FC<CardProps> = ({
                                              title,
                                              description,
                                              variant = 'default'
                                          }) => {
    return (
        <div className={`p-4 rounded-lg ${
            variant === 'bordered'
                ? 'border-2 border-gray-300'
                : 'bg-gray-100'
        }`}>
            <h3 className="text-xl font-bold">{title}</h3>
            {description && <p className="mt-2 text-gray-600">{description}</p>}
        </div>
    );
};
```

### 2. Créer le fichier story `.stories.tsx`

Exemple : `src/components/Card.stories.tsx`

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Card } from './Card';

const meta = {
    title: 'Components/Card',
    component: Card,
    tags: ['autodocs'],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        title: 'Card Title',
        description: 'This is a card description',
        variant: 'default',
    },
};

export const Bordered: Story = {
    args: {
        title: 'Bordered Card',
        description: 'This card has a border',
        variant: 'bordered',
    },
};
```

### 3. Exporter le composant dans `src/index.ts`

```tsx
export { Button } from './components/Button';
export type { ButtonProps } from './components/Button';

export { Card } from './components/Card';
export type { CardProps } from './components/Card';
```

### 4. Tester dans Storybook

```bash
npm run storybook
```

Ouvrez http://localhost:6006 et naviguez vers votre composant.

### 5. Builder la librairie

```bash
npm run build
```

## 📂 Structure du projet

```
triply-docs-lib/
├── src/
│   ├── components/
│   │   ├── Button.tsx
│   │   ├── Button.stories.tsx
│   │   └── ...
│   ├── styles.css
│   └── index.ts
├── .storybook/
│   ├── main.ts
│   └── preview.ts
├── dist/                 # Généré après npm run build
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

## 🎨 Utilisation de Tailwind CSS

Tailwind CSS est configuré et prêt à l'emploi. Utilisez les classes utilitaires directement dans vos composants :

```tsx
<button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
    Click me
</button>
```

## 📚 Documentation des composants

Storybook génère automatiquement la documentation de vos composants grâce au tag `'autodocs'`.

## 🔧 Configuration

### Tailwind CSS

Configuration dans `tailwind.config.js` :

```javascript
export default {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {},
    },
    plugins: [],
}
```

### TypeScript

Configuration dans `tsconfig.json` pour le build de la librairie.

### Vite

Configuration dans `vite.config.ts` pour générer les fichiers ESM et CJS.

## 📦 Publication

Avant de publier sur NPM :

1. Mettez à jour la version dans `package.json`
2. Buildez la librairie : `npm run build`
3. Publiez : `npm publish`

## 🤝 Contribution

1. Créez une branche pour votre fonctionnalité
2. Développez votre composant avec sa story
3. Testez dans Storybook
4. Commitez vos changements
5. Créez une Pull Request

## 📄 Licence

ISC