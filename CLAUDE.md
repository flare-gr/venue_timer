# CLAUDE.md — Venue Timer Web App

## Related Repositories

| Repo | Path | Authority |
|---|---|---|
| Backend (Django) | `E:\CodeLab\venue_timer_backend\` | **Single source of truth for the API spec** — REST endpoints, WebSocket protocol, data models, authentication. When the backend and this CLAUDE.md conflict, trust the backend. |
| Display mockups | `E:\CodeLab\venue_timer_mockups\` | **Single source of truth for timer display design** — colour values, typography, layout, animations, component structure. When in doubt about any visual decision for the display feature, read the mockup HTML files in `display/`. |

The backend's `CLAUDE.md` documents the full architecture, data models, and protocol.
The mockups' `display/` folder contains standalone HTML files for every display state
(idle, running, amber, red, overtime, paused, message, emergency, setup, settings).

---

## Project Overview

Venue Timer Web App is a real-time stage timer PWA for live events. The Django backend
(`venue_timer_backend`) is the single source of truth for all timer state. This frontend
serves two distinct user modes:

- **Display Mode** (unauthenticated): Full-screen countdown shown on stage monitors,
  confidence monitors, or projected surfaces. Receives all state via WebSocket push.
  No login required.
- **Admin Mode** (JWT-authenticated): Operator control panel. Start, pause, resume, and
  reset timers; configure zones and duration; broadcast messages; trigger emergency alerts.
  Uses the same WebSocket but sends an auth frame on connect.

The app is a PWA so it can be installed on dedicated display hardware and survive brief
network interruptions without losing the current timer state from memory.

---

## Tech Stack

| Library | Version | Purpose |
|---|---|---|
| Vite | ^8 | Build tool, dev server, PWA bundler |
| React | ^19 | UI rendering |
| TypeScript | ~6 | Static typing (strict mode) |
| TailwindCSS | ^4 | Utility-first styling, CSS-first config |
| TanStack Router | latest | File-based routing with type-safe params |
| TanStack Query | latest | Server-state cache, REST fetching, mutation lifecycle |
| Axios | latest | HTTP client with JWT interceptors |
| Zustand | latest | Client state (WS status, display prefs) |
| vite-plugin-pwa | latest | Service worker, web manifest, offline cache |
| @fontsource/bebas-neue | latest | Display font (self-hosted, no FOUT) |
| @fontsource/jetbrains-mono | latest | Mono font (self-hosted) |

---

## Architecture Decisions

- All services live under `src/services/<name>/`. Do not create `src/api/` or `src/store/` for service logic.
- Auth tokens are stored in `localStorage` (persist across page loads).
- The configured Axios client with JWT interceptors lives on `authService` — import `authService.apiClient` for authenticated requests.

---

## Design System — "Cue"

### Colour Palette

Define tokens in `src/index.css` using Tailwind v4's `@theme` block. Apply different
values per theme by adding data-attribute selectors.

```css
/* src/index.css */
@import "tailwindcss";

@theme {
  /* Display screens default to Blackout */
  --color-cue-base:    #050912;
  --color-cue-surface: #0C1628;
  --color-cue-border:  #1A3050;
  --color-cue-accent:  #00C8FF;
  --color-cue-primary: #E2EEFF;
  --color-cue-muted:   #4A6B94;

  /* Zone colours — identical in both themes */
  --color-zone-green: #00F078;
  --color-zone-amber: #FFAA00;
  --color-zone-red:   #FF2040;

  /* Fonts */
  --font-display: "Bebas Neue", Impact, "Arial Narrow", sans-serif;
  --font-mono:    "JetBrains Mono", "Fira Code", ui-monospace, monospace;
}

/* Rehearsal (light) theme — applied when data-theme="rehearsal" is on <html> */
[data-theme="rehearsal"] {
  --color-cue-base:    #EEF5FF;
  --color-cue-surface: #FFFFFF;
  --color-cue-border:  #B8CCE4;
  --color-cue-accent:  #0055CC;
  --color-cue-primary: #071428;
  --color-cue-muted:   #3A5C82;
}
```

**Default themes by route:**
- Display routes (`/display/*`): `data-theme="blackout"` (dark)
- Admin routes (`/admin/*`): `data-theme="rehearsal"` (light)

#### Colour Reference

| Token | Blackout | Rehearsal | Usage |
|---|---|---|---|
| `--color-cue-base` | `#050912` | `#EEF5FF` | Page background |
| `--color-cue-surface` | `#0C1628` | `#FFFFFF` | Cards, panels, strips |
| `--color-cue-border` | `#1A3050` | `#B8CCE4` | Borders, dividers |
| `--color-cue-accent` | `#00C8FF` | `#0055CC` | Interactive highlights, focus |
| `--color-cue-primary` | `#E2EEFF` | `#071428` | Primary text |
| `--color-cue-muted` | `#4A6B94` | `#3A5C82` | Secondary text, placeholders |

#### Zone Colours (theme-invariant — use inline style or arbitrary values)

| Zone | Colour | Tint opacity | Animation |
|---|---|---|---|
| Green | `#00F078` | 20% | None |
| Amber | `#FFAA00` | 20% | None |
| Red | `#FF2040` | 30% | `animate-zone-red` (pulse 0.30→0.45) |
| Emergency | `#FF0000` | Solid (full screen) | `animate-emergency` (pulse bg) |

### Typography

**Timer digits** — define a Tailwind component class in `src/index.css`:

```css
@layer components {
  .timer-digits {
    font-family: var(--font-display);
    font-size: clamp(4rem, 37vw, 40rem);
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.05em;
    line-height: 1;
    user-select: none;
  }

  /* Smaller when MessageOverlay is visible (reduces center area to 70%) */
  .timer-digits-with-message {
    font-size: clamp(3.5rem, 33vw, 36rem);
  }
}
```

Overtime digits use `.timer-digits` with `color: #FF2040`.

