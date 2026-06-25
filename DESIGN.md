# Design System — Triply

**Product type:** Travel planning app — premium dark-first, distinctive cyan brand.

**Source of truth:** `frontend/app/globals.css` + the components our designer shipped. This document mirrors that code — when the two disagree, **the code wins** and this doc is updated.

## Audience
Travelers planning multi-day trips. Ages 25–55. Tech-comfortable. Want ease + control.

## Voice & Tone
- **Warm, confident, exploratory** (not corporate, not juvenile)
- Encourage adventure without pressure
- Clarity over cuteness

## Theme

**Dark-first.** Default `--background: #1c1c1c`. Light theme available via `[data-theme="light"]` toggle. Both share the same brand palette.

| Surface | Dark (default) | Light |
|---|---|---|
| `--background` | `#1c1c1c` | `#eef2f7` |
| `--card` | `#2a2a2a` | `#ffffff` |
| `--foreground` | `#f4f4f5` | `#0f172a` |
| `--surface` | `rgba(255,255,255,0.07)` | `rgba(15,23,42,0.06)` |
| `--border` | `rgba(255,255,255,0.22)` | `rgba(15,23,42,0.20)` |

## Color Palette (designer charte)

| Role | Token | Hex | Use |
|---|---|---|---|
| **Primary (Brand)** | `--primary` | `#0096C7` | CTAs, selection, focus rings, "Triply" identity |
| **Brand hover** | `--brand-hover` | `#007fa8` (dark) / `#0077a8` (light) | Hover state on primary |
| **Secondary** | `--secondary` | `#115C75` | Pressed states, dense brand accents |
| **Micro design** | `--micro-design` | `#00A896` | Subtle teal accents |
| **Accent** | `--accent` / `--cyan-accent` | `#22d3ee` (dark) / `#0891b2` (light) | Highlights, "special" features |
| **Success** | `--success-fg` | `#34d399` / `#047857` | Confirmations |
| **Warning** | `--warning-fg` | `#fbbf24` / `#b45309` | Cautions |
| **Error** | `--error-fg` | `#fb7185` / `#be123c` | Errors, destructive actions |

**Rules:**
- Always reference CSS variables (`var(--primary)`) or the utility aliases `.bg-brand`, `.text-brand`, `.border-brand`, `.ring-brand`, `.bg-cyan-accent`, etc.
- The legacy fallback `var(--primary, #0096c7)` is accepted in inline styles for SSR-safety.
- Tonal variations via `.bg-brand/5`, `.bg-brand/10`, … `.bg-brand/30` (color-mix utilities defined in globals.css).
- Gray text on colored bg = forbidden (contrast).
- **Do not swap the brand to emerald or any other color.** Cyan `#0096C7` is the designer's identity — preserve it.

## Typography

| Element | Font family | Token |
|---|---|---|
| Display (h1-h6) | **Chillax** (Light 300 → Bold 700) | `--font-title` |
| Body / UI | **Gotham** (Book 400, Medium 500, Bold 700) | `--font-text` |
| Mono | system mono | `--font-mono` |

Headings auto-use Chillax via `h1, h2, h3, h4, h5, h6 { font-family: var(--font-title); }`. Body inherits Gotham via `body`.

Utility class: `.font-display` to force Chillax on non-heading elements.

Sizes follow Tailwind defaults; keep hierarchy intentional (h1 → 2rem, h2 → 1.5rem, h3 → 1.25rem, body 1rem). Avoid mixing `text-xs` (12px) with `text-sm` (14px) randomly — pick one for captions per surface.

## Spacing Grid (8px base)

```
xs: 4px    sm: 8px    md: 16px    lg: 24px    xl: 32px    2xl: 48px    3xl: 64px
```

Use consistently.

## Radii

Designer charte allows expressive radii on hero / marketing / "moment" surfaces — the big rounded look is part of the brand identity, not an anti-pattern. Keep proportions deliberate.

