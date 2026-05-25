import { useCallback, useState } from 'react'
import { useApi } from '../../services/api'
import type { Room, RoomUpdatePayload, Timer } from '../../services/api'
import { useRoomSocket } from '../../hooks/useRoomSocket'
import { useCountdown } from '../../hooks/useCountdown'
import { TimerStateBadge, RoomStateBadge } from './StateBadge'
import { Toggle } from '../ui/Toggle'

interface RoomControlsProps {
  initialRoom: Room
  onMutated: () => void
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

const WS_DOT: Record<'connecting' | 'connected' | 'disconnected', string> = {
  connected:    '#00F078',
  connecting:   '#FFAA00',
  disconnected: '#FF2040',
}

export function RoomControls({ initialRoom, onMutated }: RoomControlsProps) {
  const api = useApi()
  const [room, setRoom] = useState<Room>(initialRoom)
  const [nextTimer, setNextTimer] = useState<Timer | null>(null)
  const [messageText, setMessageText] = useState(initialRoom.message_text)
  const [emergencyText, setEmergencyText] = useState(initialRoom.emergency_text)
  const [overrideInput, setOverrideInput] = useState('')
  const [acting, setActing] = useState(false)

  const { status, skewRef } = useRoomSocket(
    room.id,
    ({ room: r, next_timer }) => {
      setRoom(r)
      setNextTimer(next_timer)
      setMessageText(r.message_text)
      setEmergencyText(r.emergency_text)
    },
    { sendAuth: true, role: 'admin' },
  )

  const current = room.timers.find((t) => t.id === room.current_timer) ?? null
  const currentIndex = current ? room.timers.findIndex((t) => t.id === current.id) : -1

  const { display: timerDisplay, isOvertime } = useCountdown(
    current ?? { state: 'idle', duration: 0, end_time: null, paused_remaining: null },
    skewRef,
  )

  const { display: handoverDisplay } = useCountdown(
    {
      state: room.state === 'handover' ? 'running' : 'idle',
      duration: 0,
      end_time: room.handover_end_time,
      paused_remaining: null,
    },
    skewRef,
  )

  const digitColor =
    isOvertime                                 ? '#FF2040'
    : current?.state === 'paused'              ? '#FFAA00'
    : current?.state === 'running'             ? 'var(--color-cue-primary)'
    :                                            'var(--color-cue-muted)'

  async function act(fn: () => Promise<Room | Timer>) {
    setActing(true)
    try {
      const result = await fn()
      if ('timers' in result) {
        setRoom(result)
      }
      onMutated()
    } finally {
      setActing(false)
    }
  }

  async function handleStart()   { if (current) await act(() => api.timers.start(room.id, current.id)) }
  async function handlePause()   { if (current) await act(() => api.timers.pause(room.id, current.id)) }
  async function handleResume()  { if (current) await act(() => api.timers.resume(room.id, current.id)) }
  async function handleReset()   { if (current) await act(() => api.timers.reset(room.id, current.id)) }

  const handleAdjust = useCallback(
    async (deltaSecs: number) => {
      if (!current) return
      setActing(true)
      try {
        await api.timers.adjust(room.id, current.id, { seconds: deltaSecs })
        onMutated()
      } finally {
        setActing(false)
      }
    },
    [api, current, onMutated, room.id],
  )

  async function handleOverride(e: React.FormEvent) {
    e.preventDefault()
    if (!current) return
    const secs = parseTimeInput(overrideInput)
    if (secs === null) return
    await act(() => api.timers.setDuration(room.id, current.id, { duration: secs }))
    setOverrideInput('')
  }

  async function handleAdvance() { await act(() => api.rooms.advance(room.id)) }
  async function handlePrevious() { await act(() => api.rooms.previous(room.id)) }

  async function handleMessageToggle(active: boolean) {
    const updated = await api.rooms.message(room.id, { text: messageText, active })
    setRoom(updated)
    onMutated()
  }
  async function handleMessageBlur() {
    if (messageText === room.message_text) return
    const updated = await api.rooms.message(room.id, { text: messageText, active: room.message_active })
    setRoom(updated)
    onMutated()
  }

  async function handleEmergencyToggle(active: boolean) {
    const updated = await api.rooms.emergency(room.id, { text: emergencyText, active })
    setRoom(updated)
    onMutated()
  }
  async function handleEmergencyBlur() {
    if (emergencyText === room.emergency_text) return
    const updated = await api.rooms.emergency(room.id, { text: emergencyText, active: room.emergency_active })
    setRoom(updated)
    onMutated()
  }

  async function patchRoomField(payload: RoomUpdatePayload) {
    const updated = await api.rooms.patch(room.id, payload)
    setRoom(updated)
    onMutated()
  }

  async function handlePoi(active: boolean) {
    setActing(true)
    try {
      const updated = await api.rooms.poi(room.id, { active })
      setRoom(updated)
      onMutated()
    } finally {
      setActing(false)
    }
  }

  const wsDotColor = WS_DOT[status]
  const isSchedule = room.mode === 'schedule'

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-lg border border-cue-border bg-cue-surface shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-cue-border px-5 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <RoomStateBadge state={room.state} />
            {isSchedule && (
              <span className="font-mono text-xs text-cue-muted">
                {currentIndex >= 0 ? `${currentIndex + 1} / ${room.timers.length}` : `— / ${room.timers.length}`}
              </span>
            )}
            {room.auto_advance && (
              <span className="rounded border border-cue-accent/40 px-2 py-0.5 font-mono text-[10px] font-semibold tracking-widest text-cue-accent uppercase">
                AUTO
              </span>
            )}
          </div>
          <span
            className="h-2 w-2 rounded-full shrink-0"
            title={`WebSocket: ${status}`}
            style={{ backgroundColor: wsDotColor, boxShadow: `0 0 6px ${wsDotColor}` }}
          />
        </div>

        {/* Schedule banners */}
        {room.state === 'handover' && (
          <div className="border-b border-[#FFAA00]/40 bg-[#FFAA00]/5 px-5 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="font-mono text-[10px] tracking-widest text-[#FFAA00] uppercase">
                  Handover — Up Next
                </div>
                <div className="mt-1 font-display text-lg leading-none tracking-wide text-cue-primary truncate">
                  {nextTimer ? (nextTimer.session_title || nextTimer.name) : '—'}
                </div>
                {nextTimer?.speaker_name && (
                  <div className="mt-0.5 font-mono text-xs text-cue-muted truncate">
                    {nextTimer.speaker_name}
                  </div>
                )}
              </div>
              <span className="font-mono text-3xl tabular-nums text-[#FFAA00] shrink-0">
                {handoverDisplay}
              </span>
            </div>
          </div>
        )}

        {room.state === 'complete' && (
          <div className="border-b border-cue-accent/40 bg-cue-accent/5 px-5 py-3">
            <div className="font-mono text-[10px] tracking-widest text-cue-accent uppercase">
              Runsheet Complete
            </div>
            <div className="mt-1 font-display text-base text-cue-primary">
              All sessions have finished.
            </div>
          </div>
        )}

        {/* Current timer block */}
        <div className="px-5 py-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col gap-1.5 min-w-0">
              <span className="font-mono text-[10px] tracking-widest text-cue-muted uppercase">
                {isSchedule ? 'Current Session' : 'Timer'}
              </span>
              <span className="font-display text-xl leading-none tracking-wide text-cue-primary truncate">
                {current ? (current.session_title || current.name) : '— No timer —'}
              </span>
              {current?.speaker_name && (
                <span className="font-mono text-xs text-cue-muted truncate">
                  {current.speaker_name}
                </span>
              )}
            </div>
            {current && <TimerStateBadge state={current.state} />}
          </div>

          {/* Countdown */}
          <div className="py-1 text-center">
            <span
              className="font-mono text-5xl font-semibold tabular-nums leading-none tracking-tight"
              style={{ color: digitColor }}
            >
              {current ? timerDisplay : '—'}
            </span>
          </div>

          {current && (
            <>
              {/* Primary controls */}
              <div className="flex gap-2">
                {current.state === 'idle' && (
                  <button
                    onClick={handleStart}
                    disabled={acting}
                    className="flex-1 rounded bg-cue-accent px-3 py-2 font-display text-sm tracking-widest text-white hover:bg-[#0044AA] disabled:opacity-50 transition-colors duration-[120ms]"
                  >
                    START
                  </button>
                )}
                {(current.state === 'running' || current.state === 'overtime') && (
                  <button
                    onClick={handlePause}
                    disabled={acting}
                    className="flex-1 rounded border border-[#FFAA00] px-3 py-2 font-display text-sm tracking-widest text-[#FFAA00] hover:bg-[#FFAA00]/10 disabled:opacity-50 transition-colors duration-[120ms]"
                  >
                    PAUSE
                  </button>
                )}
                {current.state === 'paused' && (
                  <button
                    onClick={handleResume}
                    disabled={acting}
                    className="flex-1 rounded bg-cue-accent px-3 py-2 font-display text-sm tracking-widest text-white hover:bg-[#0044AA] disabled:opacity-50 transition-colors duration-[120ms]"
                  >
                    RESUME
                  </button>
                )}
                {current.state !== 'idle' && (
                  <button
                    onClick={handleReset}
                    disabled={acting}
                    className="rounded border border-cue-border px-3 py-2 font-display text-sm tracking-widest text-cue-muted hover:border-cue-primary hover:text-cue-primary disabled:opacity-50 transition-colors duration-[120ms]"
                  >
                    RESET
                  </button>
                )}
              </div>

              {/* Debate: POI offered (stops the clock) */}
              {room.debate_enabled &&
                (current.state === 'running' || current.state === 'overtime' || current.state === 'paused') && (
                  <button
                    type="button"
                    onClick={() => handlePoi(!room.poi_offered_active)}
                    disabled={acting}
                    className={[
                      'w-full rounded px-3 py-2 font-display text-sm tracking-widest disabled:opacity-50 transition-colors duration-[120ms]',
                      room.poi_offered_active
                        ? 'bg-[#FFAA00] text-cue-base hover:bg-[#E69900]'
                        : 'border border-[#FFAA00] text-[#FFAA00] hover:bg-[#FFAA00]/10',
                    ].join(' ')}
                  >
                    {room.poi_offered_active ? '● POI LIVE — CLEAR & RESUME' : 'OFFER POI (PAUSE CLOCK)'}
                  </button>
                )}

              {/* Quick adjust + override */}
              {(current.state === 'running' || current.state === 'paused' || current.state === 'overtime') && (
                <div className="rounded border border-cue-border bg-cue-base/50 p-3 space-y-2.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono text-[10px] font-semibold tracking-widest text-cue-muted uppercase mr-1">
                      Adjust
                    </span>
                    {([-30, -10, -5, 5, 10, 30] as const).map((delta) => (
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
            </>
          )}

          {/* Schedule navigation */}
          {isSchedule && (
            <div className="flex items-center gap-2 border-t border-cue-border pt-3">
              <button
                onClick={handlePrevious}
                disabled={acting || currentIndex <= 0}
                className="rounded border border-cue-border px-3 py-1.5 font-display text-xs tracking-widest text-cue-muted hover:border-cue-primary hover:text-cue-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-[120ms]"
              >
                ← PREV
              </button>
              <button
                onClick={handleAdvance}
                disabled={acting || room.state === 'complete' || room.timers.length === 0}
                className="rounded border border-cue-accent px-3 py-1.5 font-display text-xs tracking-widest text-cue-accent hover:bg-cue-accent/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-[120ms]"
              >
                NEXT →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Room-level overlays */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Message overlay */}
        <div className="rounded-lg border border-cue-border bg-cue-surface p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-mono text-[10px] font-semibold tracking-widest text-cue-muted uppercase">
              Message Overlay
            </span>
            <Toggle
              checked={room.message_active}
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
            className="w-full rounded border border-cue-border bg-cue-base px-2 py-1.5 font-mono text-sm text-cue-primary placeholder:text-cue-muted/50 focus:border-cue-accent focus:outline-none transition-colors duration-[120ms]"
          />
        </div>

        {/* Emergency */}
        <div className="rounded-lg border border-[#FF2040]/30 bg-[#FF2040]/[0.03] p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-mono text-[10px] font-semibold tracking-widest text-[#FF2040]/70 uppercase">
              Emergency
            </span>
            <Toggle
              checked={room.emergency_active}
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
            className="w-full rounded border border-[#FF2040]/30 bg-cue-base px-2 py-1.5 font-mono text-sm text-cue-primary placeholder:text-[#FF2040]/40 focus:border-[#FF2040] focus:outline-none transition-colors duration-[120ms]"
          />
        </div>
      </div>

      {/* Display chrome */}
      <div className="rounded-lg border border-cue-border bg-cue-surface p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <span className="font-mono text-[10px] font-semibold tracking-widest text-cue-muted uppercase">
            Display Chrome
          </span>
        </div>

        <div className="mb-3 flex items-center justify-between rounded border border-cue-accent/30 bg-cue-accent/[0.04] px-3 py-2">
          <div className="flex flex-col">
            <span className="font-mono text-xs text-cue-primary">Minimal Mode</span>
            <span className="font-mono text-[10px] text-cue-muted">
              Hides strips and disconnect badge regardless of toggles below.
            </span>
          </div>
          <Toggle
            checked={room.minimal_mode ?? false}
            onChange={(next) => patchRoomField({ minimal_mode: next })}
            label="Toggle minimal mode"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-cue-primary">Show Top Strip</span>
            <Toggle
              checked={room.show_top_strip ?? true}
              onChange={(next) => patchRoomField({ show_top_strip: next })}
              label="Toggle top strip visibility"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-cue-primary">Show Bottom Strip</span>
            <Toggle
              checked={room.show_bottom_strip ?? true}
              onChange={(next) => patchRoomField({ show_bottom_strip: next })}
              label="Toggle bottom strip visibility"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-cue-primary">Show Session Title</span>
            <Toggle
              checked={room.show_session_title ?? true}
              onChange={(next) => patchRoomField({ show_session_title: next })}
              label="Toggle session title visibility"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-cue-primary">Show Speaker Name</span>
            <Toggle
              checked={room.show_speaker_name ?? true}
              onChange={(next) => patchRoomField({ show_speaker_name: next })}
              label="Toggle speaker name visibility"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-cue-primary">Show Disconnect Badge</span>
            <Toggle
              checked={room.show_disconnect_badge ?? true}
              onChange={(next) => patchRoomField({ show_disconnect_badge: next })}
              label="Toggle disconnect badge visibility"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-cue-primary">Show Seconds on Clock</span>
            <Toggle
              checked={room.show_seconds_on_clock ?? true}
              onChange={(next) => patchRoomField({ show_seconds_on_clock: next })}
              label="Toggle seconds on wall clock"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
