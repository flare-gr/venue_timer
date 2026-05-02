import { useState } from 'react'
import type { Timer } from '../../services/api'
import { useApi } from '../../services/api'
import { useTimerSocket } from '../../hooks/useTimerSocket'
import { useCountdown } from '../../hooks/useCountdown'
import { StateBadge } from './StateBadge'
import { Toggle } from '../ui/Toggle'

interface TimerCardProps {
  initialTimer: Timer
  onDeleted: () => void
  onMutated: () => void
  style?: React.CSSProperties
}

function parseTimeInput(raw: string): number | null {
  const parts = raw.trim().split(':')
  if (parts.length === 2) {
    const [m, s] = parts.map(Number)
    if (!isFinite(m) || !isFinite(s) || s < 0 || s >= 60 || m < 0) return null
    return m * 60 + s
  }
  if (parts.length === 3) {
    const [h, m, s] = parts.map(Number)
    if (!isFinite(h) || !isFinite(m) || !isFinite(s) || s < 0 || s >= 60 || m < 0 || m >= 60 || h < 0) return null
    return h * 3600 + m * 60 + s
  }
  const n = parseInt(raw.trim(), 10)
  return isFinite(n) && n > 0 ? n : null
}

const STATE_STRIP: Record<Timer['state'], string> = {
  idle:     '#B8CCE4',
  running:  '#00F078',
  paused:   '#FFAA00',
  overtime: '#FF2040',
}

const WS_DOT: Record<'connecting' | 'connected' | 'disconnected', string> = {
  connected:    '#00F078',
  connecting:   '#FFAA00',
  disconnected: '#FF2040',
}

