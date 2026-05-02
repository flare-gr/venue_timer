import { useState } from 'react'
import { useApi } from '../../services/api'
import type { TimerCreatePayload } from '../../services/api'
import { Toggle } from '../ui/Toggle'

interface CreateTimerFormProps {
  onCreated: () => void
}

const DEFAULTS: TimerCreatePayload = {
  name: '',
  duration: 300,
  accent_color: '#00C8FF',
  font_size: 'medium',
  show_clock: true,
}

export function CreateTimerForm({ onCreated }: CreateTimerFormProps) {
  const api = useApi()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<TimerCreatePayload>(DEFAULTS)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function update<K extends keyof TimerCreatePayload>(key: K, value: TimerCreatePayload[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setLoading(true)
    setError(null)
    try {
      await api.timer.create({ ...form, name: form.name.trim() })
      setForm(DEFAULTS)
      setOpen(false)
      onCreated()
    } catch {
      setError('Failed to create timer.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-lg border border-cue-border bg-cue-surface shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-5 py-3.5 text-left hover:bg-cue-base/50 transition-colors duration-[120ms]"
      >
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-6 w-6 items-center justify-center rounded border border-cue-border font-mono text-sm font-bold text-cue-accent"
          >
            +
          </span>
          <span className="font-mono text-sm font-semibold tracking-widest text-cue-muted uppercase">
            New Timer
          </span>
        </div>
        <span
          className="font-mono text-xs text-cue-muted transition-transform duration-[150ms]"
          style={{ display: 'inline-block', transform: open ? 'rotate(180deg)' : 'none' }}
        >
          ▾
        </span>
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="border-t border-cue-border px-5 py-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block font-mono text-xs font-medium tracking-widest text-cue-muted uppercase">
                Name <span className="text-[#FF2040]">*</span>
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="e.g. Main Stage"
                className="w-full rounded border border-cue-border bg-cue-base px-3 py-2 font-mono text-sm text-cue-primary placeholder:text-cue-muted/50 focus:border-cue-accent focus:outline-none transition-colors duration-[120ms]"
              />
            </div>

            <div>
              <label className="mb-1 block font-mono text-xs font-medium tracking-widest text-cue-muted uppercase">
                Duration (sec) <span className="text-[#FF2040]">*</span>
              </label>
              <input
                type="number"
                min="1"
                required
                value={form.duration}
                onChange={(e) => update('duration', parseInt(e.target.value, 10) || 1)}
                className="w-full rounded border border-cue-border bg-cue-base px-3 py-2 font-mono text-sm text-cue-primary focus:border-cue-accent focus:outline-none transition-colors duration-[120ms]"
              />
            </div>

            <div>
              <label className="mb-1 block font-mono text-xs font-medium tracking-widest text-cue-muted uppercase">
                Font Size
              </label>
              <select
                value={form.font_size}
                onChange={(e) => update('font_size', e.target.value as TimerCreatePayload['font_size'])}
                className="w-full rounded border border-cue-border bg-cue-base px-3 py-2 font-mono text-sm text-cue-primary focus:border-cue-accent focus:outline-none transition-colors duration-[120ms]"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block font-mono text-xs font-medium tracking-widest text-cue-muted uppercase">
                Accent Colour
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.accent_color}
                  onChange={(e) => update('accent_color', e.target.value)}
                  className="h-9 w-16 cursor-pointer rounded border border-cue-border bg-cue-base p-0.5"
                />
                <span className="font-mono text-xs text-cue-muted">{form.accent_color}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Toggle
                checked={form.show_clock ?? true}
                onChange={(v) => update('show_clock', v)}
                label="Show wall clock"
              />
              <span className="font-mono text-xs text-cue-muted">Show wall clock</span>
            </div>
          </div>

          {error && (
            <p className="mt-3 font-mono text-xs text-[#FF2040]">{error}</p>
          )}

          <div className="mt-4 flex items-center gap-3">
            <button
              type="submit"
              disabled={loading || !form.name.trim()}
              className="rounded bg-cue-accent px-5 py-2 font-display text-sm tracking-widest text-white hover:bg-[#0044AA] disabled:opacity-50 transition-colors duration-[120ms]"
            >
              {loading ? 'CREATING…' : 'CREATE TIMER'}
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); setForm(DEFAULTS); setError(null) }}
              className="font-mono text-xs text-cue-muted hover:text-cue-primary transition-colors duration-[120ms]"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
