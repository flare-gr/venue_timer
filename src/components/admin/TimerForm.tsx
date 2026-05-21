import { useState } from 'react'
import { useApi } from '../../services/api'
import type {
  Timer,
  TimerCreatePayload,
  TimerUpdatePayload,
} from '../../services/api'

function formatMMSS(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds))
  const m = Math.floor(safe / 60)
  const s = safe % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

// Accepts "M:SS", "MM:SS", "H:MM:SS", or plain seconds ("300"). Returns null if invalid.
function parseMMSS(raw: string): number | null {
  const input = raw.trim()
  if (input === '') return null
  if (!/^\d+(:\d{1,2}){0,2}$/.test(input)) return null
  const parts = input.split(':').map((p) => parseInt(p, 10))
  if (parts.some((n) => !isFinite(n))) return null
  let total = 0
  if (parts.length === 1) total = parts[0]
  else if (parts.length === 2) total = parts[0] * 60 + parts[1]
  else total = parts[0] * 3600 + parts[1] * 60 + parts[2]
  return total
}

interface TimerFormProps {
  roomId: number
  initial?: Timer
  onSaved: (timer: Timer) => void
  onCancel: () => void
}

interface FormState {
  name: string
  session_title: string
  speaker_name: string
  duration: number
  handover_seconds: number | null
}

function initialState(initial?: Timer): FormState {
  if (initial) {
    return {
      name: initial.name,
      session_title: initial.session_title,
      speaker_name: initial.speaker_name,
      duration: initial.duration,
      handover_seconds: initial.handover_seconds,
    }
  }
  return {
    name: '',
    session_title: '',
    speaker_name: '',
    duration: 300,
    handover_seconds: null,
  }
}

export function TimerForm({ roomId, initial, onSaved, onCancel }: TimerFormProps) {
  const api = useApi()
  const [form, setForm] = useState<FormState>(() => initialState(initial))
  const [durationInput, setDurationInput] = useState(() => formatMMSS(form.duration))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const editing = initial !== undefined

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function onDurationChange(raw: string) {
    setDurationInput(raw)
    const parsed = parseMMSS(raw)
    if (parsed !== null && parsed > 0) update('duration', parsed)
  }

  function onDurationBlur() {
    const parsed = parseMMSS(durationInput)
    if (parsed === null || parsed <= 0) {
      setDurationInput(formatMMSS(form.duration))
    } else {
      update('duration', parsed)
      setDurationInput(formatMMSS(parsed))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    const parsedDuration = parseMMSS(durationInput)
    if (parsedDuration === null || parsedDuration <= 0) {
      setError('Duration must be a positive time (e.g. 5:00).')
      return
    }
    setLoading(true)
    setError(null)
    try {
      if (editing && initial) {
        const payload: TimerUpdatePayload = {
          name: form.name.trim(),
          session_title: form.session_title,
          speaker_name: form.speaker_name,
          duration: parsedDuration,
          handover_seconds: form.handover_seconds,
        }
        const updated = await api.timers.patch(roomId, initial.id, payload)
        onSaved(updated)
      } else {
        const payload: TimerCreatePayload = {
          name: form.name.trim(),
          session_title: form.session_title || undefined,
          speaker_name: form.speaker_name || undefined,
          duration: parsedDuration,
          handover_seconds: form.handover_seconds,
        }
        const created = await api.timers.create(roomId, payload)
        onSaved(created)
      }
    } catch {
      setError(editing ? 'Failed to save timer.' : 'Failed to add timer.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded border border-cue-border bg-cue-base/40 p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block font-mono text-xs font-medium tracking-widest text-cue-muted uppercase">
            Internal Name <span className="text-[#FF2040]">*</span>
          </label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="e.g. Keynote-1"
            className="w-full rounded border border-cue-border bg-cue-surface px-3 py-2 font-mono text-sm text-cue-primary placeholder:text-cue-muted/50 focus:border-cue-accent focus:outline-none transition-colors duration-[120ms]"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block font-mono text-xs font-medium tracking-widest text-cue-muted uppercase">
            Session Title <span className="text-cue-muted/50">(public)</span>
          </label>
          <input
            type="text"
            value={form.session_title}
            onChange={(e) => update('session_title', e.target.value)}
            placeholder="e.g. Opening Keynote"
            className="w-full rounded border border-cue-border bg-cue-surface px-3 py-2 font-mono text-sm text-cue-primary placeholder:text-cue-muted/50 focus:border-cue-accent focus:outline-none transition-colors duration-[120ms]"
          />
        </div>

        <div>
          <label className="mb-1 block font-mono text-xs font-medium tracking-widest text-cue-muted uppercase">
            Speaker
          </label>
          <input
            type="text"
            value={form.speaker_name}
            onChange={(e) => update('speaker_name', e.target.value)}
            placeholder="Optional"
            className="w-full rounded border border-cue-border bg-cue-surface px-3 py-2 font-mono text-sm text-cue-primary placeholder:text-cue-muted/50 focus:border-cue-accent focus:outline-none transition-colors duration-[120ms]"
          />
        </div>

        <div>
          <label className="mb-1 block font-mono text-xs font-medium tracking-widest text-cue-muted uppercase">
            Duration (MM:SS) <span className="text-[#FF2040]">*</span>
          </label>
          <input
            type="text"
            inputMode="numeric"
            required
            value={durationInput}
            onChange={(e) => onDurationChange(e.target.value)}
            onBlur={onDurationBlur}
            placeholder="5:00"
            className="w-full rounded border border-cue-border bg-cue-surface px-3 py-2 font-mono text-sm text-cue-primary focus:border-cue-accent focus:outline-none transition-colors duration-[120ms]"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block font-mono text-xs font-medium tracking-widest text-cue-muted uppercase">
            Handover before this timer (sec)
            <span className="ml-2 text-cue-muted/50 normal-case">— blank uses the room default</span>
          </label>
          <input
            type="number"
            min="0"
            value={form.handover_seconds ?? ''}
            onChange={(e) =>
              update(
                'handover_seconds',
                e.target.value === '' ? null : Math.max(0, parseInt(e.target.value, 10) || 0),
              )
            }
            placeholder="(room default)"
            className="w-full rounded border border-cue-border bg-cue-surface px-3 py-2 font-mono text-sm text-cue-primary placeholder:text-cue-muted/50 focus:border-cue-accent focus:outline-none transition-colors duration-[120ms]"
          />
        </div>
      </div>

      {error && <p className="font-mono text-xs text-[#FF2040]">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading || !form.name.trim()}
          className="rounded bg-cue-accent px-4 py-1.5 font-display text-sm tracking-widest text-white hover:bg-[#0044AA] disabled:opacity-50 transition-colors duration-[120ms]"
        >
          {loading ? 'SAVING…' : editing ? 'SAVE' : 'ADD TIMER'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="font-mono text-xs text-cue-muted hover:text-cue-primary transition-colors duration-[120ms]"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
