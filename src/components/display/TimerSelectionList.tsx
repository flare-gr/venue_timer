import type { Timer } from '../../services/api'
import { StateBadge } from '../admin/StateBadge'

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  if (h > 0) return `${h}:${mm}:${ss}`
  return `${mm}:${ss}`
}

interface TimerSelectionListProps {
  timers: Timer[]
  isLoading: boolean
  isError: boolean
  onSelect: (id: number) => void
}

export function TimerSelectionList({ timers, isLoading, isError, onSelect }: TimerSelectionListProps) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-8">
      <div className="w-full max-w-[600px] overflow-hidden rounded-lg border border-cue-border bg-cue-surface shadow-2xl animate-fade-slide-up">
        <div className="h-1 bg-cue-accent" />

        <div className="px-8 py-6">
          <h1 className="font-display text-[clamp(1.5rem,3.8vw,3rem)] leading-none tracking-widest text-cue-accent">
            SELECT TIMER
          </h1>
          <p className="mt-1 font-mono text-[clamp(0.6rem,0.85vw,0.8rem)] text-cue-muted">
            Choose a timer to display on this screen
          </p>
        </div>

        <div className="border-t border-cue-border" />

        <div className="max-h-[50vh] overflow-y-auto px-8 py-4">
          {isLoading && (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-14 animate-fetching rounded border border-cue-border bg-cue-base"
                />
              ))}
            </div>
          )}

          {isError && (
            <div className="rounded border border-[#FF2040]/30 bg-[#FF2040]/5 px-4 py-3">
              <p className="font-mono text-[clamp(0.65rem,0.85vw,0.8rem)] text-[#FF2040]">
                Failed to load timers. Check that the backend is running.
              </p>
            </div>
          )}

          {!isLoading && !isError && timers.length === 0 && (
            <div className="py-8 text-center">
              <p className="font-display text-[clamp(1rem,1.8vw,1.4rem)] tracking-widest text-cue-muted">
                NO TIMERS FOUND
              </p>
              <p className="mt-1 font-mono text-[clamp(0.6rem,0.75vw,0.7rem)] text-cue-muted/60">
                Create a timer from the admin panel first.
              </p>
            </div>
          )}

          {!isLoading && !isError && timers.length > 0 && (
            <div className="flex flex-col gap-2">
              {timers.map((timer) => (
                <button
                  key={timer.id}
                  onClick={() => onSelect(timer.id)}
                  className="flex w-full cursor-pointer items-center justify-between rounded border border-cue-border px-4 py-3 text-left transition-colors duration-[120ms] hover:border-cue-accent hover:bg-cue-accent/5"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="font-display text-[clamp(0.9rem,1.4vw,1.2rem)] leading-none tracking-wide text-cue-primary">
                      {timer.name}
                    </span>
                    <span className="font-mono text-[clamp(0.55rem,0.85vw,0.75rem)] text-cue-muted">
                      {formatDuration(timer.duration)}
                    </span>
                  </div>
                  <StateBadge state={timer.state} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-cue-border px-8 py-4">
          <p className="font-mono text-[clamp(0.55rem,0.75vw,0.7rem)] text-cue-muted/60">
            VENUE TIMER — Click a timer to connect
          </p>
        </div>
      </div>
    </div>
  )
}
