export type RoomState = 'idle' | 'live' | 'handover' | 'complete'
export type RoomMode = 'simple' | 'schedule'
export type FontSize = 'small' | 'medium' | 'large'
export type TimerState = 'idle' | 'running' | 'paused' | 'overtime'

export interface Zone {
  id: number
  label: string
  threshold: number
  color: string
  tint_opacity: number
  order: number
}

export interface Timer {
  id: number
  room: number
  order: number
  name: string
  session_title: string
  speaker_name: string
  state: TimerState
  duration: number
  end_time: string | null
  paused_remaining: number | null
  handover_seconds: number | null
  updated_at: string
  zones: Zone[]
  zone_overrides: Zone[] | null
}

export interface Room {
  id: number
  name: string
  mode: RoomMode
  state: RoomState
  current_timer: number | null
  auto_advance: boolean
  handover_seconds: number
  handover_end_time: string | null
  logo: string | null
  accent_color: string
  font_size: FontSize
  show_clock: boolean
  message_text: string
  message_active: boolean
  emergency_text: string
  emergency_active: boolean
  updated_at: string
  zones: Zone[]
  timers: Timer[]
}

export interface RoomStateMessage {
  type: 'room_state'
  server_time: string
  room: Room
  next_timer: Timer | null
}

export interface RoomCreatePayload {
  name: string
  mode?: RoomMode
  accent_color?: string
  font_size?: FontSize
  show_clock?: boolean
  auto_advance?: boolean
  handover_seconds?: number
}

export interface RoomUpdatePayload {
  name?: string
  mode?: RoomMode
  accent_color?: string
  font_size?: FontSize
  show_clock?: boolean
  auto_advance?: boolean
  handover_seconds?: number
}

export interface TimerCreatePayload {
  name: string
  duration: number
  session_title?: string
  speaker_name?: string
  handover_seconds?: number | null
}

export interface TimerUpdatePayload {
  name?: string
  duration?: number
  session_title?: string
  speaker_name?: string
  handover_seconds?: number | null
}

export interface StartPayload {
  duration?: number
}

export interface ResetPayload {
  duration?: number
}

export interface SetDurationPayload {
  duration: number
}

export interface AdjustPayload {
  seconds: number
}

export interface MoveTimerPayload {
  to_order: number
}

export interface MessagePayload {
  text?: string
  active?: boolean
}

export interface EmergencyPayload {
  text?: string
  active?: boolean
}

export interface SkipToPayload {
  order: number
}

export interface ReorderPayload {
  order: number[]
}

export interface ZoneCreatePayload {
  label: string
  threshold: number
  color: string
  tint_opacity: number
  order: number
}

export interface ZoneUpdatePayload {
  label?: string
  threshold?: number
  color?: string
  tint_opacity?: number
  order?: number
}

export interface ModeSwitchEligibility {
  can_switch_to_simple: boolean
  can_switch_to_schedule: boolean
  reason: string | null
  required_action: string | null
}
