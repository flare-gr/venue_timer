import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApi, BP_ROLES } from '../../services/api'
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
  debateEnabled?: boolean
  onSaved: (timer: Timer) => void
  onCancel: () => void
}

interface FormState {
  name: string
  session_title: string
  speaker_name: string
  duration: number
  handover_seconds: number | null
  role: string
  poi_enabled: boolean | null
  protected_open_seconds: number | null
  protected_close_seconds: number | null
  grace_seconds: number | null
}

function initialState(initial?: Timer): FormState {
  if (initial) {
    return {
      name: initial.name,
      session_title: initial.session_title,
      speaker_name: initial.speaker_name,
      duration: initial.duration,
      handover_seconds: initial.handover_seconds,
      role: initial.role,
      poi_enabled: initial.poi_enabled,
      protected_open_seconds: initial.protected_open_seconds,
      protected_close_seconds: initial.protected_close_seconds,
      grace_seconds: initial.grace_seconds,
    }
  }
  return {
    name: '',
    session_title: '',
    speaker_name: '',
    duration: 300,
    handover_seconds: null,
    role: '',
    poi_enabled: null,
    protected_open_seconds: null,
    protected_close_seconds: null,
    grace_seconds: null,
  }
}

// Tri-state POI override <-> select value
function poiToSelect(value: boolean | null): string {
  if (value === null) return ''
  return value ? 'true' : 'false'
}
function selectToPoi(value: string): boolean | null {
  if (value === '') return null
  return value === 'true'
}

function nullableSecs(raw: string): number | null {
  return raw === '' ? null : Math.max(0, parseInt(raw, 10) || 0)
}

