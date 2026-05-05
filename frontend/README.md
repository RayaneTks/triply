# Frontend Triply

Ce dossier regroupe les paquets frontend du dépôt Triply.

## Contenu

| Dossier | Description |
|---------|-------------|
| **`triplydev/`** | Application [Next.js](https://nextjs.org) principale (dev + prod, service Docker `tri-app`). |
| **`triply-docs-lib/`** | Bibliothèque de composants React + Tailwind + Storybook. |

## Démarrage rapide

**Application voyage (recommandé)** — depuis la racine du repo :

```bash
make up
```

**Storybook (design system)** :

```bash
cd triply-docs-lib
npm ci
npm run storybook
```

**Next `triplydev`** :

```bash
cd triplydev
npm ci
npm run dev
```

Pour l’architecture complète (Docker, API, variables d’environnement), voir le [`README.md`](../README.md) à la racine du dépôt.