| Use | Class / token |
|---|---|
| Inputs, chips | `rounded-md` (6px) / `rounded-lg` (8px) |
| Buttons, secondary cards | `rounded-xl` (12px) / `rounded-2xl` (16px) |
| Primary cards, modals | `rounded-3xl` (24px) — `triply-card` uses `1rem` |
| Hero / brief textareas / featured panels | `rounded-[32px]` to `rounded-[40px]` (designer signature) |

The expressive `rounded-[40px]` on the Mode Libre brief textarea is intentional — keep it. New surfaces of the same "moment" weight should align with that scale.

## Shadows

- `shadow-sm`, `shadow-md`, `shadow-lg` (Tailwind defaults) for surfaces
- `.shadow-brand/10`, `.shadow-brand/20`, `.shadow-brand/30` for brand glow on cyan CTAs
- `.triply-card` has its own calibrated shadow tied to theme

## Components

### Button (`src/components/Button/Button.tsx`)

Designer skeuomorphic 3D system. **Intentional, brand-defining — do not flatten.**

- Layered outline + offset top layer with `translateY(-0.2em)` at rest, `-0.33em` on hover, `0` on active.
- Variants: `dark` / `light`. Tones: `tone1` (primary cyan), `tone2` (neutral dark/white).
- Outline color is the contrast layer — white on dark surfaces, near-black `#222222` on light.
- API: `label`, `onClick`, `type`, `variant`, `tone`, `loading`, `disabled`, `className`.

Use `.btn-primary` / `.btn-secondary` utility classes in globals.css when a full React component is overkill (forms, inline CTAs). They mirror the same 3D layered shadow with `box-shadow: 0 4px 0 0 var(--secondary)`.

### Card (`triply-card`)

```
background-color: var(--card)
border: 1px solid var(--border)
border-radius: 1rem
box-shadow: theme-aware (sharper in dark, softer in light)
```

No nested `triply-card` inside `triply-card`. Use dividers instead.

### Input (`input-assistant`)

Subtle surface + 1px border, brand cyan glow on focus-within (`box-shadow: 0 0 0 2px rgba(0,150,199,0.25)`). Preserve.

### Autocomplete

Brand ring + checkmark on selection. Fallback chain Amadeus → Mapbox → Nominatim already handled in backend.

## Motion

- 100ms–200ms for micro (hover, button-3D lift)
- 200ms–300ms for view transitions
- Bouncy `hover:scale-[1.02]` is part of the brand energy on a few hero CTAs — keep deliberate, do not flatten everywhere
- `transform`, `opacity` preferred for GPU performance

## Accessibility Baselines

- All text ≥ 4.5:1 contrast (AA)
- Focus states always visible (brand cyan ring)
- Keyboard nav, ARIA labels, modals with `role="dialog"` + focus trap
- Reduced-motion: respect `prefers-reduced-motion` on the 3D button lift

## Responsive Breakpoints

| Device | Width | Layout |
|---|---|---|
| Mobile | 320–640 | single column, full-width cards, `px-4` minimum |
| Tablet | 640–1024 | 2-column grid, padded |
| Desktop | 1024+ | 3-column grid, max-width container |

## Anti-Patterns (Never)

- ❌ Swap brand cyan for emerald / blue / purple — preserve `#0096C7` identity
- ❌ Flatten the 3D Button into a default flat button
- ❌ Nested `triply-card` cards
- ❌ Pure black text/bg (always tinted)
- ❌ Gray text on colored backgrounds
- ❌ Purple → blue gradients
- ❌ Centered prose layouts (reading width > 70ch)
- ❌ No focus states
- ❌ `setTimeout` placeholder loading delays (fake spinners)
- ❌ Hardcoded `#0096c7` literals in components — use `var(--primary)` so light/dark themes stay coherent

---

**Last updated:** 2026-06-15 — synced to designer charte (cyan brand, dark-first, 3D button).
**Maintained by:** Design + Engineering team.
