# Triply

Plateforme de voyage avec un frontend et un backend Laravel documente avec Swagger.

## Structure du repo

- `frontend/` : application front
- `backend/` : API Laravel

## Demarrage rapide

Utiliser le `Makefile` a la racine.

1. Afficher les commandes disponibles :
```bash
make help
```
2. Initialiser le backend en local :
```bash
make local-setup
```
3. Lancer l'API :
```bash
make local-serve
```

## URLs utiles

- API locale : `http://127.0.0.1:8000`
- Swagger UI : `http://127.0.0.1:8000/api/documentation`
- Healthcheck : `http://127.0.0.1:8000/api/health`

## Notes

- Le frontend est gere separement.
- Les details backend (variables d'environnement, endpoints V1, workflow Swagger) sont dans `backend/README.md`.
- La carte des fichiers backend a modifier selon la feature est dans `backend/docs/BACKEND_WORKING_MAP.md`.

## Commandes principales

- `make local-setup` : setup backend local complet
- `make local-swagger` : regenerer Swagger
- `make local-routes` : lister les routes API
- `make local-test` : lancer les tests
- `make docker-up` : lancer l'environnement Docker
- `make docker-swagger` : regenerer Swagger dans Docker
