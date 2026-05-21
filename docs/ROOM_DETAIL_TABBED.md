# Room Detail Page — Tabbed Layout (Alternative Concept)

The shipped room-detail page at `/admin/rooms/$slug` uses a single scrolling layout:
**Controls → (Simple-mode timer details) / Runsheet → Zones → Settings**, stacked top
to bottom.

A tabbed variant was considered. This document captures the alternative for future
reference, and the reasoning for not picking it now.

---

## The shipped layout (single scrolling page)

```
┌────────────────────────────────────────────┐
│ ← All rooms                                │
│ MAIN HALL                                  │
│ /main-hall · schedule                      │
├────────────────────────────────────────────┤
│ ROOM CONTROLS                              │
│   ┌──────────────┬─ Handover banner ─┐    │
│   │ State + WS   │ Up next + countdown│    │
│   ├──────────────┴───────────────────┤    │
│   │  Current session block            │    │
│   │  [START] [PAUSE] [RESET]          │    │
│   │  Adjust: -30 -10 -5 +5 +10 +30    │    │
│   │  Override: MM:SS [SET]            │    │
│   ├───────────────────────────────────┤    │
│   │  [← PREV]      [NEXT →]           │    │
│   └───────────────────────────────────┘    │
│                                            │
│   [Message overlay]   [Emergency overlay]  │
├────────────────────────────────────────────┤
│ RUNSHEET                                   │
│   ::: 1  Keynote — Speaker A   5:00  [..]  │
│   ::: 2  Panel  — Speaker B    8:00  [..]  │
│   ::: 3  Q&A    — Speaker C    5:00  [..]  │
│   [+ ADD SESSION]                          │
├────────────────────────────────────────────┤
│ ZONES                                      │
│   Room Defaults                            │
│     Green · 120s · #00F078 · 20% ▮▮▯▯▯▯    │
│     Amber ·  60s · #FFAA00 · 20% ▮▮▮▯▯▯    │
│     Red   ·  30s · #FF2040 · 30% ▮▮▮▮▮▯    │
│   Override — Current Session               │
│     (empty — uses defaults)                │
├────────────────────────────────────────────┤
│ SETTINGS                                   │
│   Name · Mode · Font · Accent · Clock      │
│   Handover · Auto-advance                  │
│   [SAVE SETTINGS]            [Delete room] │
└────────────────────────────────────────────┘
```

## The alternative (tabs)

```
┌────────────────────────────────────────────┐
│ MAIN HALL  /main-hall · schedule           │
├────────────────────────────────────────────┤
│ ┌──CONTROLS──┬─RUNSHEET─┬─ZONES─┬SETTINGS┐ │
│ │            │          │       │        │ │
│ │  …active   │          │       │        │ │
│ │   tab      │          │       │        │ │
│ │            │          │       │        │ │
│ └────────────┴──────────┴───────┴────────┘ │
└────────────────────────────────────────────┘
```

Each section becomes a tab; only one is on screen at a time. Suggested tab labels and
component mapping:

| Tab        | Components                          |
|------------|-------------------------------------|
| Controls   | `RoomControls`                      |
| Runsheet   | `Runsheet` (or simple-mode details) |
| Zones      | `ZoneEditor`                        |
| Settings   | `RoomSettings`                      |

## Why we chose the single-page layout

**During a live event, an operator may need any of these sections at any moment.**
A timer is overrunning — they want to push a message overlay (Controls), then check the
next session's title (Runsheet), then maybe adjust a zone threshold for the next entry
(Zones), then bump the default handover gap (Settings). Tabs make all of that one click
away, but they also hide context — the operator can't see the current countdown while
they're on the Zones tab. A scrolling page keeps the whole room visible, just slightly
further down.

The tradeoff favours density and visual feedback over screen real estate.

## When to revisit

Revisit the tabbed layout if **any of these** become true:

- A typical operator rarely uses more than one section per session, and the scroll
  distance becomes annoying.
- A future addition (e.g. analytics, attendee list, sponsor rotator) bloats the page
  enough that even reasonable monitors require multiple scroll jumps to reach the
  controls.
- User testing shows operators losing their place when scrolling during a live event.

If we do switch, prefer a sticky `RoomControls` block above the tab strip — that way the
operator always sees the timer regardless of which configuration tab is active. That
sidesteps the main argument against tabs.
