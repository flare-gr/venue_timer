# Backend Change Request: `set_duration` should update `paused_remaining` when paused

## Summary

Extend the `set_duration` action so that calling it on a paused timer adjusts
the frozen remaining time, not just the total `duration` field.

---

## Current behaviour

`POST /api/timers/{id}/set_duration/` — relevant excerpt from `timer/views/timer.py`:

```python
timer.duration = duration
if timer.state == STATE_RUNNING:
    timer.end_time = timezone.now() + timedelta(seconds=duration)
timer.save()
```

When the timer is **paused**:
- `timer.duration` is updated ✓
- `timer.paused_remaining` is left unchanged ✗
- `timer.end_time` stays `None` ✓

The frontend displays the remaining time from `paused_remaining` (milliseconds),
so the operator sees no change after calling `set_duration` on a paused timer.

---

## Required behaviour

When `timer.state == STATE_PAUSED`, also update `paused_remaining`:

```python
timer.duration = duration
if timer.state == STATE_RUNNING:
    timer.end_time = timezone.now() + timedelta(seconds=duration)
elif timer.state == STATE_PAUSED:
    timer.paused_remaining = duration * 1000   # paused_remaining is stored in ms
timer.save()
```

The broadcast call and response serialisation require no changes — the updated
`paused_remaining` will be included in the `timer_state` WebSocket push automatically.

---

## Why

The admin panel exposes two controls that are useful while paused:

1. **Quick adjust** — `−5 s / −3 s / +3 s / +5 s` buttons that shift the
   remaining time by a fixed delta.
2. **Time override** — a `MM:SS` input that sets an exact remaining time
   (e.g. type `"05:34"` to jump to 5 minutes 34 seconds).

Both call `set_duration` with the new target seconds. They work correctly
while running today. Extending the paused branch makes them work identically
while paused, with no new endpoint or protocol change required.

---

## Validation

No change to validation is needed. The existing guard
(`duration` must be a positive integer) applies equally to the paused branch.
A value of `0` or negative is already rejected with `HTTP 400`.

---

## Affected files

| File | Change |
|---|---|
| `timer/views/timer.py` | Add `elif timer.state == STATE_PAUSED` branch inside `set_duration` |

No migration, no serialiser change, no URL change.
