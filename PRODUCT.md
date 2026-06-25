# Product Context — Triply

## What Is Triply?

Triply is a collaborative multi-day trip planner. Users create voyages (trips), break them into journées (days), add étapes (activities), and manage transports + accommodations. It's real-time, multi-user, and tightly integrated with Amadeus (flights/hotels/POIs) and Mapbox (routing).

## Product Type
**Product-focused** (not marketing). Prioritizes user workflows, clarity, error handling, and accessibility over visual novelty.

## User Personas

### Primary: The Planner (65%)
- Age: 28–45
- Plans trips 2–8 weeks ahead
- Wants flexibility + control
- Uses on mobile + desktop
- Needs: clear itinerary view, easy editing, sharing

### Secondary: The Collaborator (25%)
- Planning with friends/family
- Wants to see updates in real-time
- Light edits, mostly views
- Mobile-first

### Tertiary: The Organizer (10%)
- Professional trip coordinator
- Volume user, complex trips
- Needs advanced UI: bulk edits, export, analytics

## Core Features

1. **Trip Creation** — Multi-step wizard (destination, dates, travelers, budget)
2. **Day Planning** — Add activities, auto-route between locations, see map
3. **Transport** — Flight + hotel booking (Amadeus integration), local transport
4. **Sharing** — Public/private links, real-time sync
5. **Export** — PDF itinerary, iCalendar (.ics)
6. **Admin** — Revenue metrics, subscription tiers

## Design Priorities

1. **Clarity:** Users must see trip state (destination, dates, completion %) immediately
2. **Editing ease:** Drag-drop for ordering, inline editing for content
3. **Mobile:** Responsive, touch-friendly, no horizontal scroll
4. **Real-time:** Shared trips show updates without refresh
5. **Accessibility:** WCAG AA minimum, keyboard nav, focus states

## Non-Goals

- :x: 3D visualizations or excessive animations
- :x: "Viral" sharing features (private first)

## Now in scope (was Non-Goal — flipped 2026-06-15)

- :white_check_mark: **Dark mode as default** (already shipped by the designer in `globals.css`). Premium feel, distinguishes from Wanderlog/TripIt. Light theme stays as user toggle via `[data-theme="light"]`.
- :white_check_mark: **Offline mode (mobile PWA).** Travelers lose signal abroad — critical differentiator. Service worker + cache snapshot of active trip.

## Technical Constraints

- **Frontend:** Next.js 16, React 19, Tailwind v4, standalone output (no Node.js at runtime)
- **Backend:** Laravel 11, PostgreSQL 16, Sanctum bearer-token auth
- **Integrations:** Amadeus (flights, hotels, geocoding), Mapbox (routing, geocoding), Stripe (subscriptions)
- **Deployment:** Docker Compose (dev), Traefik + VPS (prod)

## Accessibility Requirements

- **WCAG AA** as minimum standard
- **All interactive elements:** keyboard-accessible (Tab, Enter, Escape)
- **Focus indicators:** Always visible (emerald ring, not browser default)
- **Images & icons:** Semantic alt text or ARIA labels
- **Modals:** role="dialog", focus trap, Escape to close
- **Color:** Never sole indicator (use icons + color)

## Performance Targets

- **Page load:** < 2s (Core Web Vitals)
- **Interaction:** < 100ms (time to interactive)
- **Trip load:** < 500ms (real-time sync latency < 100ms)

## Content & Tone

- **Voice:** Warm, encouraging, never corporate
- **Tone:** Conversational, adventure-focused
- **Copy:** Action-oriented ("Create trip," not "Generate voyage instance")
- **Errors:** Helpful, specific, actionable (not technical jargon)

---

**Last updated:** 2026-06-15
