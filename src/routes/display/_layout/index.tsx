/* eslint-disable react-refresh/only-export-components */
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useApi } from '../../../services/api'
import { TimerSelectionList } from '../../../components/display/TimerSelectionList'

export const Route = createFileRoute('/display/_layout/')({
  component: TimerSelectionPage,
})

function TimerSelectionPage() {
  const navigate = useNavigate()
  const api = useApi()

  useEffect(() => {
    const saved = localStorage.getItem('display-timer-id')
    if (saved) {
      const id = parseInt(saved, 10)
      if (!isNaN(id)) {
        void navigate({ to: '/display/$timerId', params: { timerId: String(id) } })
      }
    }
  }, [navigate])

  const { data: timers, isLoading, isError } = useQuery({
    queryKey: ['timers-display'],
    queryFn: () => api.timer.list(),
  })

  function handleSelect(id: number) {
    localStorage.setItem('display-timer-id', String(id))
    void navigate({ to: '/display/$timerId', params: { timerId: String(id) } })
  }

  return (
    <div className="min-h-screen bg-cue-base bg-dot-grid">
      <TimerSelectionList
        timers={timers ?? []}
        isLoading={isLoading}
        isError={isError}
        onSelect={handleSelect}
      />
    </div>
  )
}
