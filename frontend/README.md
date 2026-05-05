# Frontend Triply

Ce dossier regroupe les paquets Node **hors** de la SPA principale (la SPA Vite + React vit à la **racine** du dépôt : `package.json`, `src/`, `server.ts`).

## Contenu

| Dossier | Description |
|---------|-------------|
| **`triplydev/`** | Application [Next.js](https://nextjs.org) — lint en CI, pages marketing ou expérimentales. L’app voyage par défaut en dev Docker est la SPA racine (`tri-app`). |
| **`triply-docs-lib/`** | Bibliothèque de composants React + Tailwind + Storybook. |

## Démarrage rapide

**Application voyage (recommandé)** — depuis la racine du repo :

```bash
make up
# ou : npm ci && npm run dev  (avec Laravel joignable, voir .env.example racine)
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
