# Triply API Plan (v1 Skeleton)

## Goal
Provide a stable API contract and modular backend structure for frontend and future domain implementation, without coupling to a fixed DB schema.

## Proposed Backend Modules

### 1) Auth
- Register/login/logout
- Forgot/reset password
- Email verification
- Current authenticated user (`me`)
- Security hardening hooks: Sanctum, throttling, secure headers

### 2) User / Profile / Preferences
- View/update profile
- Update travel preferences (diet, breakfast, interests, pace, budget)
- Export user data
- Delete account

### 3) Trips
- Create/list/show/update trip settings
- Duplicate trip
- Validate/finalize trip
- Trip recap endpoint

### 4) Days / Planning
- List trip days
- Update day settings (time window, available minutes)

### 5) Activities
- Add/list/filter activities
- Group by day
- Show/update activity details
- Regenerate activity
- Reorder drag-and-drop
- Soft delete + restore (undo)

### 6) Places / Maps / Routes
- Place details endpoint
- Place reviews endpoint
- Trip routes/polyline endpoint
- Travel times endpoint
- Nearby restaurants endpoint

### 7) AI Generation / Q&A
- Generate full plan
- Generate day/activity
- Job status + cancel
- Trip Q&A
- Conversation branching

### 8) Travel Details
- Flights CRUD
- Hotels CRUD
- Local transports CRUD

### 9) Sharing / Public Recap
- Private recap
- Create share link
- Public recap via token

### 10) Exports
- Export PDF (async-ready stub)
- Export ICS (async-ready stub)

### 11) Consent / Cookies
- Get current consent
- Save consent choices

### 12) Booking
- Placeholder checkout endpoint

### 13) Observability / Admin
- Health endpoint
- Admin metrics endpoint (protected)
- Logging/monitoring extension points
- API quotas/rate limiting extension points

### 14) Notifications / Emails / Reminders
- Events/listeners stubs for verification/reset emails
- Scheduler command stub for reminders

## API v1 Endpoints

### Health
- GET `/api/v1/health`

### Auth
- POST `/api/v1/auth/register`
- POST `/api/v1/auth/login`
- POST `/api/v1/auth/logout`
- POST `/api/v1/auth/forgot-password`
- POST `/api/v1/auth/reset-password`
- GET `/api/v1/auth/me`
- POST `/api/v1/auth/email/verify`

### Profile / User
- GET `/api/v1/profile`
- PATCH `/api/v1/profile`
- PATCH `/api/v1/profile/preferences`
- GET `/api/v1/user/export`
- DELETE `/api/v1/user`

### Trips
- POST `/api/v1/trips`
- GET `/api/v1/trips`
- GET `/api/v1/trips/{trip}`
- PATCH `/api/v1/trips/{trip}`
- POST `/api/v1/trips/{trip}/duplicate`
- POST `/api/v1/trips/{trip}/validate`

### Days
- GET `/api/v1/trips/{trip}/days`
- PATCH `/api/v1/trips/{trip}/days/{day}`

### Activities
- POST `/api/v1/trips/{trip}/activities`
- GET `/api/v1/trips/{trip}/activities`
- GET `/api/v1/trips/{trip}/activities/grouped-by-day`
- GET `/api/v1/trips/{trip}/activities/{activity}`
- PATCH `/api/v1/trips/{trip}/activities/{activity}`
- POST `/api/v1/trips/{trip}/activities/{activity}/regenerate`
- POST `/api/v1/trips/{trip}/activities/reorder`
- DELETE `/api/v1/trips/{trip}/activities/{activity}`
- POST `/api/v1/trips/{trip}/activities/{activity}/restore`

### Places / Routes
- GET `/api/v1/places/{placeId}`
- GET `/api/v1/places/{placeId}/reviews`
- GET `/api/v1/trips/{trip}/routes`
- GET `/api/v1/trips/{trip}/travel-times`
- GET `/api/v1/restaurants/nearby`

### AI
- POST `/api/v1/ai/plan`
- POST `/api/v1/ai/trips/{trip}/days/{day}/generate`
- POST `/api/v1/ai/activities/{activity}/generate`
- GET `/api/v1/ai/jobs/{jobId}`
- POST `/api/v1/ai/jobs/{jobId}/cancel`
- POST `/api/v1/ai/qa`
- POST `/api/v1/ai/branch`

### Flights / Hotels / Local Transports
- GET/POST/PATCH/DELETE `/api/v1/trips/{trip}/flights...`
- GET/POST/PATCH/DELETE `/api/v1/trips/{trip}/hotels...`
- GET/POST/PATCH/DELETE `/api/v1/trips/{trip}/local-transports...`

### Sharing / Recap
- GET `/api/v1/trips/{trip}/recap`
- POST `/api/v1/trips/{trip}/share`
- GET `/api/v1/share/{token}`

### Exports
- POST `/api/v1/trips/{trip}/export/pdf`
- POST `/api/v1/trips/{trip}/export/ics`

### Consent
- GET `/api/v1/consent`
- POST `/api/v1/consent`

### Booking
- POST `/api/v1/trips/{trip}/booking/checkout`

### Admin
- GET `/api/v1/admin/metrics`

## Conventions
- Success envelope:
```json
{ "success": true, "data": {}, "meta": {} }
```
- Error envelope:
```json
{ "success": false, "error": { "code": "...", "message": "...", "details": {} } }
```
- No persistence in this phase. Every implementation contains TODO markers for DB/external integrations.

## Notes on Future DB
- The current MCD is used only as naming/domain inspiration.
- API contracts stay implementation-agnostic to absorb model changes without breaking frontend integration.
- Services layer is intentionally interface-driven to swap stub implementations with repository/domain implementations later.