export function TimerForm({ roomId, initial, debateEnabled = false, onSaved, onCancel }: TimerFormProps) {
  const { t } = useTranslation(['admin', 'common'])
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
      setError(t('timerForm.durationError'))
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
        if (debateEnabled) {
          payload.role = form.role
          payload.poi_enabled = form.poi_enabled
          payload.protected_open_seconds = form.protected_open_seconds
          payload.protected_close_seconds = form.protected_close_seconds
          payload.grace_seconds = form.grace_seconds
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
        if (debateEnabled) {
          payload.role = form.role || undefined
          payload.poi_enabled = form.poi_enabled
          payload.protected_open_seconds = form.protected_open_seconds
          payload.protected_close_seconds = form.protected_close_seconds
          payload.grace_seconds = form.grace_seconds
        }
        const created = await api.timers.create(roomId, payload)
        onSaved(created)
      }
    } catch {
      setError(editing ? t('timerForm.saveError') : t('timerForm.addError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded border border-cue-border bg-cue-base/40 p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block font-mono text-xs font-medium tracking-widest text-cue-muted uppercase">
            {t('timerForm.internalName')} <span className="text-[#FF2040]">*</span>
          </label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder={t('timerForm.internalNamePlaceholder')}
            className="w-full rounded border border-cue-border bg-cue-surface px-3 py-2 font-mono text-sm text-cue-primary placeholder:text-cue-muted/50 focus:border-cue-accent focus:outline-none transition-colors duration-[120ms]"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block font-mono text-xs font-medium tracking-widest text-cue-muted uppercase">
            {t('timerForm.sessionTitle')} <span className="text-cue-muted/50">{t('timerForm.public')}</span>
          </label>
          <input
            type="text"
            value={form.session_title}
            onChange={(e) => update('session_title', e.target.value)}
            placeholder={t('timerForm.sessionTitlePlaceholder')}
            className="w-full rounded border border-cue-border bg-cue-surface px-3 py-2 font-mono text-sm text-cue-primary placeholder:text-cue-muted/50 focus:border-cue-accent focus:outline-none transition-colors duration-[120ms]"
          />
        </div>

        <div>
          <label className="mb-1 block font-mono text-xs font-medium tracking-widest text-cue-muted uppercase">
            {t('timerForm.speaker')}
          </label>
          <input
            type="text"
            value={form.speaker_name}
            onChange={(e) => update('speaker_name', e.target.value)}
            placeholder={t('timerForm.speakerPlaceholder')}
            className="w-full rounded border border-cue-border bg-cue-surface px-3 py-2 font-mono text-sm text-cue-primary placeholder:text-cue-muted/50 focus:border-cue-accent focus:outline-none transition-colors duration-[120ms]"
          />
        </div>

        <div>
          <label className="mb-1 block font-mono text-xs font-medium tracking-widest text-cue-muted uppercase">
            {t('timerForm.duration')} <span className="text-[#FF2040]">*</span>
          </label>
          <input
            type="text"
            inputMode="numeric"
            required
            value={durationInput}
            onChange={(e) => onDurationChange(e.target.value)}
            onBlur={onDurationBlur}
            placeholder={t('timerForm.durationPlaceholder')}
            className="w-full rounded border border-cue-border bg-cue-surface px-3 py-2 font-mono text-sm text-cue-primary focus:border-cue-accent focus:outline-none transition-colors duration-[120ms]"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block font-mono text-xs font-medium tracking-widest text-cue-muted uppercase">
            {t('timerForm.handoverBefore')}
            <span className="ml-2 text-cue-muted/50 normal-case">{t('timerForm.handoverBeforeHint')}</span>
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
            placeholder={t('timerForm.roomDefaultPlaceholder')}
            className="w-full rounded border border-cue-border bg-cue-surface px-3 py-2 font-mono text-sm text-cue-primary placeholder:text-cue-muted/50 focus:border-cue-accent focus:outline-none transition-colors duration-[120ms]"
          />
        </div>

        {debateEnabled && (
          <>
            <div className="sm:col-span-2 mt-1 border-t border-cue-border pt-3">
              <span className="font-mono text-[10px] font-semibold tracking-widest text-cue-accent uppercase">
                {t('timerForm.debateSpeech')}
              </span>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block font-mono text-xs font-medium tracking-widest text-cue-muted uppercase">
                {t('timerForm.role')} <span className="text-cue-muted/50 normal-case">{t('timerForm.roleHint')}</span>
              </label>
              <input
                type="text"
                list="bp-roles"
                value={form.role}
                onChange={(e) => update('role', e.target.value)}
                placeholder={t('timerForm.rolePlaceholder')}
                className="w-full rounded border border-cue-border bg-cue-surface px-3 py-2 font-mono text-sm text-cue-primary placeholder:text-cue-muted/50 focus:border-cue-accent focus:outline-none transition-colors duration-[120ms]"
              />
              <datalist id="bp-roles">
                {BP_ROLES.map((r) => (
                  <option key={r} value={r} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="mb-1 block font-mono text-xs font-medium tracking-widest text-cue-muted uppercase">
                {t('timerForm.poisForSpeech')}
              </label>
              <select
                value={poiToSelect(form.poi_enabled)}
                onChange={(e) => update('poi_enabled', selectToPoi(e.target.value))}
                className="w-full rounded border border-cue-border bg-cue-surface px-3 py-2 font-mono text-sm text-cue-primary focus:border-cue-accent focus:outline-none transition-colors duration-[120ms]"
              >
                <option value="">{t('timerForm.poiRoomDefault')}</option>
                <option value="true">{t('timerForm.poiAllowed')}</option>
                <option value="false">{t('timerForm.poiDisabled')}</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block font-mono text-xs font-medium tracking-widest text-cue-muted uppercase">
                {t('timerForm.grace')}
              </label>
              <input
                type="number"
                min="0"
                value={form.grace_seconds ?? ''}
                onChange={(e) => update('grace_seconds', nullableSecs(e.target.value))}
                placeholder={t('timerForm.roomDefaultPlaceholder')}
                className="w-full rounded border border-cue-border bg-cue-surface px-3 py-2 font-mono text-sm text-cue-primary placeholder:text-cue-muted/50 focus:border-cue-accent focus:outline-none transition-colors duration-[120ms]"
              />
            </div>

            <div>
              <label className="mb-1 block font-mono text-xs font-medium tracking-widest text-cue-muted uppercase">
                {t('timerForm.protectedOpen')}
              </label>
              <input
                type="number"
                min="0"
                value={form.protected_open_seconds ?? ''}
                onChange={(e) => update('protected_open_seconds', nullableSecs(e.target.value))}
                placeholder={t('timerForm.roomDefaultPlaceholder')}
                className="w-full rounded border border-cue-border bg-cue-surface px-3 py-2 font-mono text-sm text-cue-primary placeholder:text-cue-muted/50 focus:border-cue-accent focus:outline-none transition-colors duration-[120ms]"
              />
            </div>

            <div>
              <label className="mb-1 block font-mono text-xs font-medium tracking-widest text-cue-muted uppercase">
                {t('timerForm.protectedClose')}
              </label>
              <input
                type="number"
                min="0"
                value={form.protected_close_seconds ?? ''}
                onChange={(e) => update('protected_close_seconds', nullableSecs(e.target.value))}
                placeholder={t('timerForm.roomDefaultPlaceholder')}
                className="w-full rounded border border-cue-border bg-cue-surface px-3 py-2 font-mono text-sm text-cue-primary placeholder:text-cue-muted/50 focus:border-cue-accent focus:outline-none transition-colors duration-[120ms]"
              />
            </div>
          </>
        )}
      </div>

      {error && <p className="font-mono text-xs text-[#FF2040]">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading || !form.name.trim()}
          className="rounded bg-cue-accent px-4 py-1.5 font-display text-sm tracking-widest text-white hover:bg-[#0044AA] disabled:opacity-50 transition-colors duration-[120ms]"
        >
          {loading ? t('timerForm.saving') : editing ? t('timerForm.save') : t('timerForm.addTimer')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="font-mono text-xs text-cue-muted hover:text-cue-primary transition-colors duration-[120ms]"
        >
          {t('common:cancel')}
        </button>
      </div>
    </form>
  )
}
