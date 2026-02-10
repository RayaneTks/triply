# Backend Dev README (Triply)

## Prerequisites
- PHP 8.2+
- Composer

## Install
```bash
composer install
cp .env.example .env
php artisan key:generate
```

## Run locally
```bash
php artisan serve
```

API base URL (local): `http://127.0.0.1:8000/api/v1`

## Generate OpenAPI / Swagger docs
```bash
php artisan l5-swagger:generate
```

Swagger UI:
- `http://127.0.0.1:8000/api/documentation`

## Route check
```bash
php artisan route:list --path=api/v1
```

## Scheduler (reminders stub)
Run scheduler worker:
```bash
php artisan schedule:work
```

Reminder command (manual):
```bash
php artisan triply:send-reminders --dry-run
```

## Current scope
- API v1 skeleton only
- Stub services and responses
- No database/business logic implementation
- Ready for frontend/API contract integration and iterative domain wiring

## Security and throttling
- Auth middleware: `auth:sanctum` on private endpoints
- Rate limiting profiles: `auth`, `password-reset`, `ai`, `places`
- Security headers middleware enabled on API group
- CORS config added in `config/cors.php`

## Next implementation steps
1. Replace stubs under `app/Services/Stubs` with real implementations.
2. Connect FormRequests to finalized domain validation rules.
3. Add persistence repositories and policies with real ownership checks.
4. Expand OpenAPI examples and error schemas per endpoint.
