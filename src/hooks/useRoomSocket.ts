import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import type { Room, Timer } from '../services/api'
import { tokenStorage } from '../services/auth/tokenStorage'
import { useWsStore, type WsStatus } from '../store/wsStore'
import { config } from '../config'

const WS_BASE = config.wsBaseUrl
const MAX_BACKOFF_MS = 8000

export interface RoomSocketMessage {
  room: Room
  next_timer: Timer | null
}

export interface RoomSocketResult {
  status: WsStatus
  skewRef: RefObject<number>
  notFound: boolean
}

interface Options {
  /** If true, sends a JWT auth frame on connect when a token is present. */
  sendAuth?: boolean
  /** Connection role. Display clients suppress auth_ok/auth_error frames. */
  role?: 'display' | 'admin'
}

export function useRoomSocket(
  roomId: number,
  onMessage: (msg: RoomSocketMessage) => void,
  options: Options = {},
): RoomSocketResult {
  const setStatus = useWsStore((s) => s.setStatus)
  const skewRef = useRef<number>(0)
  const onMessageRef = useRef(onMessage)
  const [notFound, setNotFound] = useState(false)
  const { sendAuth = false, role = 'admin' } = options

  useLayoutEffect(() => {
    onMessageRef.current = onMessage
  })

  useEffect(() => {
    let ws: WebSocket | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let backoff = 1000
    let destroyed = false
    let fatal = false

    // Reset notFound when the room changes. Use queueMicrotask so the
    // setState happens after the effect body completes (avoids cascading
    // renders that React 19 flags via react-hooks/set-state-in-effect).
    queueMicrotask(() => {
      if (!destroyed) setNotFound(false)
    })

    function connect() {
      setStatus(roomId, 'connecting')
      ws = new WebSocket(`${WS_BASE}/ws/rooms/${roomId}/?role=${role}`)

      ws.onopen = () => {
        if (destroyed) return
        setStatus(roomId, 'connected')
        backoff = 1000

        if (sendAuth) {
          const token = tokenStorage.getAccessToken()
          if (token) {
            ws!.send(JSON.stringify({ type: 'auth', token }))
          }
        }
      }

      ws.onmessage = (event: MessageEvent<string>) => {
        // Capture receive time before any work — gives the tightest skew estimate.
        const clientReceiveMs = Date.now()
        const msg = JSON.parse(event.data) as Record<string, unknown>

        if (msg.type === 'room_state') {
          if (typeof msg.server_time === 'string') {
            skewRef.current = new Date(msg.server_time).getTime() - clientReceiveMs
          }
          onMessageRef.current({
            room: msg.room as Room,
            next_timer: (msg.next_timer ?? null) as Timer | null,
          })
        }
      }

      ws.onerror = () => {
        ws?.close()
      }

      ws.onclose = (event: CloseEvent) => {
        if (destroyed) return

        // 4404 = room id doesn't exist. Fatal — do not retry.
        if (event.code === 4404) {
          fatal = true
          setNotFound(true)
          setStatus(roomId, 'disconnected')
          return
        }

        setStatus(roomId, 'disconnected')
        if (fatal) return

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
  }, [roomId, setStatus, sendAuth, role])

  const status = useWsStore((s) => s.statuses[roomId] ?? 'disconnected')
  return { status, skewRef, notFound }
}
