# Triply

Plateforme de voyage avec frontend et backend Laravel (API documentee Swagger).

## Structure du repo

- `frontend/` : application front
- `backend/` : API Laravel

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

- API locale : `http://127.0.0.1:8000`
- Swagger UI : `http://127.0.0.1:8000/api/documentation`
- Healthcheck : `http://127.0.0.1:8000/api/v1/health`

## Notes

- Le frontend est gere separement.
- Pour le detail backend (Docker, env, depannage) voir `backend/README.md`.

## Commandes utiles

- Voir toutes les commandes : `make help`
- Setup one-shot : `make init`
- Demarrage rapide : `make up` ou `make run`
- Reload backend : `make reload`
- Logs API : `make logs-back`
- Arreter : `make down`
- Reset complet DB : `make clean`
