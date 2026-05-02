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
| Zustand | latest | Client state (auth tokens, WS status, display prefs) |
| vite-plugin-pwa | latest | Service worker, web manifest, offline cache |
| @fontsource/bebas-neue | latest | Display font (self-hosted, no FOUT) |
| @fontsource/jetbrains-mono | latest | Mono font (self-hosted) |

**Install command** (run once after scaffold):

```bash
npm install @tanstack/react-router @tanstack/react-query axios zustand \
            @fontsource/bebas-neue @fontsource/jetbrains-mono
npm install -D @tailwindcss/vite vite-plugin-pwa @tanstack/router-plugin
```

---

## Architecture

### Folder Structure

```
src/
  api/
    axios.ts           # Axios instance, base URL from env, JWT interceptors
    timers.ts          # REST functions for timer endpoints
    auth.ts            # Login and token refresh calls
    queryKeys.ts       # TanStack Query key factory
  components/
    display/
      TimerDigits.tsx       # Large countdown numerals
      ZoneTintLayer.tsx     # Coloured background overlay keyed to zone state
      TopStrip.tsx          # 10% top bar: logo, timer name, wall clock
      BottomStrip.tsx       # 10% bottom bar: secondary label
      MessageOverlay.tsx    # 20% bottom bar that slides up over BottomStrip
      EmergencyScreen.tsx   # Full-screen pulsing red emergency state
      IdleScreen.tsx        # state=idle: dashes, logo, "Waiting to start"
      RunningScreen.tsx     # state=running: active ZoneTintLayer, live countdown
      PausedScreen.tsx      # state=paused: blinking digits + PAUSED badge
      OvertimeScreen.tsx    # state=overtime: red zone pulse, +HH:MM:SS digits
    admin/
      SetupCard.tsx         # Timer picker (initial load, no timer selected)
      SettingsPanel.tsx     # Zone config, duration, accent colour, font size
      TimerControls.tsx     # Start / Pause / Resume / Reset buttons
      MessageComposer.tsx   # Text input + send/clear for message overlay
      EmergencyButton.tsx   # Guarded emergency trigger
    shared/
      LogoMark.tsx          # Inline SVG logo (44×28 viewBox, currentColor)
      WarningIcon.tsx       # Inline SVG warning triangle (48×48, currentColor)
      ThemeProvider.tsx     # Reads displayStore, applies data-theme on <html>
  hooks/
    useTimerSync.ts    # rAF loop: computes remaining from end_time + skew
    useWebSocket.ts    # WS lifecycle, reconnect backoff, dispatch to store
    useClockSkew.ts    # Ping/pong round-trip to compute clock skew offset
    useAuth.ts         # Login, logout, auto-refresh helpers
  lib/
    time.ts            # formatDuration(), formatOvertime(), formatWallClock()
    theme.ts           # Tailwind class helpers for zone/state colours
    constants.ts       # WS_RECONNECT_DELAY, PING_INTERVAL, etc.
  routes/
    __root.tsx         # Root layout: ThemeProvider + Outlet + auth guard
    index.tsx          # "/" — redirects to /admin/login
    display/
      $timerId.tsx     # "/display/$timerId" — full-screen display
    admin/
      login.tsx        # "/admin/login"
      index.tsx        # "/admin" — fetches timer list, redirects to first timer
      $timerId.tsx     # "/admin/$timerId" — admin panel for one timer
  store/
    authStore.ts       # accessToken, refreshToken, expiresAt, setTokens, clearTokens
    wsStore.ts         # timerState, connectionStatus, clockSkewOffset
    displayStore.ts    # theme ("blackout"|"rehearsal"), fontSizeOverride
  types/
    timer.ts           # TimerState, TimerZone, TimerFontSize, TimerStatus
    ws.ts              # WSMessageIn, WSMessageOut (discriminated unions)
    api.ts             # LoginRequest, LoginResponse, TimerListItem, ApiError
  main.tsx             # Entry: QueryClientProvider + RouterProvider
```

