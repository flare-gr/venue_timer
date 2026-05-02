import { useState, useEffect, useRef } from 'react'
import type { Timer, TimerZone } from '../../services/api'
import { useTimerSocket } from '../../hooks/useTimerSocket'
import { useCountdown } from '../../hooks/useCountdown'

const FALLBACK_TIMER: Timer = {
  id: 0,
  name: '',
  state: 'idle',
  duration: 0,
  end_time: null,
  paused_remaining: null,
  message_text: '',
  message_active: false,
  emergency_text: '',
  emergency_active: false,
  logo: null,
  accent_color: '#00C8FF',
  font_size: 'medium',
  show_clock: false,
  updated_at: '',
  zones: [],
}

function getActiveZone(remainingMs: number, zones: TimerZone[]): TimerZone | null {
  const secs = remainingMs / 1000
  const sorted = [...zones].sort((a, b) => a.threshold - b.threshold)
  return sorted.find((z) => secs <= z.threshold) ?? null
}

function isSmallestZone(zone: TimerZone, zones: TimerZone[]): boolean {
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

// Warning triangle SVG for emergency state
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

interface TimerDisplayProps {
  timerId: number
}

export function TimerDisplay({ timerId }: TimerDisplayProps) {
  const [timer, setTimer] = useState<Timer | null>(null)
  const { status, skewRef } = useTimerSocket(timerId, setTimer)
  const { display, isOvertime, remainingMs } = useCountdown(timer ?? FALLBACK_TIMER, skewRef)

  const [wallClock, setWallClock] = useState('')
  const clockRafRef = useRef<number>(0)

  useEffect(() => {
    if (!timer?.show_clock) return
    const tick = () => {
      const now = new Date()
      const h = String(now.getHours()).padStart(2, '0')
      const m = String(now.getMinutes()).padStart(2, '0')
      const s = String(now.getSeconds()).padStart(2, '0')
      setWallClock(`${h}:${m}:${s}`)
      clockRafRef.current = requestAnimationFrame(tick)
    }
    clockRafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(clockRafRef.current)
  }, [timer?.show_clock])

  // Connecting placeholder
  if (timer === null) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-cue-base">
        <span className="font-display text-[3vw] tracking-[0.3em] text-cue-muted animate-fetching">
          CONNECTING
        </span>
      </div>
    )
  }

  // Emergency state overrides everything
  if (timer.emergency_active) {
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
        {timer.emergency_text && (
          <p
            className="font-display text-white animate-emergency-text max-w-[80%] text-center leading-tight"
            style={{ fontSize: 'clamp(1rem, 4.5vw, 5rem)' }}
          >
            {timer.emergency_text}
          </p>
        )}
      </div>
    )
  }

  const isRunningOrOvertime = timer.state === 'running' || timer.state === 'overtime'
  const activeZone = isRunningOrOvertime ? getActiveZone(remainingMs, timer.zones) : null
  const isRedPulse =
    activeZone !== null &&
    isSmallestZone(activeZone, timer.zones) &&
    remainingMs > 0 &&
    !isOvertime

  const digitColor = isOvertime
    ? '#FF2040'
    : (activeZone?.color ?? timer.accent_color)

  return (
    <div className="fixed inset-0 bg-cue-base">

        {/* Zone tint overlay */}
        {isRunningOrOvertime && activeZone && (
          <div
            className={`absolute inset-0 pointer-events-none${isRedPulse ? ' animate-zone-red' : ''}`}
            style={
              isRedPulse
                ? { backgroundColor: activeZone.color }
                : { backgroundColor: activeZone.color, opacity: activeZone.tint_opacity / 100 }
            }
          />
        )}

        {/* Top strip */}
        <div className="top-strip flex items-center justify-between bg-cue-surface/90 border-b border-cue-border px-[2%]">
          <div className="flex items-center gap-[1.5%] min-w-0">
            {timer.logo && (
              <img
                src={timer.logo}
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
              {isOvertime ? `OVERTIME | ${timer.name}` : timer.name}
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {status === 'disconnected' && (
              <span className="flex items-center gap-1.5 font-mono text-[#FF2040]" style={{ fontSize: 'clamp(0.5rem, 0.9vw, 0.8rem)' }}>
                <span className="h-1.5 w-1.5 rounded-full bg-[#FF2040] animate-fetching" />
                RECONNECTING
              </span>
            )}
            {timer.show_clock && wallClock && (
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
          style={timer.message_active ? { bottom: '20%' } : undefined}
        >
          {timer.state === 'idle' && (
            <div className="flex flex-col items-center gap-[2%]">
              {timer.logo && (
                <img
                  src={timer.logo}
                  className="object-contain opacity-30"
                  style={{ height: '15%', maxHeight: '15%' }}
                  alt=""
                />
              )}
              <span
                className="font-display leading-none tracking-wide text-cue-primary text-center"
                style={{ fontSize: 'clamp(2rem, 9vw, 10rem)' }}
              >
                {timer.name}
              </span>
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
                {formatDuration(timer.duration)} scheduled
              </span>
            </div>
          )}

          {isRunningOrOvertime && (
            <span
              className={timer.message_active ? 'timer-digits-with-message' : 'timer-digits'}
              style={{ color: digitColor }}
            >
              {display}
            </span>
          )}

          {timer.state === 'paused' && (
            <div className="flex flex-col items-center gap-[2%]">
              <span
                className={`timer-digits animate-digit-blink${timer.message_active ? ' timer-digits-with-message' : ''}`}
                style={{ color: 'var(--color-cue-primary)', opacity: 0.55 }}
              >
                {display}
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
        </div>

        {/* Message overlay */}
        <div className={`message-overlay${timer.message_active ? ' active' : ''} bg-cue-surface border-t-2 border-cue-accent flex items-center px-[3%] gap-[2%]`}>
          <span
            className="font-mono tracking-[0.25em] text-cue-muted border border-cue-muted shrink-0"
            style={{ fontSize: 'clamp(0.5rem, 1vw, 0.9rem)', padding: '0.2em 0.6em', opacity: 0.7 }}
          >
            MSG
          </span>
          <div className="w-[2px] self-[40%] bg-cue-accent" style={{ height: '40%' }} />
          <span
            className="font-display text-cue-primary truncate"
            style={{ fontSize: 'clamp(0.8rem, 4.5vh, 4rem)' }}
          >
            {timer.message_text}
          </span>
        </div>

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
            {isOvertime ? 'SESSION ENDED' : 'VENUE TIMER'}
          </span>
        </div>

    </div>
  )
}
