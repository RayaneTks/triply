# Backend Dev README (Triply)

## Workflow recommande (Docker uniquement)

Aucune commande artisan/composer manuelle necessaire.

### 1) Demarrer tout l'environnement
```bash
make up
```

### 2) Recharger apres modifications backend
```bash
make reload
```

### 3) Outils quotidiens
```bash
make logs
make logs-back
make shell
make routes
make swagger
make test
```

### 4) Arreter
```bash
make down
```

## Ce que fait `make up`

- Lance Docker (`docker compose up -d --build`)
- Cree `backend/.env` si absent
- Installe les dependances composer dans le conteneur
- Genere `APP_KEY`
- Vide les caches Laravel
- Lance les migrations (mode gracieux)
- Regenere la documentation Swagger

## URLs

- API: `http://127.0.0.1:8000`
- API v1: `http://127.0.0.1:8000/api/v1`
- Health v1: `http://127.0.0.1:8000/api/v1/health`
- Swagger UI: `http://127.0.0.1:8000/api/documentation`

## Commandes Make (intuitives)

- `make up` / `make run`: demarrage complet Docker + bootstrap backend
- `make reload`: reapplique bootstrap backend (post-modifs)
- `make restart`: restart conteneurs + bootstrap
- `make down`: arret conteneurs
- `make clean`: suppression conteneurs + volumes
- `make logs`: logs de tous les services
- `make logs-back`: logs backend
- `make shell`: shell backend
- `make routes`: liste routes API
- `make swagger`: regen Swagger
- `make test`: tests backend

## Notes

- Les commandes `local-*` sont legacy et gardees pour compatibilite.
- Le backend reste en mode squelette API v1 (stubs), sans logique metier/BDD finale.

## Depannage rapide (Windows)

Si `make up` echoue avec `dockerDesktopLinuxEngine`:

1. Ouvrir Docker Desktop.
2. Verifier Docker:
```bash
docker version
```
3. Relancer:
```bash
make up
```