### Routing Strategy

TanStack Router in **file-based mode** (`@tanstack/router-plugin` generates the route
tree from `src/routes/`).

| Route | Auth required | Notes |
|---|---|---|
| `/display/$timerId` | No | Opens WS immediately, never redirects |
| `/admin/login` | No | Redirects to `/admin` on success |
| `/admin` | Yes | Fetches timer list, redirects to first timer |
| `/admin/$timerId` | Yes | Full admin panel |
| `/` | No | Redirects to `/admin/login` |

Auth guard in `__root.tsx`:

```ts
export const Route = createRootRoute({
  beforeLoad: ({ location }) => {
    const isAdminRoute = location.pathname.startsWith('/admin') &&
                         location.pathname !== '/admin/login'
    if (isAdminRoute && !authStore.getState().accessToken) {
      throw redirect({ to: '/admin/login' })
    }
  },
  component: RootLayout,
})
```

### State Management

Three Zustand stores — small and single-purpose:

| Store | Persistence | Contents |
|---|---|---|
| `authStore` | `sessionStorage` | `accessToken`, `refreshToken`, `expiresAt` |
| `wsStore` | In-memory | `timerState: TimerState \| null`, `connectionStatus`, `clockSkewOffset` |
| `displayStore` | `localStorage` | `theme: 'blackout' \| 'rehearsal'`, `fontSizeOverride: TimerFontSize \| null` |

`authStore` is read directly by the Axios interceptor (outside React). Export both the
hook (`useAuthStore`) and the raw store (`authStore`) from `authStore.ts`.

TanStack Query manages REST data (timer list for admin, initial timer detail). It does
**not** manage live timer state — that comes exclusively from `wsStore` via WebSocket.

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

`ThemeProvider` reads `displayStore.theme` to override the default when the user
explicitly toggles. The `data-theme` attribute is set on `<html>` by `ThemeProvider`.

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

Import fonts in `src/main.tsx`:

```ts
import '@fontsource/bebas-neue'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/500.css'
```

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

## Display Feature

### Screen Routing Logic

`EmergencyScreen` takes priority over all `state` values. Evaluation order:

```ts
if (timer.emergency_active)              return <EmergencyScreen />
switch (timer.state) {
  case 'idle':     return <IdleScreen />
  case 'running':  return <RunningScreen />
  case 'paused':   return <PausedScreen />
  case 'overtime': return <OvertimeScreen />
}
```

### Screen Components

| Component | Condition | Notes |
|---|---|---|
| `EmergencyScreen` | `emergency_active === true` | Always first; full-screen solid red, pulsing |
| `IdleScreen` | `state === 'idle'` | Centred logo + name + `--:--` dashes, no zone tint |
| `RunningScreen` | `state === 'running'` | ZoneTintLayer active, live rAF countdown |
| `PausedScreen` | `state === 'paused'` | `animate-digit-blink`, static `paused_remaining` display |
| `OvertimeScreen` | `state === 'overtime'` | Red tint with `animate-zone-red`, `+HH:MM:SS` format |

### ZoneTintLayer

Reads `timer.zones` sorted by `threshold` descending. Finds the first zone whose
`threshold ≥ remaining_seconds`. Renders a full-size absolute `<div>` behind all content
with the zone colour at the correct opacity. Applies `animate-zone-red` when active zone
is red.

```ts
function getActiveZone(zones: TimerZone[], remainingMs: number): TimerZone | null {
  const remainingSec = remainingMs / 1000
  return [...zones]
    .sort((a, b) => b.threshold - a.threshold)
    .find(z => remainingSec <= z.threshold) ?? null
}
```

### Timer Sync Algorithm

**Never interpolate. Compute from `end_time` on every frame.**

