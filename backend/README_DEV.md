# Backend Dev README (Triply)

## Workflow officiel (Docker-first)

## 1) Initialisation (une seule fois)
```bash
make init
```

Commande lourde volontairement:
- build image backend
- install dependances composer
- generation APP_KEY
- clear cache
- migrations
- generation Swagger

## 2) Demarrage quotidien (rapide)
```bash
make up
```

## 3) Synchroniser apres modifs backend
```bash
make reload
```

## 4) Arret
```bash
make down
```

## Quelle commande utiliser selon le cas

- Changement `Dockerfile` / libs systeme: `make rebuild`
- Changement `composer.json` / `composer.lock`: `make composer-install`
- Changement routes/controllers/requests/resources/openapi/config: `make reload`
- Besoin de voir les logs: `make logs` ou `make logs-back`
- Besoin shell backend: `make shell`
- Verifier routes: `make routes`
- Regenerer docs uniquement: `make swagger`
- Lancer tests: `make test`

## URLs

- API: `http://127.0.0.1:8000`
- API v1: `http://127.0.0.1:8000/api/v1`
- Health v1: `http://127.0.0.1:8000/api/v1/health`
- Swagger UI: `http://127.0.0.1:8000/api/documentation`

## Depannage rapide (Windows)

Si erreur `dockerDesktopLinuxEngine`:

1. Ouvrir Docker Desktop.
2. Verifier Docker:
```bash
docker version
```
3. Relancer:
```bash
make up
```

## Mode urgence (sans Docker)

Les commandes `local-*` du Makefile restent disponibles en fallback.
Usage recommande: Docker-first.
