# Triply — Next.js (`triplydev`)

Application Next.js du monorepo Triply. Elle complète la **SPA Vite** à la racine du dépôt (service Docker `tri-app`, port 5173) : pages App Router, déploiement Vercel possible, et **jobs CI** (`npm run lint`, etc.).

## Prérequis

- Node.js 20+ (aligné sur la CI du dépôt)

## Configuration

```bash
cp .env.example .env.local
```

Les appels API vers Laravel doivent utiliser une base URL documentée dans `.env.example` (ex. `NEXT_PUBLIC_BACKEND_API_URL`). Les intégrations sensibles (clés fournisseurs) restent côté **backend** Laravel, pas en variables `NEXT_PUBLIC_*`.

## Scripts

```bash
npm ci
npm run dev      # http://localhost:3000
npm run lint
npm run build
```

## Documentation

- Racine du projet : [README.md](../../README.md)
- Dossier `frontend/` : [README.md](../README.md)
