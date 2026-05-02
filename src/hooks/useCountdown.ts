import { useState, useEffect, useRef, useMemo } from 'react'
import type { RefObject } from 'react'
import type { Timer } from '../services/api'

function formatMs(ms: number): string {
  const abs = Math.abs(ms)
  const totalSecs = Math.ceil(abs / 1000)
  const h = Math.floor(totalSecs / 3600)
  const m = Math.floor((totalSecs % 3600) / 60)
  const s = totalSecs % 60
  const sign = ms < 0 ? '+' : ''
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  if (h > 0) return `${sign}${h}:${mm}:${ss}`
  return `${sign}${mm}:${ss}`
}

export function useCountdown(
  timer: Timer,
  skewRef: RefObject<number>,
): { display: string; isOvertime: boolean } {
  const [rafDisplay, setRafDisplay] = useState<string>('00:00')
  const [isOvertime, setIsOvertime] = useState(false)
  const rafId = useRef<number>(0)

  // Derive static display values without touching state in effects
  const staticDisplay = useMemo(() => {
    if (timer.state === 'idle') return formatMs(timer.duration * 1000)
    if (timer.state === 'paused') return formatMs(timer.paused_remaining ?? 0)
    return null
  }, [timer.state, timer.duration, timer.paused_remaining])

  useEffect(() => {
    cancelAnimationFrame(rafId.current)

    if (timer.state !== 'running' && timer.state !== 'overtime') {
      return
    }

    if (!timer.end_time) return

    const endMs = new Date(timer.end_time).getTime()

    const tick = () => {
      const remaining = endMs - (Date.now() + skewRef.current)
      setRafDisplay(formatMs(remaining))
      setIsOvertime(remaining < 0)
      rafId.current = requestAnimationFrame(tick)
    }
    rafId.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId.current)
  }, [timer.state, timer.end_time, skewRef])

  const display = staticDisplay ?? rafDisplay
  const overtime = staticDisplay !== null ? false : isOvertime

  return { display, isOvertime: overtime }
}
