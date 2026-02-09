# Triply Backend (Laravel)

Backend API de Triply, documente avec Swagger pour developper et tester sans frontend.

## Prerequis

- PHP 8.2+
- Composer
- Extensions PHP actives : `fileinfo`, `zip`

Verification rapide :
```powershell
php -m | findstr /i "fileinfo zip"
```

## Installation

1. Aller dans le dossier backend :
```powershell
cd backend
```
2. Installer les dependances :
```powershell
composer install
```
3. Creer `.env` (si absent) :
```powershell
Copy-Item .env.example .env
```
4. Config minimale sans base de donnees :
```env
APP_ENV=local
APP_DEBUG=true
APP_KEY=
CACHE_STORE=file
SESSION_DRIVER=file
QUEUE_CONNECTION=sync
```
5. Generer la cle application :
```powershell
php artisan key:generate
```

## Swagger

Generer la doc :
```powershell
php artisan l5-swagger:generate
```

Lancer l'API :
```powershell
php artisan serve
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

- Regenerer Swagger : `php artisan l5-swagger:generate`
- Lister les routes API : `php artisan route:list --path=api`
- Nettoyer le cache config : `php artisan optimize:clear`

## Perimetre

- Ce README couvre uniquement le backend.
- Le frontend n'est pas traite ici.