```ts
// src/hooks/useTimerSync.ts
export function useTimerSync(timer: TimerState | null): number {
  const clockSkewOffset = useWsStore(s => s.clockSkewOffset)
  const [remaining, setRemaining] = useState(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    function tick() {
      let ms: number
      if (timer?.state === 'running' && timer.end_time) {
        const serverNow = Date.now() + clockSkewOffset
        ms = new Date(timer.end_time).getTime() - serverNow
      } else if (timer?.state === 'paused' && timer.paused_remaining !== null) {
        ms = timer.paused_remaining  // static — no drift possible
      } else {
        ms = (timer?.duration ?? 0) * 1000  // idle preview
      }
      setRemaining(Math.max(0, ms))
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [timer, clockSkewOffset])

  return remaining
}
```

Rules:
- `requestAnimationFrame` is the **only** countdown loop. No `setInterval`.
- When `remaining <= 0` and `state === 'running'`, display `00:00` and wait for the
  server to push `state: 'overtime'`. Never transition locally.
- Overtime display: count up from zero. `remaining` will go negative once the server
  sends `state: 'overtime'` — use `Math.abs(remaining)` for the digit display.

### Clock Skew Measurement

```ts
// src/hooks/useClockSkew.ts
// 1. On WS open: record t0 = Date.now(), send { type: 'ping' }
// 2. On pong: skew = serverTime - (t0 + rtt/2)  where rtt = Date.now() - t0
// 3. Store skew in wsStore.clockSkewOffset
// 4. Repeat every PING_INTERVAL (30_000 ms) to track drift
```

Applied as: `serverNow = Date.now() + clockSkewOffset` in every rAF frame.

### WebSocket Connection Lifecycle

```ts
// src/hooks/useWebSocket.ts (behaviour spec)
// 1. On mount: ws = new WebSocket(wsUrl(timerId))
// 2. If admin mode: on open → send { type: 'auth', token: accessToken }
// 3. on open: send ping (start skew measurement), set status = 'open'
// 4. on message: parse JSON, dispatch by type:
//      'timer_state' → wsStore.setTimerState(msg)        (msg fields are flat)
//      'pong'        → onPong(msg.server_time)
//      'auth_ok'     → wsStore.setAuthStatus('authenticated')
//      'auth_error'  → authStore.clearTokens(); navigate('/admin/login')
// 5. on close/error: set status = 'closed'/'error'
//      schedule reconnect: delay = min(WS_RECONNECT_DELAY * 2^attempt, 30_000)
//      up to WS_MAX_ATTEMPTS (5) reconnect attempts
// 6. on unmount: ws.close() — cancel any pending reconnect

// src/lib/constants.ts
export const WS_RECONNECT_DELAY = 3_000   // ms
export const WS_MAX_ATTEMPTS    = 5
export const PING_INTERVAL      = 30_000  // ms
```

---

## Admin Feature

### Auth Flow

1. **Login** — POST `/api/auth/token/` → store `access`, `refresh`, decoded `exp` in
   `authStore` (sessionStorage). Navigate to `/admin`.
2. **Request interceptor** — every Axios request attaches
   `Authorization: Bearer {accessToken}`.
3. **Response interceptor (401 handling)** — on first 401, pause the request queue,
   POST `/api/auth/token/refresh/`, retry all queued requests. On refresh failure,
   clear tokens and redirect to `/admin/login`.
4. **Auto-refresh** — `useAuth` sets a `setTimeout` to refresh 60 seconds before
   `expiresAt`. Cleared on logout or hook unmount.
5. **Logout** — `authStore.clearTokens()`, close WS, navigate to `/admin/login`.

### Admin Layout — `/admin/$timerId`

```
┌──────────────────────────────────────────────────┐
│  Left (60%)              │  Right (40%)           │
│  Live preview            │  TimerControls         │
│  (display components,    │  SettingsPanel         │
│   scaled down, read-only)│  MessageComposer       │
│                          │  EmergencyButton       │
└──────────────────────────────────────────────────┘
```

