# Triply

Plateforme de voyage avec frontend et backend Laravel (API documentee Swagger).

## Structure du repo

- `frontend/` : application front
- `backend/` : API Laravel

## Workflow recommande (Docker-first)

1. Setup initial (une seule fois)
```bash
make init
```

2. Demarrage quotidien (rapide)
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

## Commandes utiles

- `make init` : setup complet
- `make up` / `make run` : demarrage quotidien
- `make reload` : sync backend
- `make rebuild` : rebuild complet
- `make composer-install` : reinstall deps PHP prod
- `make status` : etat services Docker
- `make logs` : logs complets
- `make logs-back` : logs backend
- `make shell` : shell backend
- `make routes` : routes API
- `make swagger` : regen Swagger
- `make test` : tests backend
- `make clean` : stop + suppression volumes (destructif)

## URLs utiles

- API locale : `http://127.0.0.1:8000`
- API v1 health : `http://127.0.0.1:8000/api/v1/health`
- Swagger UI : `http://127.0.0.1:8000/api/documentation`
- pgAdmin : `http://localhost:8080` (email: `contact@triply.ovh`, mot de passe: `admin`)

## Notes

- Le frontend est gere separement.
- Details backend : `backend/README.md`.
