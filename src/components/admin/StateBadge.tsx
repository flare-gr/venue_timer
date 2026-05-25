import { useTranslation } from 'react-i18next'
import type { RoomState, TimerState } from '../../services/api'

type AnyState = TimerState | RoomState

interface BadgeStyle {
  dot: string
  cls: string
}

const TIMER_STATES: Record<TimerState, BadgeStyle> = {
  idle:     { dot: '#3A5C82', cls: 'bg-cue-muted/10 text-cue-muted' },
  running:  { dot: '#00F078', cls: 'bg-[#00F078]/10 text-[#00F078]' },
  paused:   { dot: '#FFAA00', cls: 'bg-[#FFAA00]/10 text-[#FFAA00]' },
  overtime: { dot: '#FF2040', cls: 'bg-[#FF2040]/10 text-[#FF2040]' },
}

const ROOM_STATES: Record<RoomState, BadgeStyle> = {
  idle:     { dot: '#3A5C82', cls: 'bg-cue-muted/10 text-cue-muted' },
  live:     { dot: '#00F078', cls: 'bg-[#00F078]/10 text-[#00F078]' },
  handover: { dot: '#FFAA00', cls: 'bg-[#FFAA00]/10 text-[#FFAA00]' },
  complete: { dot: '#00C8FF', cls: 'bg-cue-accent/10 text-cue-accent' },
}

function isTimerState(state: AnyState, kind: 'timer' | 'room' | 'auto'): boolean {
  if (kind === 'timer') return true
  if (kind === 'room') return false
  return state in TIMER_STATES && !(state in ROOM_STATES && state !== 'idle')
}

interface StateBadgeProps {
  state: AnyState
  kind?: 'timer' | 'room' | 'auto'
}

export function StateBadge({ state, kind = 'auto' }: StateBadgeProps) {
  const { t } = useTranslation('common')
  const useTimer = isTimerState(state, kind)
  const config = useTimer
    ? TIMER_STATES[state as TimerState]
    : ROOM_STATES[state as RoomState]

  if (!config) return null

  const label = useTimer
    ? t(`timerState.${state as TimerState}`)
    : t(`roomState.${state as RoomState}`)

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-[10px] font-semibold tracking-widest ${config.cls}`}
    >
      <span
        className="h-1.5 w-1.5 rounded-full shrink-0"
        style={{ backgroundColor: config.dot, boxShadow: `0 0 5px ${config.dot}` }}
      />
      {label}
    </span>
  )
}

export function TimerStateBadge({ state }: { state: TimerState }) {
  return <StateBadge state={state} kind="timer" />
}

export function RoomStateBadge({ state }: { state: RoomState }) {
  return <StateBadge state={state} kind="room" />
}
