# Triply

Plateforme de voyage avec un frontend et un backend Laravel documente avec Swagger.

## Structure du repo

- `frontend/` : application front
- `backend/` : API Laravel

## Demarrage rapide

1. Aller dans le backend :
```powershell
cd backend
```
2. Installer les dependances :
```powershell
composer install
```
3. Generer la documentation Swagger :
```powershell
php artisan l5-swagger:generate
```
4. Lancer le serveur API :
```powershell
php artisan serve
```

## URLs utiles

- API locale : `http://127.0.0.1:8000`
- Swagger UI : `http://127.0.0.1:8000/api/documentation`
- Healthcheck : `http://127.0.0.1:8000/api/health`

## Notes

- Le frontend est gere separement.
- Les details backend (variables d'environnement, endpoints V1, workflow Swagger) sont dans `backend/README.md`.
