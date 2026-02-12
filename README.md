# Triply

Plateforme de voyage avec frontend et backend Laravel (API documentee Swagger).

## Structure du repo

- `frontend/` : application front
- `backend/` : API Laravel

<<<<<<< HEAD
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
- utilise un volume Docker dedie pour `vendor` (optimise perfs sur Windows)

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
=======
## Demarrage rapide (Docker via Makefile)

Prerquis (Windows/macOS/Linux) :
- Docker Desktop installe et demarre
- `make` installe

1. Build et lancement :
```bash
make init
```

2. Demarrage quotidien (rapide) :
```bash
make up
```

3. Apres modifications backend :
```bash
make reload
```

4. Verifier l'API :
```bash
curl http://127.0.0.1:8000/api/v1/health
```

## URLs utiles (backend)
>>>>>>> origin/TRI-637

- API locale : `http://127.0.0.1:8000`
- API v1 health : `http://127.0.0.1:8000/api/v1/health`
- Swagger UI : `http://127.0.0.1:8000/api/documentation`
<<<<<<< HEAD

## Perf API (important)

- `vendor` est isole dans un volume Docker (`backend_vendor`) pour accelerer le bootstrap Laravel.
- En usage normal, les endpoints stubs doivent repondre en dessous d'une seconde.
- Si tu vois encore plusieurs secondes:
1. verifier que Docker Desktop est bien actif,
2. lancer `make reload`,
3. verifier charge machine (CPU/RAM/disque),
4. envisager execution depuis WSL2 pour meilleures performances I/O.

## Depannage Docker (Windows)

Si `make up` retourne une erreur du type `dockerDesktopLinuxEngine` introuvable:

1. Demarrer Docker Desktop.
2. Attendre que Docker soit pret (`docker version`).
3. Relancer `make up`.

## Notes

- Les commandes `local-*` existent encore pour urgence/legacy.
- Le workflow recommande reste 100% Docker.
- Les details backend sont dans `backend/README_DEV.md`.
=======
- Healthcheck : `http://127.0.0.1:8000/api/v1/health`

## Notes

- Le frontend est gere separement.
- Pour le detail backend (Docker, env, depannage) voir `backend/README.md`.

## Commandes utiles

- Voir toutes les commandes : `make help`
- Setup one-shot : `make init`
  Note: l'installation des dependances runtime est faite pendant le build Docker de l'image backend.
- Demarrage rapide : `make up` ou `make run`
- Reload backend : `make reload`
- Installer dependencies PHP manuellement si `composer.lock` change : `make composer-install`
- Logs API : `make logs-back`
- Arreter : `make down`
- Reset complet DB : `make clean`
>>>>>>> origin/TRI-637
