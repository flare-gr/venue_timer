import { useState, useEffect, useRef } from 'react'
import type { Room, Timer, Zone } from '../../services/api'
import { useRoomSocket } from '../../hooks/useRoomSocket'
import { useCountdown } from '../../hooks/useCountdown'

function getActiveZone(remainingMs: number, zones: Zone[]): Zone | null {
  const secs = remainingMs / 1000
  const sorted = [...zones].sort((a, b) => a.threshold - b.threshold)
  return sorted.find((z) => secs <= z.threshold) ?? null
}

function isSmallestZone(zone: Zone, zones: Zone[]): boolean {
  const sorted = [...zones].sort((a, b) => a.threshold - b.threshold)
  return sorted.length > 0 && sorted[0].id === zone.id
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  if (h > 0) return `${h}:${mm}:${ss}`
  return `${mm}:${ss}`
}

function WarningIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ height: '12vh', color: 'white', opacity: 0.9 }}
      className="animate-emergency-text"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

function useWallClock(enabled: boolean): string {
  const [clock, setClock] = useState('')
  const rafRef = useRef<number>(0)
  useEffect(() => {
    if (!enabled) return
    const tick = () => {
      const now = new Date()
      const h = String(now.getHours()).padStart(2, '0')
      const m = String(now.getMinutes()).padStart(2, '0')
      const s = String(now.getSeconds()).padStart(2, '0')
      setClock(`${h}:${m}:${s}`)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [enabled])
  return clock
}

interface TimerDisplayProps {
  roomId: number
}

export function TimerDisplay({ roomId }: TimerDisplayProps) {
  const [room, setRoom] = useState<Room | null>(null)
  const [nextTimer, setNextTimer] = useState<Timer | null>(null)

  const { status, skewRef, notFound } = useRoomSocket(
    roomId,
    ({ room: r, next_timer }) => {
      setRoom(r)
      setNextTimer(next_timer)
    },
    { role: 'display' },
  )

  const current = room?.timers.find((t) => t.id === room.current_timer) ?? null

  const { display: timerDisplay, isOvertime, remainingMs } = useCountdown(
    current ?? { state: 'idle', duration: 0, end_time: null, paused_remaining: null },
    skewRef,
  )

  const { display: handoverDisplay } = useCountdown(
    {
      state: room?.state === 'handover' ? 'running' : 'idle',
      duration: 0,
      end_time: room?.handover_end_time ?? null,
      paused_remaining: null,
    },
    skewRef,
  )

  const wallClock = useWallClock(room?.show_clock ?? false)

  if (notFound) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-4 bg-cue-base">
        <span className="font-display text-[4vw] tracking-[0.25em] text-[#FF2040]">
          NO SUCH ROOM
        </span>
        <span className="font-mono text-[1.2vw] text-cue-muted">
          #{roomId}
        </span>
      </div>
    )
  }

  if (room === null) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-cue-base">
        <span className="font-display text-[3vw] tracking-[0.3em] text-cue-muted animate-fetching">
          CONNECTING
        </span>
      </div>
    )
  }

  // Emergency overrides everything
  if (room.emergency_active) {
    return (
      <div className="fixed inset-0 animate-emergency flex flex-col items-center justify-center gap-[4%] px-[8%]">
        <WarningIcon />
        <h1
          className="font-display tracking-[0.2em] text-white animate-emergency-text text-center"
          style={{ fontSize: 'clamp(2rem, 8vw, 8rem)' }}
        >
          EMERGENCY
        </h1>
        <hr className="w-[20%] border-2 border-white/60" />
        {room.emergency_text && (
          <p
            className="font-display text-white animate-emergency-text max-w-[80%] text-center leading-tight"
            style={{ fontSize: 'clamp(1rem, 4.5vw, 5rem)' }}
          >
            {room.emergency_text}
          </p>
        )}
      </div>
    )
  }

  const isComplete = room.state === 'complete'
  const isHandover = room.state === 'handover'
  const isLive = room.state === 'live' && current !== null
  const showMessageOverlay = room.message_active && !isComplete

  const isPaused = isLive && current?.state === 'paused'
  const isRunningOrOvertime =
    isLive && current && (current.state === 'running' || current.state === 'overtime')
  const hasZoneTint = (isRunningOrOvertime || isPaused) && current !== null
  const activeZone = hasZoneTint
    ? getActiveZone(remainingMs, current.zones)
    : null
  const isRedPulse =
    activeZone !== null &&
    current !== null &&
    isSmallestZone(activeZone, current.zones) &&
    remainingMs > 0 &&
    !isOvertime &&
    !isPaused

  const digitColor = isOvertime
    ? '#FF2040'
    : (activeZone?.color ?? room.accent_color)

  return (
    <div className="fixed inset-0 bg-cue-base">
      {/* Zone tint overlay (live + running/overtime/paused) */}
      {(isRunningOrOvertime || isPaused) && activeZone && (
        <div
          className={`absolute inset-0 pointer-events-none${isRedPulse ? ' animate-zone-red' : ''}`}
          style={
            isRedPulse
              ? { backgroundColor: activeZone.color }
              : {
                  backgroundColor: activeZone.color,
                  opacity: (activeZone.tint_opacity / 100) * (isPaused ? 0.5 : 1),
                }
          }
        />
      )}

      {/* Top strip */}
      <div className="top-strip flex items-center justify-between bg-cue-surface/90 border-b border-cue-border px-[2%]">
        <div className="flex items-center gap-[1.5%] min-w-0">
          {room.logo && (
            <img
              src={room.logo}
              className="h-[55%] w-auto object-contain shrink-0"
              alt=""
            />
          )}
          <span
            className="font-display leading-none tracking-widest truncate"
            style={{
              fontSize: 'clamp(0.75rem, 2.2vw, 2.5rem)',
              color: isOvertime ? '#FF2040' : 'var(--color-cue-primary)',
            }}
          >
            {isOvertime ? `OVERTIME | ${room.name}` : room.name}
          </span>
          {isLive && current && (current.session_title || current.speaker_name) && (
            <>
              <span
                className="font-display text-cue-muted shrink-0"
                style={{ fontSize: 'clamp(0.6rem, 1.6vw, 1.8rem)' }}
              >
                |
              </span>
              <span
                className="font-display tracking-wide text-cue-muted truncate"
                style={{ fontSize: 'clamp(0.65rem, 1.7vw, 1.9rem)' }}
              >
                {current.session_title || current.name}
                {current.speaker_name && ` — ${current.speaker_name}`}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {status === 'disconnected' && (
            <span className="flex items-center gap-1.5 font-mono text-[#FF2040]" style={{ fontSize: 'clamp(0.5rem, 0.9vw, 0.8rem)' }}>
              <span className="h-1.5 w-1.5 rounded-full bg-[#FF2040] animate-fetching" />
              RECONNECTING
            </span>
          )}
          {room.show_clock && wallClock && (
            <span
              className="font-mono tabular-nums text-cue-muted"
              style={{ fontSize: 'clamp(0.65rem, 1.8vw, 1.8rem)' }}
            >
              {wallClock}
            </span>
          )}
        </div>
      </div>

      {/* Center area */}
      <div
        className="center-area flex flex-col items-center justify-center"
        style={showMessageOverlay ? { bottom: '20%' } : undefined}
      >
        {/* Complete */}
        {isComplete && (
          <div className="flex flex-col items-center gap-[3%]">
            <span
              className="font-display leading-none tracking-wide text-cue-primary text-center"
              style={{ fontSize: 'clamp(2.5rem, 11vw, 12rem)' }}
            >
              THANK YOU
            </span>
            <div className="w-[10%] h-[3px] bg-cue-accent/60" />
            <span
              className="font-mono tracking-[0.35em] text-cue-muted uppercase"
              style={{ fontSize: 'clamp(0.7rem, 1.7vw, 1.6rem)' }}
            >
              Session Complete
            </span>
          </div>
        )}

        {/* Handover */}
        {isHandover && (
          <div className="flex flex-col items-center gap-[2%]">
            <span
              className="font-mono tracking-[0.35em] text-[#FFAA00] uppercase"
              style={{ fontSize: 'clamp(0.7rem, 1.6vw, 1.5rem)' }}
            >
              Up Next
            </span>
            {nextTimer && (
              <span
                className="font-display leading-none tracking-wide text-cue-primary text-center max-w-[90%]"
                style={{ fontSize: 'clamp(2rem, 7vw, 7rem)' }}
              >
                {nextTimer.session_title || nextTimer.name}
              </span>
            )}
            {nextTimer?.speaker_name && (
              <span
                className="font-display tracking-wide text-cue-muted"
                style={{ fontSize: 'clamp(1rem, 2.5vw, 2.5rem)' }}
              >
                {nextTimer.speaker_name}
              </span>
            )}
            <div className="mt-[2%] flex flex-col items-center gap-[1%]">
              <span
                className="font-mono tracking-[0.3em] text-cue-muted/70 uppercase"
                style={{ fontSize: 'clamp(0.55rem, 1.1vw, 1rem)' }}
              >
                Starting in
              </span>
              <span
                className="font-display tabular-nums"
                style={{
                  fontSize: 'clamp(3rem, 16vw, 18rem)',
                  color: '#FFAA00',
                  letterSpacing: '0.05em',
                  lineHeight: 1,
                }}
              >
                {handoverDisplay}
              </span>
            </div>
          </div>
        )}

        {/* Live + idle current timer */}
        {isLive && current && current.state === 'idle' && (
          <div className="flex flex-col items-center gap-[2%] max-w-[90%]">
            {room.logo && (
              <img
                src={room.logo}
                className="object-contain opacity-30"
                style={{ height: '15%', maxHeight: '15%' }}
                alt=""
              />
            )}
            <span
              className="font-display leading-none tracking-wide text-cue-primary text-center"
              style={{ fontSize: 'clamp(2rem, 9vw, 10rem)' }}
            >
              {current.session_title || current.name}
            </span>
            {current.speaker_name && (
              <span
                className="font-display tracking-wide text-cue-muted text-center"
                style={{ fontSize: 'clamp(1rem, 2.5vw, 2.5rem)' }}
              >
                {current.speaker_name}
              </span>
            )}
            <span
              className="font-mono tracking-[0.3em] text-cue-muted uppercase"
              style={{ fontSize: 'clamp(0.6rem, 1.5vw, 1.4rem)' }}
            >
              WAITING TO START
            </span>
            <div className="w-[6%] h-[2px] bg-cue-accent/40 mt-[1%]" />
            <span
              className="font-mono tabular-nums text-cue-muted"
              style={{ fontSize: 'clamp(0.8rem, 1.3vw, 1.2rem)', opacity: 0.6 }}
            >
              {formatDuration(current.duration)} scheduled
            </span>
          </div>
        )}

        {/* Live + running/overtime */}
        {isLive && isRunningOrOvertime && (
          <span
            className={showMessageOverlay ? 'timer-digits-with-message' : 'timer-digits'}
            style={{ color: digitColor }}
          >
            {timerDisplay}
          </span>
        )}

        {/* Live + paused */}
        {isLive && current && current.state === 'paused' && (
          <div className="flex flex-col items-center gap-[2%]">
            <span
              className={`timer-digits animate-digit-blink${showMessageOverlay ? ' timer-digits-with-message' : ''}`}
              style={{ color: 'var(--color-cue-primary)', opacity: 0.55 }}
            >
              {timerDisplay}
            </span>
            <span
              className="font-display tracking-[0.3em] border border-cue-muted text-cue-muted"
              style={{
                fontSize: 'clamp(0.8rem, 3vw, 3rem)',
                padding: '0.3em 1.2em',
                borderRadius: '2px',
              }}
            >
              PAUSED
            </span>
          </div>
        )}

        {/* Room idle (no current timer) */}
        {room.state === 'idle' && !current && (
          <div className="flex flex-col items-center gap-[2%]">
            <span
              className="font-display leading-none tracking-wide text-cue-primary text-center"
              style={{ fontSize: 'clamp(2rem, 8vw, 9rem)' }}
            >
              {room.name}
            </span>
            <span
              className="font-mono tracking-[0.3em] text-cue-muted uppercase"
              style={{ fontSize: 'clamp(0.6rem, 1.5vw, 1.4rem)' }}
            >
              READY
            </span>
          </div>
        )}

        {/* Room idle with idle current timer */}
        {room.state === 'idle' && current && (
          <div className="flex flex-col items-center gap-[2%]">
            <span
              className="font-display leading-none tracking-wide text-cue-primary text-center"
              style={{ fontSize: 'clamp(2rem, 7vw, 8rem)' }}
            >
              {current.session_title || current.name}
            </span>
            <span
              className="font-mono tabular-nums text-cue-muted"
              style={{ fontSize: 'clamp(0.8rem, 1.6vw, 1.6rem)', opacity: 0.7 }}
            >
              {formatDuration(current.duration)}
            </span>
          </div>
        )}
      </div>

      {/* Message overlay (hidden during emergency, complete) */}
      {!isComplete && (
        <div className={`message-overlay${room.message_active ? ' active' : ''} bg-cue-surface border-t-2 border-cue-accent flex items-center px-[3%] gap-[2%]`}>
          <span
            className="font-mono tracking-[0.25em] text-cue-muted border border-cue-muted shrink-0"
            style={{ fontSize: 'clamp(0.5rem, 1vw, 0.9rem)', padding: '0.2em 0.6em', opacity: 0.7 }}
          >
            MSG
          </span>
          <div className="w-[2px] bg-cue-accent" style={{ height: '40%' }} />
          <span
            className="font-display text-cue-primary truncate"
            style={{ fontSize: 'clamp(0.8rem, 4.5vh, 4rem)' }}
          >
            {room.message_text}
          </span>
        </div>
      )}

      {/* Bottom strip */}
      <div className="bottom-strip flex items-center justify-center bg-cue-surface/90 border-t border-cue-border">
        <span
          className="font-display tracking-[0.3em]"
          style={{
            fontSize: 'clamp(0.6rem, 2vw, 2rem)',
            color: isOvertime ? '#FF2040' : 'var(--color-cue-muted)',
            opacity: isOvertime ? 0.5 : 1,
          }}
        >
          {isOvertime ? 'SESSION ENDED' : isComplete ? 'EVENT COMPLETE' : isHandover ? 'HANDOVER' : 'VENUE TIMER'}
        </span>
      </div>
    </div>
  )
}
