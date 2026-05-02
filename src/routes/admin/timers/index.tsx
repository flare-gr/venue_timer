/* eslint-disable react-refresh/only-export-components */
import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useApi } from '../../../services/api'
import { TimerCard } from '../../../components/admin/TimerCard'
import { CreateTimerForm } from '../../../components/admin/CreateTimerForm'

export const Route = createFileRoute('/admin/timers/')({
  component: TimersPage,
})

function TimersPage() {
  const api = useApi()
  const queryClient = useQueryClient()

  const { data: timers, isLoading, isError } = useQuery({
    queryKey: ['timers'],
    queryFn: () => api.timer.list(),
  })

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ['timers'] })
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-6 bg-dot-grid min-h-full">
      {/* Page header */}
      <div className="mb-6">
        <h2 className="font-display text-2xl leading-none tracking-wider text-cue-primary">
          TIMERS
        </h2>
        <p className="mt-1 font-mono text-xs text-cue-muted">
          Manage and control all venue timers
        </p>
      </div>

      {/* Create timer */}
      <div className="mb-6">
        <CreateTimerForm onCreated={invalidate} />
      </div>

      {/* Timer list */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-72 animate-fetching rounded-lg border border-cue-border bg-cue-surface"
            />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-[#FF2040]/30 bg-[#FF2040]/5 px-5 py-4">
          <p className="font-mono text-sm text-[#FF2040]">
            Failed to load timers. Check that the backend is running.
          </p>
        </div>
      )}

      {timers && timers.length === 0 && (
        <div className="rounded-lg border border-dashed border-cue-border py-16 text-center">
          <p className="font-display text-lg tracking-wider text-cue-muted">NO TIMERS YET</p>
          <p className="mt-1 font-mono text-xs text-cue-muted/60">
            Create your first timer using the form above.
          </p>
        </div>
      )}

      {timers && timers.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {timers.map((timer, i) => (
            <TimerCard
              key={timer.id}
              initialTimer={timer}
              onDeleted={invalidate}
              onMutated={invalidate}
              style={{ animationDelay: `${i * 60}ms` }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