The left panel renders the same display components (`RunningScreen`, etc.) driven by
`wsStore.timerState`. It is purely read-only.

### Mutation → WS Pattern

REST mutations go through TanStack Query `useMutation`. **Do not optimistically update
`wsStore` after a mutation.** Wait for the next `timer_state` WebSocket push. The server
broadcasts state after every REST mutation, so UI lag is imperceptible.

```ts
const startMutation = useMutation({
  mutationFn: () => apiClient.post(`/api/timers/${timerId}/start/`),
  // No onSuccess state update needed — WS push arrives momentarily
})
```

---

## API Layer

### Axios Instance — `src/api/axios.ts`

```ts
import axios from 'axios'
import { authStore } from '../store/authStore'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT
apiClient.interceptors.request.use(config => {
  const token = authStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Refresh queue pattern
let isRefreshing = false
let queue: Array<(token: string) => void> = []

apiClient.interceptors.response.use(
  res => res,
  async error => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      if (!isRefreshing) {
        isRefreshing = true
        try {
          const refresh = authStore.getState().refreshToken
          const base = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'
          const { data } = await axios.post(`${base}/api/auth/token/refresh/`, { refresh })
          authStore.getState().setTokens(data.access, data.refresh)
          queue.forEach(cb => cb(data.access))
          queue = []
        } catch {
          authStore.getState().clearTokens()
          window.location.href = '/admin/login'
          return Promise.reject(error)
        } finally {
          isRefreshing = false
        }
      }
      return new Promise(resolve => {
        queue.push(token => {
          original.headers.Authorization = `Bearer ${token}`
          resolve(apiClient(original))
        })
      })
    }
    return Promise.reject(error)
  }
)
```

### Query Key Factory — `src/api/queryKeys.ts`

```ts
export const timerKeys = {
  all:    ()           => ['timers']                as const,
  list:   ()           => ['timers', 'list']        as const,
  detail: (id: number) => ['timers', id]            as const,
  zones:  (id: number) => ['timers', id, 'zones']   as const,
}
```

### TanStack Query Patterns

- **Timer list** (admin index): `useQuery({ queryKey: timerKeys.list(), queryFn: fetchTimers })`
- **Timer detail** (admin initial load): `useQuery({ queryKey: timerKeys.detail(id), queryFn: () => fetchTimer(id) })`
- Admin query client: set `retry: false` — surface API errors immediately, do not mask them with retries.
- Display routes use no TanStack Query at all; they read exclusively from `wsStore`.

### WebSocket URL Helper

```ts
// src/lib/constants.ts
const wsBase = import.meta.env.VITE_WS_BASE_URL ?? 'ws://localhost:8000'
export const wsUrl = (timerId: number) => `${wsBase}/ws/timers/${timerId}/`
```

---

## TypeScript Conventions

Enable `"strict": true` in `tsconfig.app.json` `compilerOptions`.

### Key Interfaces

```ts
// src/types/timer.ts
export type TimerStatus   = 'idle' | 'running' | 'paused' | 'overtime'
export type TimerFontSize = 'small' | 'medium' | 'large'

export interface TimerZone {
  id: number
  label: string
  threshold: number   // seconds remaining at which this zone activates
  color: string       // hex, e.g. "#FF2040"
  tint_opacity: number // 0–100
  order: number
}

export interface TimerState {
  id: number
  name: string
  state: TimerStatus
  end_time: string | null        // ISO 8601 UTC — null when not running
  paused_remaining: number | null // milliseconds — non-null only when paused
  duration: number               // seconds (full configured duration)
  message_text: string
  message_active: boolean
  emergency_text: string
  emergency_active: boolean
  logo: string | null            // URL or null
  accent_color: string           // hex
  font_size: TimerFontSize
  show_clock: boolean
  updated_at: string             // ISO 8601
  zones: TimerZone[]
}
```

