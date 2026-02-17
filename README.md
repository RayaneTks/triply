# Triply

Plateforme de planification de voyage avec backend Laravel (`backend/`) et frontend Next.js (`frontend/triplydev/`).

## Prerequis

### Option A (recommandee): Docker
- Docker Desktop
- Docker Compose v2
- `make`

### Option B: Installation locale
- PHP 8.2+
- Composer 2+
- Node.js 20+ et npm
- PostgreSQL 16+ (configuration par defaut du projet)
- Extensions PHP usuelles Laravel: `bcmath`, `ctype`, `fileinfo`, `json`, `mbstring`, `openssl`, `pdo`, `pdo_pgsql`, `tokenizer`, `xml`

## Installation (fresh clone)

### 1) Avec Docker + Makefile (recommande)
Depuis la racine du repo:

```bash
make install
```

`make install` est un alias de `make init` et execute build, bootstrap DB, sync `.env`, migrations, puis regeneration Swagger.

Demarrage quotidien:

```bash
make up
```

Verification API:

```bash
curl http://127.0.0.1:8000/api/v1/health
```

### 2) Sans Docker (local)

#### Backend Laravel
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
```

Configurer la DB dans `backend/.env`:
- `DB_CONNECTION=pgsql`
- `DB_HOST=127.0.0.1`
- `DB_PORT=5432`
- `DB_DATABASE=TriplyDB`
- `DB_USERNAME=backend`
- `DB_PASSWORD=backend`

Puis:

```bash
php artisan migrate
php artisan serve
```

Sanctum est deja installe. Aucune publication supplementaire n'est necessaire pour lancer le projet dans son etat actuel.

#### Frontend Next.js (optionnel pour l'API, requis pour l'app web)
```bash
cd frontend/triplydev
npm install
npm run dev
```

## Mise a jour de la DB (base deja existante)

### Docker
```bash
make migrate
```

ou:

```bash
docker compose exec -T backend php artisan migrate --force
```

### Local
```bash
cd backend
php artisan migrate
```

Rollback d'une migration:

```bash
php artisan migrate:rollback --step=1
```

## Docker Compose direct (sans Makefile)

```bash
docker compose up -d --build db backend pgadmin
docker compose exec -T backend php artisan migrate --force
```

## URLs utiles

- API: `http://127.0.0.1:8000`
- Healthcheck: `http://127.0.0.1:8000/api/v1/health`
- Swagger UI: `http://127.0.0.1:8000/api/documentation`
- PgAdmin: `http://127.0.0.1:8080`

## Troubleshooting

- Erreur de connexion DB:
  - verifier `DB_*` dans `backend/.env`
  - verifier que PostgreSQL est demarre et accessible
- Migration en echec:
  - relancer `php artisan migrate`
  - si necessaire rollback cible: `php artisan migrate:rollback --step=1`
- Cache Laravel incoherent:
  - `php artisan optimize:clear`
- Droits ecriture storage/bootstrap cache:
  - verifier les permissions sur `backend/storage` et `backend/bootstrap/cache`
- Container backend up mais API KO:
  - `make logs-back` puis verifier la route health
- Erreur Docker sur `pgadmin/pgpass`:
  - verifier que `pgadmin/pgpass` et `pgadmin/servers.json` sont des fichiers, pas des dossiers

## Commandes utiles

- `make help`
- `make install`
- `make up`
- `make migrate`
- `make reload`
- `make logs-back`
- `make down`
