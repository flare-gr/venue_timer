/* eslint-disable react-refresh/only-export-components */
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TimerDisplay } from '../../../components/display/TimerDisplay'
import { ShortcutHintPopup } from '../../../components/display/ShortcutHintPopup'

export const Route = createFileRoute('/display/_layout/$roomId')({
  component: RoomDisplayPage,
})

function RoomDisplayPage() {
  const { t } = useTranslation('display')
  const { roomId: roomIdRaw } = Route.useParams()
  const navigate = useNavigate()
  const roomId = Number(roomIdRaw)
  const invalidId = !Number.isInteger(roomId) || roomId <= 0

  const [popupVisible, setPopupVisible] = useState(
    () => localStorage.getItem('display-shortcut-dismissed') !== 'true',
  )

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === '`') {
        localStorage.removeItem('display-room-id')
        void navigate({ to: '/display' })
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate])

  if (invalidId) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-4 bg-cue-base">
        <span className="font-display text-[2.4vw] tracking-[0.25em] text-[#FF2040]">
          {t('invalidRoom')}
        </span>
        <span className="font-mono text-[1.2vw] text-cue-muted">/{roomIdRaw}</span>
      </div>
    )
  }

  return (
    <>
      <TimerDisplay roomId={roomId} />
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
