import { useEffect, useLayoutEffect, useRef } from 'react'
import type { RefObject } from 'react'
import type { Timer } from '../services/api'
import { tokenStorage } from '../services/auth/tokenStorage'
import { useWsStore, type WsStatus } from '../store/wsStore'

import { config } from '../config'

const WS_BASE = config.wsBaseUrl
const MAX_BACKOFF_MS = 8000

export function useTimerSocket(
  timerId: number,
  onMessage: (timer: Timer) => void,
): { status: WsStatus; skewRef: RefObject<number> } {
  const setStatus = useWsStore((s) => s.setStatus)
  const skewRef = useRef<number>(0)
  const onMessageRef = useRef(onMessage)

  useLayoutEffect(() => {
    onMessageRef.current = onMessage
  })

  useEffect(() => {
    let ws: WebSocket | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let backoff = 1000
    let destroyed = false
    let t1 = 0

    function connect() {
      setStatus(timerId, 'connecting')
      ws = new WebSocket(`${WS_BASE}/ws/timers/${timerId}/`)

      ws.onopen = () => {
        if (destroyed) return
        setStatus(timerId, 'connected')
        backoff = 1000

        const token = tokenStorage.getAccessToken()
        if (token) {
          ws!.send(JSON.stringify({ type: 'auth', token }))
        }

        t1 = Date.now()
        ws!.send(JSON.stringify({ type: 'ping' }))
      }

      ws.onmessage = (event: MessageEvent<string>) => {
        const msg = JSON.parse(event.data) as Record<string, unknown>

        if (msg.type === 'pong') {
          const serverMs = new Date(msg.server_time as string).getTime()
          skewRef.current = serverMs - (t1 + Date.now()) / 2
          return
        }

        if (msg.type === 'timer_state') {
          onMessageRef.current(msg as unknown as Timer)
        }
      }

      ws.onerror = () => {
        ws?.close()
      }

      ws.onclose = () => {
        if (destroyed) return
        setStatus(timerId, 'disconnected')
        reconnectTimer = setTimeout(() => {
          backoff = Math.min(backoff * 2, MAX_BACKOFF_MS)
          connect()
        }, backoff)
      }
    }

    connect()

    return () => {
      destroyed = true
      if (reconnectTimer !== null) clearTimeout(reconnectTimer)
      ws?.close()
    }
  }, [timerId, setStatus])

  const status = useWsStore((s) => s.statuses[timerId] ?? 'disconnected')
  return { status, skewRef }
}
