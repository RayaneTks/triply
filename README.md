# Triply

Plateforme de voyage avec un frontend et un backend Laravel documente avec Swagger.

## Structure du repo

- `frontend/` : application front
- `backend/` : API Laravel

## Demarrage rapide (Docker)

Objectif: ne jamais avoir a taper des commandes artisan/composer a la main.

1. Lancer tout l'environnement:
```bash
make up
```

2. Apres des modifications backend (routes, swagger, config, etc.):
```bash
make reload
```

3. Voir les logs:
```bash
make logs
```

4. Arreter l'environnement:
```bash
make down
```

## Commandes intuitives (recommandees)

- `make up` : build + run Docker + bootstrap backend complet
- `make run` : alias de `make up`
- `make reload` : reapplique bootstrap backend (deps/cache/migrations/swagger)
- `make restart` : restart des conteneurs + bootstrap backend
- `make logs` : logs complets
- `make logs-back` : logs backend uniquement
- `make shell` : shell dans le conteneur backend
- `make test` : tests backend dans Docker
- `make routes` : liste des routes API
- `make swagger` : regenere Swagger
- `make down` : stop environnement
- `make clean` : stop + suppression volumes (destructif)

## URLs utiles

- API locale : `http://127.0.0.1:8000`
- API v1 health : `http://127.0.0.1:8000/api/v1/health`
- Swagger UI : `http://127.0.0.1:8000/api/documentation`

## Notes

- Les commandes `local-*` existent encore mais sont legacy.
- Le workflow recommande est 100% Docker via `make up` / `make reload`.
- Les details backend sont dans `backend/README_DEV.md`.

## Depannage Docker (Windows)

Si `make up` retourne une erreur du type `dockerDesktopLinuxEngine` introuvable:

1. Demarrer Docker Desktop.
2. Attendre que Docker soit pret (`docker version` fonctionne).
3. Relancer `make up`.