export function TimerCard({ initialTimer, onDeleted, onMutated, style }: TimerCardProps) {
  const api = useApi()
  const [timer, setTimer] = useState<Timer>(initialTimer)
  const [durationInput, setDurationInput] = useState(String(initialTimer.duration))
  const [messageText, setMessageText] = useState(initialTimer.message_text)
  const [emergencyText, setEmergencyText] = useState(initialTimer.emergency_text)
  const [overrideInput, setOverrideInput] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [acting, setActing] = useState(false)

  const { status, skewRef } = useTimerSocket(timer.id, (updated) => {
    setTimer(updated)
    setMessageText(updated.message_text)
    setEmergencyText(updated.emergency_text)
  })

  const { display, isOvertime } = useCountdown(timer, skewRef)

  const digitColor =
    isOvertime                  ? '#FF2040'
    : timer.state === 'paused'  ? '#FFAA00'
    : timer.state === 'running' ? 'var(--color-cue-primary)'
    :                             'var(--color-cue-muted)'

  async function act(fn: () => Promise<Timer>) {
    setActing(true)
    try {
      const updated = await fn()
      setTimer(updated)
      onMutated()
    } finally {
      setActing(false)
    }
  }

  async function handleStart()  { await act(() => api.timer.start(timer.id)) }
  async function handlePause()  { await act(() => api.timer.pause(timer.id)) }
  async function handleResume() { await act(() => api.timer.resume(timer.id)) }
  async function handleReset()  { await act(() => api.timer.reset(timer.id)) }

  function getRemainingSeconds(): number {
    if (timer.state === 'paused' && timer.paused_remaining !== null) {
      return Math.max(1, Math.ceil(timer.paused_remaining / 1000))
    }
    if (!timer.end_time) return timer.duration
    const ms = new Date(timer.end_time).getTime() - (Date.now() + skewRef.current)
    return Math.max(1, Math.ceil(ms / 1000))
  }

  async function handleAdjust(deltaSecs: number) {
    const newSecs = Math.max(1, getRemainingSeconds() + deltaSecs)
    await act(() => api.timer.setDuration(timer.id, { duration: newSecs }))
  }

  async function handleOverride(e: React.FormEvent) {
    e.preventDefault()
    const secs = parseTimeInput(overrideInput)
    if (secs === null) return
    await act(() => api.timer.setDuration(timer.id, { duration: secs }))
    setOverrideInput('')
  }

  async function handleSetDuration() {
    const secs = parseInt(durationInput, 10)
    if (!secs || secs < 1) return
    await act(() => api.timer.setDuration(timer.id, { duration: secs }))
  }

  async function handleMessageToggle(active: boolean) {
    const updated = await api.timer.message(timer.id, { text: messageText, active })
    setTimer(updated)
    onMutated()
  }

  async function handleMessageBlur() {
    if (messageText === timer.message_text) return
    const updated = await api.timer.message(timer.id, { text: messageText, active: timer.message_active })
    setTimer(updated)
    onMutated()
  }

  async function handleEmergencyToggle(active: boolean) {
    const updated = await api.timer.emergency(timer.id, { text: emergencyText, active })
    setTimer(updated)
    onMutated()
  }

  async function handleEmergencyBlur() {
    if (emergencyText === timer.emergency_text) return
    const updated = await api.timer.emergency(timer.id, { text: emergencyText, active: timer.emergency_active })
    setTimer(updated)
    onMutated()
  }

  async function handleDelete() {
    await api.timer.delete(timer.id)
    onDeleted()
  }

  const wsDotColor = WS_DOT[status]
  const stripColor = STATE_STRIP[timer.state]

  return (
    <div
      className="relative rounded-lg border border-cue-border bg-cue-surface shadow-sm overflow-hidden animate-card-in"
      style={style}
    >
      {/* Left state strip */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px] transition-colors duration-[300ms]"
        style={{ backgroundColor: stripColor }}
      />

      <div className="pl-4 p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1.5 min-w-0">
            <span
              className="font-display text-xl leading-none tracking-wide text-cue-primary truncate"
              title={timer.name}
            >
              {timer.name}
            </span>
            <StateBadge state={timer.state} />
          </div>
          <span
            className="mt-1 h-2 w-2 rounded-full shrink-0"
            title={`WebSocket: ${status}`}
            style={{ backgroundColor: wsDotColor, boxShadow: `0 0 6px ${wsDotColor}` }}
          />
        </div>

        {/* Countdown digits */}
        <div className="py-1 text-center">
          <span
            className="font-mono text-5xl font-semibold tabular-nums leading-none tracking-tight"
            style={{ color: digitColor }}
          >
            {display}
          </span>
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          {timer.state === 'idle' && (
            <button
              onClick={handleStart}
              disabled={acting}
              className="flex-1 rounded bg-cue-accent px-3 py-2 font-display text-sm tracking-widest text-white hover:bg-[#0044AA] disabled:opacity-50 transition-colors duration-[120ms]"
            >
              START
            </button>
          )}
          {(timer.state === 'running' || timer.state === 'overtime') && (
            <button
              onClick={handlePause}
              disabled={acting}
              className="flex-1 rounded border border-[#FFAA00] px-3 py-2 font-display text-sm tracking-widest text-[#FFAA00] hover:bg-[#FFAA00]/10 disabled:opacity-50 transition-colors duration-[120ms]"
            >
              PAUSE
            </button>
          )}
          {timer.state === 'paused' && (
            <button
              onClick={handleResume}
              disabled={acting}
              className="flex-1 rounded bg-cue-accent px-3 py-2 font-display text-sm tracking-widest text-white hover:bg-[#0044AA] disabled:opacity-50 transition-colors duration-[120ms]"
            >
              RESUME
            </button>
          )}
          {timer.state !== 'idle' && (
            <button
              onClick={handleReset}
              disabled={acting}
              className="rounded border border-cue-border px-3 py-2 font-display text-sm tracking-widest text-cue-muted hover:border-cue-primary hover:text-cue-primary disabled:opacity-50 transition-colors duration-[120ms]"
            >
              RESET
            </button>
          )}
        </div>

        {/* Running/paused: quick adjust + time override */}
        {(timer.state === 'running' || timer.state === 'paused') && (
          <div className="rounded border border-cue-border bg-cue-base/50 p-3 space-y-2.5">
            {/* Quick adjust */}
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[10px] font-semibold tracking-widest text-cue-muted uppercase mr-1">
                Adjust
              </span>
              {([-5, -3, 3, 5] as const).map((delta) => (
                <button
                  key={delta}
                  type="button"
                  onClick={() => handleAdjust(delta)}
                  disabled={acting}
                  className={[
                    'rounded border px-2 py-1 font-mono text-xs tabular-nums',
                    'disabled:opacity-50 transition-colors duration-[120ms]',
                    delta < 0
                      ? 'border-[#FF2040]/40 text-[#FF2040]/70 hover:border-[#FF2040] hover:text-[#FF2040]'
                      : 'border-[#00F078]/40 text-[#00F078]/70 hover:border-[#00F078] hover:text-[#00F078]',
                  ].join(' ')}
                >
                  {delta > 0 ? '+' : ''}{delta}s
                </button>
              ))}
            </div>

            {/* Time override */}
            <form onSubmit={handleOverride} className="flex items-center gap-2">
              <span className="font-mono text-[10px] font-semibold tracking-widest text-cue-muted uppercase whitespace-nowrap">
                Override
              </span>
              <input
                type="text"
                value={overrideInput}
                onChange={(e) => setOverrideInput(e.target.value)}
                placeholder="MM:SS"
                className="w-20 rounded border border-cue-border bg-cue-surface px-2 py-1 font-mono text-sm text-cue-primary placeholder:text-cue-muted/40 focus:border-cue-accent focus:outline-none transition-colors duration-[120ms]"
              />
              <button
                type="submit"
                disabled={acting || !overrideInput.trim()}
                className="rounded border border-cue-border px-2 py-1 font-mono text-xs text-cue-muted hover:border-cue-accent hover:text-cue-accent disabled:opacity-50 transition-colors duration-[120ms]"
              >
                SET
              </button>
            </form>
          </div>
        )}

        {/* Duration adjuster */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] font-semibold tracking-widest text-cue-muted uppercase whitespace-nowrap">
            Duration
          </span>
          <input
            type="number"
            min="1"
            value={durationInput}
            onChange={(e) => setDurationInput(e.target.value)}
            className="w-20 rounded border border-cue-border bg-cue-base px-2 py-1 font-mono text-sm text-cue-primary focus:border-cue-accent focus:outline-none transition-colors duration-[120ms]"
          />
          <span className="font-mono text-[10px] text-cue-muted">sec</span>
          <button
            onClick={handleSetDuration}
            disabled={acting}
            className="rounded border border-cue-border px-2 py-1 font-mono text-xs text-cue-muted hover:border-cue-accent hover:text-cue-accent disabled:opacity-50 transition-colors duration-[120ms]"
          >
            SET
          </button>
        </div>

        <div className="space-y-2">
          {/* Message overlay */}
          <div className="rounded border border-cue-border bg-cue-base/50 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-[10px] font-semibold tracking-widest text-cue-muted uppercase">
                Message Overlay
              </span>
              <Toggle
                checked={timer.message_active}
                onChange={handleMessageToggle}
                label="Toggle message overlay"
              />
            </div>
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onBlur={handleMessageBlur}
              placeholder="Enter message…"
              className="w-full rounded border border-cue-border bg-cue-surface px-2 py-1.5 font-mono text-sm text-cue-primary placeholder:text-cue-muted/50 focus:border-cue-accent focus:outline-none transition-colors duration-[120ms]"
            />
          </div>

          {/* Emergency overlay */}
          <div className="rounded border border-[#FF2040]/30 bg-[#FF2040]/[0.03] p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-[10px] font-semibold tracking-widest text-[#FF2040]/60 uppercase">
                Emergency
              </span>
              <Toggle
                checked={timer.emergency_active}
                onChange={handleEmergencyToggle}
                label="Toggle emergency overlay"
              />
            </div>
            <input
              type="text"
              value={emergencyText}
              onChange={(e) => setEmergencyText(e.target.value)}
              onBlur={handleEmergencyBlur}
              placeholder="Emergency message…"
              className="w-full rounded border border-[#FF2040]/30 bg-cue-surface px-2 py-1.5 font-mono text-sm text-cue-primary placeholder:text-[#FF2040]/40 focus:border-[#FF2040] focus:outline-none transition-colors duration-[120ms]"
            />
          </div>
        </div>

        {/* Delete */}
        <div className="flex justify-end border-t border-cue-border pt-3">
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-cue-muted">Delete this timer?</span>
              <button
                onClick={handleDelete}
                className="rounded border border-[#FF2040] px-2 py-1 font-mono text-xs text-[#FF2040] hover:bg-[#FF2040]/10 transition-colors duration-[120ms]"
              >
                Confirm
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="rounded border border-cue-border px-2 py-1 font-mono text-xs text-cue-muted hover:border-cue-primary hover:text-cue-primary transition-colors duration-[120ms]"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="font-mono text-xs text-cue-muted hover:text-[#FF2040] transition-colors duration-[120ms]"
            >
              Delete timer
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
