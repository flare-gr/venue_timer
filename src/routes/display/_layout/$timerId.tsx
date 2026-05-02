/* eslint-disable react-refresh/only-export-components */
import { createFileRoute, useNavigate, Navigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { TimerDisplay } from '../../../components/display/TimerDisplay'
import { ShortcutHintPopup } from '../../../components/display/ShortcutHintPopup'

export const Route = createFileRoute('/display/_layout/$timerId')({
  component: TimerDisplayPage,
})

function TimerDisplayPage() {
  const { timerId } = Route.useParams()
  const navigate = useNavigate()
  const numericId = parseInt(timerId, 10)

  const [popupVisible, setPopupVisible] = useState(
    () => localStorage.getItem('display-shortcut-dismissed') !== 'true',
  )

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === '`') {
        localStorage.removeItem('display-timer-id')
        void navigate({ to: '/display/' })
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate])

  if (isNaN(numericId)) {
    return <Navigate to="/display/" />
  }

  return (
    <>
      <TimerDisplay timerId={numericId} />
      {popupVisible && (
        <ShortcutHintPopup
          onDismiss={() => setPopupVisible(false)}
          onDismissPermanent={() => {
            localStorage.setItem('display-shortcut-dismissed', 'true')
            setPopupVisible(false)
          }}
        />
      )}
    </>
  )
}
