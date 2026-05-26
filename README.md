# Venue and Debate Timer

**A real-time stage timer for live events.**

Venue and Debate Timer is a purpose-built event-timing platform for the real demands of live shows.
It runs multiple rooms at the same time — each with its own schedule, its own speakers,
and its own look — and pushes every change to the screens in the room the instant it
happens. Built by [Flare](https://flare.gr) for [Debate House](https://debatehouse.gr),it is released free and open source for any organiser, anywhere, to use.

The display changes colour as time runs out, giving speakers a clear visual signal — no
words needed. When a speaker's time is up the timer doesn't stop; it keeps counting, so
everyone sees exactly how far over they are. And during each speech the screen shows
whether questions may be asked right now, or whether protected time is still in force.

## Features

- **Multi-room events** — run any number of rooms simultaneously, each with its own
  runsheet, speakers, and branding.
- **Real-time display** — full timer state is pushed from the server over WebSocket;
  screens update within a round-trip, with no refresh and no client-side timer logic.
- **Colour-zone countdown** — the display shifts green → amber → red as time runs out,
  a clear visual cue that needs no words.
- **Overtime** — when time expires the timer keeps counting upward so everyone can see
  how far over a speaker has run.
- **Debate-aware** — shows debaters whether questions (points of information) may be
  asked, or whether protected time is still in force.
- **Per-room branding & customizability** — logo, accent colour, font size, wall clock,
  and show/hide chrome strips, all configurable per room.
- **Messages & emergencies** — slide a message banner onto every screen, or trigger a
  full-screen emergency takeover instantly.
- **Two modes** — an unauthenticated full-screen Display for stage and confidence
  monitors, and a JWT-authenticated admin panel for operators.
- **Installable PWA** — runs on dedicated display hardware and survives brief network
  interruptions without losing the current state.
- **Internationalised** — Greek and Latin out of the box.

## Tech stack

Vite · React 19 · TypeScript (strict) · TailwindCSS v4 · TanStack Router & Query ·
Zustand · vite-plugin-pwa.

The companion Django backend
([`venue_timer_backend`](https://github.com/flare-gr/venue_timer_backend)) is the single
source of truth for all timer state; this app is always a render of state received over
WebSocket.

## Getting started

First, set up and run the
[backend](https://github.com/flare-gr/venue_timer_backend) — it's the source of truth for
all timer state, and no feature works without it. Follow the setup instructions in that repo,
then come back here.

Create `.env` at the project root (both default to `localhost:8000` when unset):

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_BASE_URL=ws://localhost:8000
```

Then:

```bash
npm install
npm run dev      # Vite dev server with HMR — http://localhost:5173
npm run build    # type-check + production build → dist/
npm run preview  # serve the production build (tests PWA/service worker)
npm run lint     # ESLint
```

The Django backend must be running at `VITE_API_BASE_URL` for any feature to work.

## License

Released as open source — free for any organiser, anywhere in the world, to use. The
specific license is being finalized; see the `LICENSE` file (forthcoming).

## Credits

Built by **[Flare](https://flare.gr)** for **[Debate House](https://debatehouse.gr)**.

<p align="center">
  <a href="https://flare.gr">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://flare.gr/wp-content/uploads/2023/01/Artboard-1@8x-White.png">
      <img src="https://flare.gr/wp-content/uploads/2023/01/Artboard-1@8x-300x99.png" alt="Flare" height="48">
    </picture>
  </a>
  &nbsp;&nbsp;&nbsp;&nbsp;
  <a href="https://debatehouse.gr">
    <img src="https://debatehouse.gr/assets/images/logo.png" alt="Debate House" height="48">
  </a>
</p>
