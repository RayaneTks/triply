# Triply - Product Context

## Product vision

Triply is an all-in-one AI travel assistant built to remove the mental load from trip planning.
The product centralizes flights, accommodations, activities, routing, and budget management so users no longer have to assemble a trip across fragmented tools.

## Problem statement

Organizing a trip has become exhausting despite the number of tools available.
Users often need to:

- compare flights across multiple platforms
- search accommodation separately
- estimate the total budget by hand
- reconcile preferences, timing constraints, and trip duration
- turn scattered research into a coherent itinerary

Triply exists to absorb this complexity behind a single, fluid experience.

## Core promise

Triply should help users:

- generate coherent and personalized itineraries in minutes
- respect budget as a hard constraint, not a loose estimate
- align recommendations with preferences, pace, and trip duration
- reduce friction from the first idea to the final plan

## Positioning

Triply sits between two imperfect categories:

- traditional comparison sites, which help search but fragment the booking and planning experience
- travel agencies, which reduce effort but are often expensive and less flexible

Triply aims to become the European standard for intelligent travel planning.

## Audience and personas

### Lea, 26, young professional

- Reality: travels several times a year and plans trips alone, but has dense workdays
- Pain point: does not want to spend evenings comparing hotels and logistics across many sites
- What Triply changes: delivers speed, clarity, and a personalized itinerary that respects budget without friction

### Yassine, 23, student

- Reality: wants to explore new destinations with friends and every euro matters
- Pain point: fitting a meaningful trip into a strict budget takes too much manual optimization
- What Triply changes: finds the best opportunities without requiring advanced travel-planning effort

### Camille and Hugo, 32 and 34, urban couple

- Reality: need short escapes to disconnect from daily life
- Pain point: organizing a relaxing trip becomes a logistical chore
- What Triply changes: gives them guided recommendations adapted to their tastes so the experience feels smooth from the preparation stage

## Product pillars

### 1. Budget reliability

Budget is a first-class constraint.
The experience should continuously show users whether the trip still fits their limit.

### 2. End-to-end centralization

Triply should reduce context switching between flights, accommodation, activities, maps, and itinerary management.

### 3. Intelligent personalization

Recommendations must reflect the traveler profile, preferences, group composition, trip duration, and energy level.

### 4. Time saved and stress removed

The product should optimize for fast decisions, low friction, and clear next actions.

### 5. Human-first AI

AI is useful only if it feels concrete, grounded, and comfortable to use.
It should guide users, not overwhelm them with generic suggestions.

## Experience principles

- Keep the interface clear, guided, and low-friction.
- Show tradeoffs simply when multiple options exist.
- Avoid feature sprawl that increases decision fatigue.
- Make the next best action obvious.
- Preserve user control with manual overrides when needed.
- Prefer concrete recommendations over abstract inspiration.

## Brand and tone

Triply should feel:

- fluid
- practical
- reassuring
- premium but accessible
- focused on comfort, not technology for its own sake

Messaging should emphasize mental-load reduction, personalization, budget discipline, and simplicity.

## Product constraints for future prompts

When extending Triply, prefer ideas and features that:

- reduce fragmentation instead of adding new detached flows
- help users decide faster
- keep budget visible early and throughout the journey
- support both busy professionals and price-sensitive travelers
- make the AI assistant a travel copilot, not a gimmick
- preserve a single coherent experience across inspiration, planning, and execution

## Repository layout (engineering)

This section complements product vision with how the codebase is organized today:

- **`backend/`** — Laravel REST API: authentication (Sanctum), trips, and server-side integrations (e.g. Amadeus, place reviews, copilot chat). Prefer keeping third-party secrets here.
- **Repository root (`src/`, `server.ts`, Vite config)** — Primary **SPA** (React, client routing). Express dev server proxies `/api/v1` to the Laravel container or to `LARAVEL_API_URL` when run locally.
- **`compose.dev.yaml`** + **`Makefile`** — Local development stack (PostgreSQL, PHP-FPM, Nginx, Redis, PgAdmin, SPA service `tri-app`).