**All display-mode text sizing must use `clamp(min, vw/vh-value, max)`.** Admin UI may
use standard Tailwind text size utilities.

### Layout Patterns

#### 16:9 Aspect-Ratio Container

Every display screen wraps its content in this container. It letterboxes/pillarboxes
automatically on any viewport.

```css
@layer components {
  .display-stage {
    width: min(100vw, 177.78vh);  /* 177.78 = 16/9 × 100 */
    aspect-ratio: 16 / 9;
    position: relative;
    overflow: hidden;
    margin: 0 auto;
    background: var(--color-cue-base);
  }
}
```

#### Three-Strip Layout

```
┌──────────────────────────────────┐  top: 0     h: 10%   TopStrip
│  [logo]  [name]  |  [wall clock] │  bg: cue-surface/90, border-b cue-border
├──────────────────────────────────┤  top: 10%   h: 80%   Center (timer digits)
│                                  │  (shrinks to 70% when MessageOverlay active)
│         HH : MM : SS             │  flex items-center justify-center
│                                  │
├──────────────────────────────────┤  top: 90%   h: 10%   BottomStrip
│  VENUE TIMER                     │  bg: cue-surface/90, border-t cue-border
└──────────────────────────────────┘
```

All strips use `position: absolute` inside `.display-stage`.

**When `message_active` is true:** `MessageOverlay` occupies the bottom 20% (slides up
from `translateY(100%)` to `translateY(0)`). The center area shrinks to 70%, BottomStrip
is hidden behind the overlay.

```css
@layer components {
  .top-strip     { position: absolute; inset: 0 0 auto; height: 10%; }
  .center-area   { position: absolute; top: 10%; left: 0; right: 0; bottom: 10%; }
  .bottom-strip  { position: absolute; inset: auto 0 0; height: 10%; }
  .message-overlay {
    position: absolute;
    inset: auto 0 0;
    height: 20%;
    transform: translateY(100%);
    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .message-overlay.active { transform: translateY(0); }
}
```

### Animation Catalogue

Define in `src/index.css` under `@layer base`:

```css
@layer base {
  @keyframes emergency-pulse {
    0%, 100% { background-color: #FF0000; }
    50%       { background-color: #CC0000; }
  }
  @keyframes emergency-text-pulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.7; }
  }
  @keyframes digit-blink {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.45; }
  }
  @keyframes zone-red-pulse {
    0%, 100% { opacity: 0.30; }
    50%       { opacity: 0.45; }
  }
  @keyframes msg-slide-in {
    from { transform: translateY(100%); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }
  @keyframes fetching-pulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.2; }
  }
}

@layer utilities {
  .animate-emergency      { animation: emergency-pulse      1.5s ease-in-out infinite; }
  .animate-emergency-text { animation: emergency-text-pulse 1.5s ease-in-out infinite; }
  .animate-digit-blink    { animation: digit-blink          2.4s ease-in-out infinite; }
  .animate-zone-red       { animation: zone-red-pulse       2s   ease-in-out infinite; }
  .animate-msg-slide-in   { animation: msg-slide-in         0.4s cubic-bezier(0.16, 1, 0.3, 1) both; }
  .animate-fetching       { animation: fetching-pulse       0.9s ease-in-out infinite; }
}
```

Standard transition durations:
- Buttons and state changes: `duration-[120ms]`
- Toggle thumb movement: `duration-[150ms]`
- Message bar entrance: `0.4s cubic-bezier(0.16, 1, 0.3, 1)` (via `.message-overlay`)

---

## Key Constraints

1. **Never mutate timer state client-side.** All changes go through the server via REST.
   The client is always a render of server state received over WebSocket.

2. **Clock skew must be measured.** Display hardware in a venue may drift from the
   server clock. Always apply a measured skew offset when computing remaining time.

3. **`requestAnimationFrame` is the only countdown loop.** No `setInterval` or
   `setTimeout` for digit updates.

4. **Emergency state overrides all other states.** Check `emergency_active` before the
   `state` switch, every render.

5. **Display routes are unauthenticated.** Never attach a JWT to a WebSocket opened from
   a display route. Only admin routes send the auth frame on open.

6. **Fonts are self-hosted via `@fontsource`.** Never load Bebas Neue or JetBrains Mono
   from Google Fonts or any external CDN.

7. **`strict: true` in tsconfig.** Any weakening of type-safety requires an adjacent
   comment explaining why.

---

## Development Workflow

### Environment Variables

Create `.env.local` at the project root (gitignored):

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_BASE_URL=ws://localhost:8000
```

Both default to `localhost:8000` when unset.

### Commands

```bash
npm run dev      # Vite dev server with HMR — http://localhost:5173
npm run build    # TypeScript check + production build → dist/
npm run preview  # Serve production build locally (tests SW/PWA behaviour)
npm run lint     # ESLint (TypeScript + React Hooks rules)
```

### Backend Dependency

The Django backend must be running at `VITE_API_BASE_URL` for any feature to work.

```bash
# From venue_timer_backend/
python manage.py runserver
```

Ensure `CORS_ALLOWED_ORIGINS` in Django settings includes `http://localhost:5173`.
