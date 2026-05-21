/* eslint-disable react-refresh/only-export-components */
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useApi } from '../../../services/api'
import { RoomSelectionList } from '../../../components/display/RoomSelectionList'

const SAVED_ROOM_KEY = 'display-room-id'

function readSavedRoomId(): number | null {
  const raw = localStorage.getItem(SAVED_ROOM_KEY)
  if (raw === null) return null
  const n = Number(raw)
  if (!Number.isInteger(n) || n <= 0) return null
  return n
}

export const Route = createFileRoute('/display/_layout/')({
  component: RoomSelectionPage,
})

function RoomSelectionPage() {
  const navigate = useNavigate()
  const api = useApi()

  useEffect(() => {
    const saved = readSavedRoomId()
    if (saved !== null) {
      void navigate({ to: '/display/$roomId', params: { roomId: String(saved) } })
    }
  }, [navigate])

  const { data: rooms, isLoading, isError } = useQuery({
    queryKey: ['rooms-display'],
    queryFn: () => api.rooms.list(),
  })

  // Auto-navigate when there's exactly one room and nothing saved.
  useEffect(() => {
    if (!rooms || rooms.length !== 1) return
    if (readSavedRoomId() !== null) return
    const only = rooms[0]
    localStorage.setItem(SAVED_ROOM_KEY, String(only.id))
    void navigate({ to: '/display/$roomId', params: { roomId: String(only.id) } })
  }, [rooms, navigate])

  function handleSelect(roomId: number) {
    localStorage.setItem(SAVED_ROOM_KEY, String(roomId))
    void navigate({ to: '/display/$roomId', params: { roomId: String(roomId) } })
  }

  return (
    <div className="min-h-screen bg-cue-base bg-dot-grid">
      <RoomSelectionList
        rooms={rooms ?? []}
        isLoading={isLoading}
        isError={isError}
        onSelect={handleSelect}
      />
    </div>
  )
}
