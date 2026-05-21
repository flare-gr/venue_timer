import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useApi } from '../../services/api'
import type { RoomCreatePayload, RoomMode } from '../../services/api'
import { Toggle } from '../ui/Toggle'

interface CreateRoomFormProps {
  onCreated: () => void
}

const DEFAULTS: RoomCreatePayload = {
  name: '',
  mode: 'simple',
  accent_color: '#00C8FF',
  font_size: 'medium',
  show_clock: true,
  auto_advance: false,
  handover_seconds: 0,
}

export function CreateRoomForm({ onCreated }: CreateRoomFormProps) {
  const api = useApi()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<RoomCreatePayload>(DEFAULTS)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function update<K extends keyof RoomCreatePayload>(key: K, value: RoomCreatePayload[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setLoading(true)
    setError(null)
    try {
      const room = await api.rooms.create({ ...form, name: form.name.trim() })
      setForm(DEFAULTS)
      setOpen(false)
      onCreated()
      void navigate({ to: '/admin/rooms/$roomId', params: { roomId: String(room.id) } })
    } catch {
      setError('Failed to create room.')
    } finally {
      setLoading(false)
    }
  }

  const isSchedule = form.mode === 'schedule'

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
            New Room
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
                placeholder="e.g. Main Hall"
                className="w-full rounded border border-cue-border bg-cue-base px-3 py-2 font-mono text-sm text-cue-primary placeholder:text-cue-muted/50 focus:border-cue-accent focus:outline-none transition-colors duration-[120ms]"
              />
            </div>

            <div>
              <label className="mb-1 block font-mono text-xs font-medium tracking-widest text-cue-muted uppercase">
                Mode
              </label>
              <select
                value={form.mode}
                onChange={(e) => update('mode', e.target.value as RoomMode)}
                className="w-full rounded border border-cue-border bg-cue-base px-3 py-2 font-mono text-sm text-cue-primary focus:border-cue-accent focus:outline-none transition-colors duration-[120ms]"
              >
                <option value="simple">Simple (single ad-hoc timer)</option>
                <option value="schedule">Schedule (runsheet of timers)</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block font-mono text-xs font-medium tracking-widest text-cue-muted uppercase">
                Font Size
              </label>
              <select
                value={form.font_size}
                onChange={(e) => update('font_size', e.target.value as RoomCreatePayload['font_size'])}
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

            {isSchedule && (
              <>
                <div>
                  <label className="mb-1 block font-mono text-xs font-medium tracking-widest text-cue-muted uppercase">
                    Default Handover (sec)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.handover_seconds ?? 0}
                    onChange={(e) => update('handover_seconds', parseInt(e.target.value, 10) || 0)}
                    className="w-full rounded border border-cue-border bg-cue-base px-3 py-2 font-mono text-sm text-cue-primary focus:border-cue-accent focus:outline-none transition-colors duration-[120ms]"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <Toggle
                    checked={form.auto_advance ?? false}
                    onChange={(v) => update('auto_advance', v)}
                    label="Auto-advance"
                  />
                  <span className="font-mono text-xs text-cue-muted">Auto-advance runsheet</span>
                </div>
              </>
            )}
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
              {loading ? 'CREATING…' : 'CREATE ROOM'}
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
