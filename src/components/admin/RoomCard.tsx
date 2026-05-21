import { Link } from '@tanstack/react-router'
import type { Room } from '../../services/api'
import { RoomStateBadge } from './StateBadge'

interface RoomCardProps {
  room: Room
  style?: React.CSSProperties
}

export function RoomCard({ room, style }: RoomCardProps) {
  const current = room.timers.find((t) => t.id === room.current_timer) ?? null

  return (
    <Link
      to="/admin/rooms/$roomId"
      params={{ roomId: String(room.id) }}
      className="group relative block rounded-lg border border-cue-border bg-cue-surface shadow-sm overflow-hidden animate-card-in hover:border-cue-accent transition-colors duration-[120ms]"
      style={style}
    >
      {/* Accent strip on the left, using the room's accent colour */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px]"
        style={{ backgroundColor: room.accent_color }}
      />

      <div className="pl-4 p-4 space-y-3">
        {/* Header row: name + state */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1.5 min-w-0">
            <span
              className="font-display text-xl leading-none tracking-wide text-cue-primary truncate"
              title={room.name}
            >
              {room.name}
            </span>
            <span className="font-mono text-[10px] text-cue-muted truncate">
              #{room.id}
            </span>
          </div>
          <RoomStateBadge state={room.state} />
        </div>

        {/* Mode + counts */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded border border-cue-border px-2 py-0.5 font-mono text-[10px] font-semibold tracking-widest text-cue-muted uppercase">
            {room.mode}
          </span>
          <span className="font-mono text-[10px] text-cue-muted">
            {room.timers.length} {room.timers.length === 1 ? 'TIMER' : 'TIMERS'}
          </span>
          {room.mode === 'schedule' && room.auto_advance && (
            <span className="rounded border border-cue-accent/40 px-2 py-0.5 font-mono text-[10px] font-semibold tracking-widest text-cue-accent uppercase">
              AUTO
            </span>
          )}
        </div>

        {/* Current timer */}
        <div className="rounded border border-cue-border bg-cue-base/50 p-3">
          <div className="font-mono text-[10px] font-semibold tracking-widest text-cue-muted uppercase">
            Current
          </div>
          <div className="mt-1 font-display text-base tracking-wide text-cue-primary truncate">
            {current ? (current.session_title || current.name) : '—'}
          </div>
          {current?.speaker_name && (
            <div className="mt-0.5 font-mono text-xs text-cue-muted truncate">
              {current.speaker_name}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="border-t border-cue-border pt-2 font-mono text-[10px] tracking-widest text-cue-muted/70 uppercase group-hover:text-cue-accent transition-colors duration-[120ms]">
          Open controls →
        </div>
      </div>
    </Link>
  )
}
