# Triply Backend (Laravel)

Backend API de Triply, documente avec Swagger pour developper et tester sans frontend.

## Documentation de travail

- Carte backend (fichiers, routes, swagger, workflow): `backend/docs/BACKEND_WORKING_MAP.md`

## Prerequis

- PHP 8.2+
- Composer
- Extensions PHP actives : `fileinfo`, `zip`

## Workflow recommande (Docker-first)

Depuis la racine du repo (`triply/`) :

1. Setup initial (une seule fois, one-shot)
```bash
make install
```

## Installation

Le flux recommande passe par le `Makefile` a la racine.

1. Depuis la racine du repo, executer :
```bash
make local-setup
```
2. Verifier et ajuster `backend/.env` si besoin.

Config minimale sans base de donnees :
```env
APP_ENV=local
APP_DEBUG=true
APP_KEY=
CACHE_STORE=file
SESSION_DRIVER=file
QUEUE_CONNECTION=sync
```

## Swagger

Generer la doc :
```bash
make local-swagger
```

Lancer l'API :
```bash
make local-serve
```

Ouvrir Swagger UI :
`http://127.0.0.1:8000/api/documentation`

## Endpoints principaux (squelette V1)

- `GET /api/health`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `GET /api/v1/users`
- `GET /api/v1/users/{id}`
- `PATCH /api/v1/users/{id}`
- `GET /api/v1/trips`
- `POST /api/v1/trips`
- `GET /api/v1/trips/{id}`
- `PATCH /api/v1/trips/{id}`
- `DELETE /api/v1/trips/{id}`
- `POST /api/v1/trips/{id}/publish`
- `GET /api/v1/bookings`
- `POST /api/v1/bookings`
- `GET /api/v1/bookings/{id}`
- `PATCH /api/v1/bookings/{id}/status`
- `POST /api/v1/bookings/{id}/cancel`
- `POST /api/v1/payments/intents`
- `POST /api/v1/payments/webhook`
- `GET /api/v1/trips/{tripId}/reviews`
- `POST /api/v1/reviews`
- `GET /api/v1/notifications`
- `PATCH /api/v1/notifications/{id}/read`
- `PATCH /api/v1/notifications/read-all`

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

## Perimetre

- Ce README couvre uniquement le backend.
- Le frontend n'est pas traite ici.
