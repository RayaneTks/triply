# Triply

Plateforme de voyage avec un frontend et un backend Laravel documente avec Swagger.

## Structure du repo

- `frontend/` : application front
- `backend/` : API Laravel

## Workflow recommande (Docker-first)

### 1) Setup initial (une seule fois)
```bash
make init
```
Utilise cette commande pour un environnement neuf.
Elle est volontairement lourde:
- build Docker
- install dependencies backend
- generation APP_KEY
- clear cache
- migrations
- regeneration Swagger

### 2) Demarrage quotidien (rapide)
```bash
make up
```
- lance les conteneurs sans rebuild
- ne relance pas composer install

### 3) Apres des modifications backend
```bash
make reload
```
- clear cache
- migrate (graceful)
- regeneration Swagger

### 4) Arret
```bash
make down
```

## Commandes utiles et cas d'usage

- `make init` : premier setup complet (one-shot)
- `make up` / `make run` : demarrage rapide au quotidien
- `make reload` : sync backend apres changement code/config/routes/swagger
- `make rebuild` : rebuild complet quand Dockerfile/deps systeme changent
- `make composer-install` : quand `composer.json`/`composer.lock` changent
- `make restart` : redemarrer conteneurs
- `make status` : etat des services docker
- `make logs` : logs complets
- `make logs-back` : logs backend uniquement
- `make shell` : shell dans le conteneur backend
- `make routes` : lister routes API
- `make swagger` : regenerer Swagger
- `make test` : lancer tests backend
- `make clean` : stop + suppression volumes (destructif)

## URLs utiles

- API locale : `http://127.0.0.1:8000`
- API v1 health : `http://127.0.0.1:8000/api/v1/health`
- Swagger UI : `http://127.0.0.1:8000/api/documentation`

## Depannage Docker (Windows)

Si `make up` retourne une erreur du type `dockerDesktopLinuxEngine` introuvable:

1. Demarrer Docker Desktop.
2. Attendre que Docker soit pret (`docker version`).
3. Relancer `make up`.

## Notes

- Les commandes `local-*` existent encore pour urgence/legacy.
- Le workflow recommande reste 100% Docker.
- Les details backend sont dans `backend/README_DEV.md`.
