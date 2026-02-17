# Triply Backend (Laravel)

Guide d'installation backend robuste sous Docker (Windows, macOS, Linux) avec Makefile.

## Prerequis

- Docker Desktop demarre
- Docker Compose v2 (`docker compose version`)
- Port `8000` libre (API)
- Port `5432` libre (PostgreSQL)

## Workflow recommande (Docker-first)

Depuis la racine du repo (`triply/`) :

1. Setup initial (une seule fois, one-shot)
```bash
make install
```

2. Demarrage quotidien (rapide, sans rebuild)
```bash
make up
```

3. Apres modifications backend
```bash
make reload
```

4. Arret
```bash
make down
```

5. Verification rapide
```bash
curl http://127.0.0.1:8000/api/v1/health
```

Si `curl` n'est pas disponible : ouvrir `http://127.0.0.1:8000/api/v1/health` dans le navigateur.

## Variables d'environnement Docker

Le service backend Docker est deja configure dans `docker-compose.yml` pour utiliser PostgreSQL :

- `DB_CONNECTION=pgsql`
- `DB_HOST=db`
- `DB_PORT=5432`
- `DB_DATABASE=TriplyDB`
- `DB_USERNAME=backend`
- `DB_PASSWORD=backend`

Un exemple est fourni dans `backend/.env.docker.example`.

## Commandes utiles

- `make init` : setup complet (build, db-ensure, env-sync, cache clear, migrate, swagger)
- `make install` : alias de `make init`
- `make migrate` : applique les migrations en mode safe
- `make db-ensure` : cree le role `backend` et la base `TriplyDB` si absents
- `make up` / `make run` : demarrage quotidien rapide
- `make reload` : clear cache + migrate graceful + swagger
- `make env-sync` : cree/met a jour `backend/.env` avec la config Docker standard (APP + DB)
- `make down` : arret conteneurs
- `make rebuild` : rebuild complet Docker
- `make composer-install` : a lancer si `composer.json`/`composer.lock` changent
- `make composer-install-dev` : installer aussi les dependances dev
- `make restart` : redemarrage backend + db
- `make status` : etat des services
- `make logs` : logs complets
- `make logs-back` : logs backend uniquement
- `make shell` : shell backend
- `make routes` : liste routes API
- `make swagger` : regen Swagger
- `make test` : tests backend
- `make clean` : suppression volumes (destructif)

## Reset complet (DB + volumes)

Attention: supprime les donnees PostgreSQL locales.

```bash
make clean
make init
```

## Compatibilite Windows/macOS

- Le flux principal passe par `make`.
- Les commandes Docker appelees dans le Makefile utilisent `docker compose exec -T` pour eviter les problemes TTY selon shell/OS.
- Le `.env` backend est synchronise automatiquement via `make init` et `make reload`.
- Si `make` n'est pas disponible sur ta machine, utilise les commandes `docker compose` equivalentes.

## URLs

- API: `http://127.0.0.1:8000`
- Health: `http://127.0.0.1:8000/api/v1/health`
- Swagger: `http://127.0.0.1:8000/api/documentation`
