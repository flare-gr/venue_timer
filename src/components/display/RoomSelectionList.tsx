import type { Room } from '../../services/api'
import { RoomStateBadge } from '../admin/StateBadge'

interface RoomSelectionListProps {
  rooms: Room[]
  isLoading: boolean
  isError: boolean
  onSelect: (roomId: number) => void
}

export function RoomSelectionList({ rooms, isLoading, isError, onSelect }: RoomSelectionListProps) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-8">
      <div className="w-full max-w-[640px] overflow-hidden rounded-lg border border-cue-border bg-cue-surface shadow-2xl animate-fade-slide-up">
        <div className="h-1 bg-cue-accent" />

        <div className="px-8 py-6">
          <h1 className="font-display text-[clamp(1.5rem,3.8vw,3rem)] leading-none tracking-widest text-cue-accent">
            SELECT ROOM
          </h1>
          <p className="mt-1 font-mono text-[clamp(0.6rem,0.85vw,0.8rem)] text-cue-muted">
            Choose a room to display on this screen
          </p>
        </div>

        <div className="border-t border-cue-border" />

        <div className="max-h-[55vh] overflow-y-auto px-8 py-4">
          {isLoading && (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-16 animate-fetching rounded border border-cue-border bg-cue-base"
                />
              ))}
            </div>
          )}

          {isError && (
            <div className="rounded border border-[#FF2040]/30 bg-[#FF2040]/5 px-4 py-3">
              <p className="font-mono text-[clamp(0.65rem,0.85vw,0.8rem)] text-[#FF2040]">
                Failed to load rooms. Check that the backend is running.
              </p>
            </div>
          )}

          {!isLoading && !isError && rooms.length === 0 && (
            <div className="py-8 text-center">
              <p className="font-display text-[clamp(1rem,1.8vw,1.4rem)] tracking-widest text-cue-muted">
                NO ROOMS FOUND
              </p>
              <p className="mt-1 font-mono text-[clamp(0.6rem,0.75vw,0.7rem)] text-cue-muted/60">
                Create a room from the admin panel first.
              </p>
            </div>
          )}

          {!isLoading && !isError && rooms.length > 0 && (
            <div className="flex flex-col gap-2">
              {rooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => onSelect(room.id)}
                  className="group flex w-full cursor-pointer items-center justify-between gap-4 rounded border border-cue-border px-4 py-3 text-left transition-colors duration-[120ms] hover:border-cue-accent hover:bg-cue-accent/5"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="h-7 w-1 shrink-0 rounded-sm"
                      style={{ backgroundColor: room.accent_color }}
                    />
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="font-display text-[clamp(0.9rem,1.4vw,1.2rem)] leading-none tracking-wide text-cue-primary truncate">
                        {room.name}
                      </span>
                      <span className="font-mono text-[clamp(0.55rem,0.85vw,0.75rem)] text-cue-muted truncate">
                        #{room.id} · {room.mode} · {room.timers.length} {room.timers.length === 1 ? 'timer' : 'timers'}
                      </span>
                    </div>
                  </div>
                  <RoomStateBadge state={room.state} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-cue-border px-8 py-4">
          <p className="font-mono text-[clamp(0.55rem,0.75vw,0.7rem)] text-cue-muted/60">
            VENUE TIMER — Click a room to connect
          </p>
        </div>
      </div>
    </div>
  )
}