```ts
// src/types/ws.ts
// timer_state is FLAT — all fields at top level, not nested under "payload"
export type WSMessageIn =
  | ({ type: 'timer_state' } & TimerState)
  | { type: 'pong';       server_time: number }
  | { type: 'auth_ok' }
  | { type: 'auth_error'; detail: string }

export type WSMessageOut =
  | { type: 'ping' }
  | { type: 'auth'; token: string }
```

```ts
// src/types/api.ts
export interface LoginRequest    { username: string; password: string }
export interface LoginResponse   { access: string; refresh: string }
export interface ApiError        { detail: string }

export interface TimerListItem {
  id: number
  name: string
  state: TimerStatus
}
```

### General Conventions

- `interface` for object shapes; `type` for unions and primitives.
- One component per file; file name matches component name.
- Export the Zustand hook (e.g. `useWsStore`) and, where needed outside React (e.g.
  interceptors), also export the raw store (`wsStore`).
- No `any`. Use `unknown` and narrow with type guards.
- No `as` casts without an inline comment explaining why the cast is safe.
- All WS message types use `type` as the discriminant in a discriminated union.
- Function components only. No class components.

---

## PWA Requirements

### `vite.config.ts`

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'

export default defineConfig({
  plugins: [
    TanStackRouterVite({ routesDirectory: './src/routes' }),
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Venue Timer',
        short_name: 'VenueTimer',
        description: 'Real-time stage timer for live events',
        theme_color: '#050912',
        background_color: '#050912',
        display: 'fullscreen',
        orientation: 'landscape',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/.*\/api\//,
            handler: 'NetworkOnly', // Never serve stale API responses
          },
        ],
      },
    }),
  ],
})
```

### Offline Behaviour

- App shell and fonts load from the service worker cache when offline.
- Display page renders the last `timerState` held in `wsStore` memory with a
  "Connection lost" indicator — digits do not clear.
- Admin REST calls fail gracefully; TanStack Query surfaces the error immediately
  (`retry: false`).
- Fonts are bundled via `@fontsource` and cached by the service worker — no flash of
  unstyled text, no CDN dependency.

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

### Display URL Convention

Display screens are navigated to directly — there is no in-app navigation to them:

```
http://localhost:5173/display/<timerId>
```

Operators configure kiosk mode or bookmark this URL on each display device.

---

## Inline SVG Assets

Both assets are React components with inline SVG (not `<img>`). This enables
`currentColor` theming and eliminates extra network requests.

**`LogoMark`** — ViewBox `0 0 44 28`. Rounded rectangle with a play-button triangle
inside. Uses `fill="currentColor"`. Size set via `width`/`height` props.

**`WarningIcon`** — ViewBox `0 0 48 48`. Equilateral triangle outline with exclamation
mark. Uses `stroke="currentColor"`. Used in `EmergencyScreen` and error states.

---

## Key Constraints

1. **Never mutate timer state client-side.** All changes go through the server via REST.
   The client is always a render of server state received over WebSocket.

2. **Clock skew must be measured.** Display hardware in a venue may drift from the
   server clock. Always apply `clockSkewOffset` when computing `remaining`.

3. **`requestAnimationFrame` is the only countdown loop.** No `setInterval` or
   `setTimeout` for digit updates.

4. **`EmergencyScreen` overrides all other states.** Check `emergency_active` before the
   `state` switch, every render.

5. **Display routes are unauthenticated.** Never attach a JWT to a WebSocket opened from
   `/display/$timerId`. Only admin routes send the auth frame on open.

6. **Fonts are self-hosted via `@fontsource`.** Never load Bebas Neue or JetBrains Mono
   from Google Fonts or any external CDN.

7. **`strict: true` in tsconfig.** Any weakening of type-safety (e.g.
   `noImplicitAny: false`) requires an adjacent comment explaining why.
