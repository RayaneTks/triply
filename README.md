# Triply

Planification de voyage centralisée : vols, hébergements, carte et parcours dans une seule application.

## Structure du dépôt

| Zone | Rôle |
|------|------|
| **`frontend/`** (`app/`, `src/`, `next.config.ts`) | **App principale** — Next.js 16 (App Router) + React 19 + Tailwind 4. Tous les appels `/api/v1/*` sont réécrits (`next.config.ts`) vers le backend Laravel. |
| **`backend/`** | API Laravel (Sanctum, voyages, intégrations Amadeus, copilote côté serveur). |
| **`compose.dev.yaml`** + **`Makefile`** | Stack de développement (Postgres, PHP-FPM, Nginx, Redis, PgAdmin, app Next.js). |

Le détail produit (vision, personas) est dans [`PRODUCT_CONTEXT.md`](PRODUCT_CONTEXT.md).

## Prérequis

### Option A (recommandée) : Docker

- Docker Desktop, Compose v2, `make`

### Option B : local

- PHP 8.2+, Composer 2+, Node.js 22+, PostgreSQL 16+
- Extensions PHP Laravel habituelles (`pdo_pgsql`, `mbstring`, etc.)

## Installation (clone neuf)

### 1) Docker + Makefile

À la racine du dépôt. `make install` / `make init` exécutent **`ensure-dev-env`** : copie des `.env.example` vers `.env` (`.env` racine + `backend/.env` + `frontend/.env`) si les fichiers manquent.

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

### 2) App Next.js dans `frontend/`, sans Docker (front seul)

Prérequis : API Laravel déjà joignable (ex. `http://127.0.0.1:8000`).

```bash
cd frontend
cp .env.example .env
# Ajuster BACKEND_PROXY_TARGET=http://127.0.0.1:8000 (la valeur Docker http://tri-api ne marche pas hors Docker)
npm ci
npm run dev
```

Application : [http://localhost:3000](http://localhost:3000) (port Next.js par défaut). En Docker, le service **tri-app** mappe automatiquement `5173:3000`, donc l'app reste accessible sur [http://localhost:5173](http://localhost:5173).

### Design system

- Tokens, fontes et charte graphique : [frontend/design-system.md](frontend/design-system.md).

## Organisation des `.env` (important)

- `.env` (racine) : variables **Docker Compose** uniquement (`DB_*`, `PGADMIN_*`, ports).
- `backend/.env` : variables **Laravel** + **secrets** (ex. `AMADEUS_CLIENT_ID`, `AMADEUS_CLIENT_SECRET`, `OPENAI_API_KEY`).
- `frontend/.env` : variables **Next.js publiques** (`NEXT_PUBLIC_*`) + cible interne du rewrite (`BACKEND_PROXY_TARGET`). **Aucun secret backend.**

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
| App Next.js (tri-app, Docker) | [http://localhost:5173](http://localhost:5173) |
| App Next.js (hors Docker, défaut) | [http://localhost:3000](http://localhost:3000) |
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
