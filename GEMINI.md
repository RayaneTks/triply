# Triply - Project Context & Guidelines

## Canonical product context

Read `PRODUCT_CONTEXT.md` first.
It is the source of truth for Triply's product vision, positioning, personas, and UX priorities.

## Product summary

Triply is an all-in-one AI travel planning platform.
Its job is to reduce mental load by centralizing flights, accommodations, activities, itinerary building, and budget management inside a single guided experience.

When making product decisions, optimize for:

- lower planning friction
- stronger budget control
- clear personalization
- fewer fragmented user flows
- a human-first assistant experience

## Technical overview

- Backend: Laravel 12, PHP 8.2, PostgreSQL, Redis, Sanctum, L5-Swagger
- Frontend: Next.js, TypeScript, Tailwind CSS 4, Framer Motion, Mapbox GL
- Infrastructure: Docker Compose plus Makefile automation
- Architecture: API-first, with clear separation between frontend UI and backend service logic

## Building and running

### Docker workflow

1. Initial setup: `make install`
2. Start services: `make up`
3. Run migrations: `make migrate`
4. Refresh Swagger docs: `make swagger`
5. Open API docs: `http://127.0.0.1:8000/api/documentation`

### Local development

- Backend: `cd backend && php artisan serve`
- Frontend: `cd frontend/triplydev && npm run dev`

## Key directories

### Root

- `README.md`: setup and operational instructions
- `PRODUCT_CONTEXT.md`: canonical product context
- `GEMINI.md`: working notes and engineering guidance
- `compose.dev.yaml`: Docker services
- `Makefile`: common tasks

### Backend

- `backend/routes/api.php`: API routes
- `backend/app/Http/Controllers/Api/V1`: versioned API controllers
- `backend/app/Models`: Eloquent models
- `backend/app/Services`: service layer and stubs
- `backend/app/OpenApi`: OpenAPI declarations
- `backend/docs/BACKEND_WORKING_MAP.md`: backend endpoint map

### Frontend

- `frontend/triplydev/app`: Next.js App Router pages and routes
- `frontend/triplydev/src/components`: reusable UI components
- `frontend/triplydev/src/features`: feature-level frontend modules
- `frontend/triplydev/src/lib`: API clients and local persistence helpers
- `frontend/triplydev/design-system.md`: current UI design guidance

## Development conventions

### API

- Keep versioned routes under `v1`
- Return consistent success and error envelopes
- Update Swagger annotations when API behavior changes

### Data model

- Use migrations for all schema changes
- Preserve current naming conventions such as `Voyage`, `Journee`, and `Hebergement`

### Product and UX

- Favor guided flows over dense expert tooling
- Keep budget visible and meaningful throughout the experience
- Use AI to clarify decisions, not to add noise
- Prefer concrete travel recommendations over vague inspiration
- Default to French product copy unless the task explicitly requires another language

### Security and environment

- Do not commit `.env` files
- Update `.env.example` when new variables are required
- Protect non-public API routes with Sanctum and existing middleware patterns

### Testing

- Run relevant backend or frontend checks before finalizing work
- Backend feature tests live in `backend/tests/Feature`

## Important notes

- Do not block SSR for critical above-the-fold content with client-only mount guards
- Preserve visual fluidity, but do not trade away clarity or performance
- When in doubt, choose the implementation that reduces user effort rather than adding configurability
