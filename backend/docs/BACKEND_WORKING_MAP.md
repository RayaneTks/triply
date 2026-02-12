# Backend Working Map

Ce document sert de carte rapide pour savoir **ou coder** selon la feature.

## 1) Fichiers pivots a connaitre

- `backend/bootstrap/app.php`
  - Active les routes `web.php` et `api.php`.
  - Point de passage si on ajoute d'autres fichiers de routes.

- `backend/routes/api.php`
  - Declaration de toutes les routes API (`/api/...`).
  - Structure par domaines: auth, users, trips, bookings, payments, reviews, notifications.

- `backend/app/OpenApi/OpenApiSpec.php`
  - Config OpenAPI globale (titre, version, serveur, tags, schema bearer).
  - A modifier si on change le serveur local, la version d'API ou les tags.

- `backend/app/Http/Controllers/Api/*.php`
  - Endpoints API + annotations Swagger endpoint par endpoint.
  - C'est la zone principale pour implementer la logique metier.

- `backend/config/*.php`
  - Config runtime Laravel (db, cache, queue, session, auth...).
  - A toucher pour les besoins infra et execution.

- `backend/.env.example`
  - Template des variables d'environnement d'equipe.
  - Garder ce fichier a jour quand une variable est ajoutee.

## 2) Routing API V1 (etat actuel)

- Prefixe global: `/api/v1`

Authentification:
- `POST /api/v1/auth/register` -> `AuthController@register`
- `POST /api/v1/auth/login` -> `AuthController@login`
- `POST /api/v1/auth/logout` -> `AuthController@logout`
- `GET /api/v1/auth/me` -> `AuthController@me`

Utilisateurs:
- `GET /api/v1/users` -> `UserController@index`
- `GET /api/v1/users/{id}` -> `UserController@show`
- `PATCH /api/v1/users/{id}` -> `UserController@update`

Voyages:
- `GET /api/v1/trips` -> `TripController@index`
- `POST /api/v1/trips` -> `TripController@store`
- `GET /api/v1/trips/{id}` -> `TripController@show`
- `PATCH /api/v1/trips/{id}` -> `TripController@update`
- `DELETE /api/v1/trips/{id}` -> `TripController@destroy`
- `POST /api/v1/trips/{id}/publish` -> `TripController@publish`

Reservations:
- `GET /api/v1/bookings` -> `BookingController@index`
- `POST /api/v1/bookings` -> `BookingController@store`
- `GET /api/v1/bookings/{id}` -> `BookingController@show`
- `PATCH /api/v1/bookings/{id}/status` -> `BookingController@updateStatus`
- `POST /api/v1/bookings/{id}/cancel` -> `BookingController@cancel`

Paiements:
- `POST /api/v1/payments/intents` -> `PaymentController@createIntent`
- `POST /api/v1/payments/webhook` -> `PaymentController@webhook`

Avis:
- `GET /api/v1/trips/{tripId}/reviews` -> `ReviewController@indexByTrip`
- `POST /api/v1/reviews` -> `ReviewController@store`

Notifications:
- `GET /api/v1/notifications` -> `NotificationController@index`
- `PATCH /api/v1/notifications/{id}/read` -> `NotificationController@markAsRead`
- `PATCH /api/v1/notifications/read-all` -> `NotificationController@markAllAsRead`

Sante:
- `GET /api/health` -> `HealthController@show`

## 3) Swagger / OpenAPI: qui configure quoi

- Global (meta + tags + auth):
  - `backend/app/OpenApi/OpenApiSpec.php`

- Endpoint par endpoint (summary, body, responses):
  - `backend/app/Http/Controllers/Api/*.php`

- Generation de la doc:
  - `make local-swagger` (local)
  - `make docker-swagger` (docker)

- UI Swagger:
  - `http://127.0.0.1:8000/api/documentation`

## 4) Workflow recommande pour ajouter une feature backend

1. Ajouter/adapter la route dans `backend/routes/api.php`.
2. Ajouter/adapter la methode controller dans `backend/app/Http/Controllers/Api/...`.
3. Completer les annotations OpenAPI de la methode.
4. Regenerer Swagger: `make local-swagger`.
5. Verifier les routes: `make local-routes`.
6. Tester via Swagger UI.

## 5) Commandes utiles (reference rapide)

- Setup local backend: `make local-setup`
- Serveur local: `make local-serve`
- Regeneration Swagger: `make local-swagger`
- Liste routes API: `make local-routes`
- Nettoyage cache Laravel: `make local-cache-clear`
- Tests backend: `make local-test`
