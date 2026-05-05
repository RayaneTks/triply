# Triply

Planification de voyage centralisée : vols, hébergements, carte et parcours dans une seule application.

## Structure du dépôt

| Zone | Rôle |
|------|------|
| **Racine** (`src/`, `server.ts`, `vite.config.ts`) | **SPA principale** — React 19, Vite 6, Express sert le build et proxifie `/api/v1` vers Laravel. |
| **`backend/`** | API Laravel (Sanctum, voyages, intégrations Amadeus, copilote côté serveur). |
| **`frontend/triplydev/`** | Next.js — pages / CI (lint) ; ce n’est pas le service web exposé par défaut en Docker. |
| **`frontend/triply-docs-lib/`** | Bibliothèque de composants + Storybook. |
| **`compose.dev.yaml`** + **`Makefile`** | Stack de développement (Postgres, PHP-FPM, Nginx, Redis, PgAdmin, SPA). |

Le détail produit (vision, personas) est dans [`PRODUCT_CONTEXT.md`](PRODUCT_CONTEXT.md).

## Prérequis

### Option A (recommandée) : Docker

- Docker Desktop, Compose v2, `make`

### Option B : local

- PHP 8.2+, Composer 2+, Node.js 20+, PostgreSQL 16+
- Extensions PHP Laravel habituelles (`pdo_pgsql`, `mbstring`, etc.)

## Installation (clone neuf)

### 1) Docker + Makefile

À la racine du dépôt. `make install` / `make init` exécutent **`ensure-dev-env`** : copie des `.env.example` vers `.env` (racine, `backend/`, `frontend/triplydev/`) si les fichiers manquent.

```bash
make install
```

Quotidien :

```bash
make up
```

Réinstallation complète (volumes, rebuild images SPA/PHP/workspace, migrations) :

```bash
make docker-reinstall
```

### 2) SPA à la racine, sans Docker (front seul)

Prérequis : API Laravel déjà joignable (ex. `http://127.0.0.1:8000`).

```bash
cp .env.example .env
# Ajuster LARAVEL_API_URL dans .env (URL du backend, ex. http://127.0.0.1:8000)
npm ci
npm run dev
```

Application : [http://localhost:5173](http://localhost:5173) (port par défaut Vite ; en Docker le service **tri-app** mappe `5173:3000`).

### 3) Backend Laravel seul

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
```

Configurer la base dans `backend/.env` (hors Docker, hôte local typique `127.0.0.1`). Puis :

```bash
php artisan migrate
php artisan serve
```

Guide détaillé : [`backend/README.md`](backend/README.md).

### 4) Next.js `triplydev` (optionnel)

Utile pour la CI ou des pages sous Next :

```bash
cd frontend/triplydev
npm ci
npm run dev
```

Voir [`frontend/triplydev/README.md`](frontend/triplydev/README.md).

## Mise à jour de la base

```bash
make migrate
```

ou :

```bash
docker compose -f compose.dev.yaml exec -T tri-php-fpm php artisan migrate --force
```

## Docker Compose sans Makefile

Exemple avec les services courants (dont la SPA) :

```bash
docker compose -f compose.dev.yaml up -d --build tri-postgres tri-php-fpm tri-api tri-pgadmin tri-redis tri-workspace tri-app
docker compose -f compose.dev.yaml exec -T tri-php-fpm php artisan migrate --force
```

## URLs utiles (dev)

| Service | URL |
|---------|-----|
| SPA (tri-app) | [http://localhost:5173](http://localhost:5173) |
| API | [http://127.0.0.1:8000](http://127.0.0.1:8000) |
| Health | [http://127.0.0.1:8000/api/v1/health](http://127.0.0.1:8000/api/v1/health) |
| Swagger | [http://127.0.0.1:8000/api/documentation](http://127.0.0.1:8000/api/documentation) |
| PgAdmin | [http://127.0.0.1:8080](http://127.0.0.1:8080) |

## Dépannage

- **DB** : vérifier `DB_*` dans `backend/.env` ; sous Docker, `DB_HOST=tri-postgres`.
- **Migrations** : `php artisan migrate` ; rollback ciblé : `php artisan migrate:rollback --step=1`.
- **Cache Laravel** : `php artisan optimize:clear`.
- **Conteneur backend OK mais API KO** : `make logs-back`, puis route health.
- **PgAdmin / pgpass** : `pgadmin/pgpass` et `pgadmin/servers.json` doivent être des **fichiers**, pas des dossiers.

## Commandes `make` (aperçu)

- `make help` — liste des cibles
- `make install` / `make init` — premier setup
- `make up` — démarrage quotidien
- `make migrate` — migrations
- `make reload` — sync après changements backend
- `make down` — arrêt
- `make docker-reinstall` — reset stack dev (destructif pour les données Postgres du volume)

## Documentation front

- Vue d’ensemble des dossiers `frontend/*` : [`frontend/README.md`](frontend/README.md).
