/* eslint-disable react-refresh/only-export-components */
import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useApi } from '../../../../services/api'
import { RoomCard } from '../../../../components/admin/RoomCard'
import { CreateRoomForm } from '../../../../components/admin/CreateRoomForm'

export const Route = createFileRoute('/admin/_layout/rooms/')({
  component: RoomsPage,
})

function RoomsPage() {
  const { t } = useTranslation('admin')
  const api = useApi()
  const queryClient = useQueryClient()

  const { data: rooms, isLoading, isError } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => api.rooms.list(),
  })

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ['rooms'] })
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-6 bg-dot-grid min-h-full">
      <div className="mb-6">
        <h2 className="font-display text-2xl leading-none tracking-wider text-cue-primary">
          {t('rooms.heading')}
        </h2>
        <p className="mt-1 font-mono text-xs text-cue-muted">
          {t('rooms.subtitle')}
        </p>
      </div>

      <div className="mb-6">
        <CreateRoomForm onCreated={invalidate} />
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-56 animate-fetching rounded-lg border border-cue-border bg-cue-surface"
            />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-[#FF2040]/30 bg-[#FF2040]/5 px-5 py-4">
          <p className="font-mono text-sm text-[#FF2040]">
            {t('rooms.loadError')}
          </p>
        </div>
      )}

      {rooms && rooms.length === 0 && (
        <div className="rounded-lg border border-dashed border-cue-border py-16 text-center">
          <p className="font-display text-lg tracking-wider text-cue-muted">{t('rooms.emptyTitle')}</p>
          <p className="mt-1 font-mono text-xs text-cue-muted/60">
            {t('rooms.emptyHint')}
          </p>
        </div>
      )}

      {rooms && rooms.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room, i) => (
            <RoomCard
              key={room.id}
              room={room}
              style={{ animationDelay: `${i * 60}ms` }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
