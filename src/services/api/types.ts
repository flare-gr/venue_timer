export interface TimerZone {
  id: number
  label: string
  threshold: number
  color: string
  tint_opacity: number
  order: number
}

export interface Timer {
  id: number
  name: string
  state: 'idle' | 'running' | 'paused' | 'overtime'
  duration: number
  end_time: string | null
  paused_remaining: number | null
  message_text: string
  message_active: boolean
  emergency_text: string
  emergency_active: boolean
  logo: string | null
  accent_color: string
  font_size: 'small' | 'medium' | 'large'
  show_clock: boolean
  updated_at: string
  zones: TimerZone[]
}

export interface TimerCreatePayload {
  name: string
  duration: number
  accent_color?: string
  font_size?: Timer['font_size']
  show_clock?: boolean
  message_text?: string
  message_active?: boolean
  emergency_text?: string
  emergency_active?: boolean
}

export interface TimerUpdatePayload {
  name?: string
  duration?: number
  accent_color?: string
  font_size?: Timer['font_size']
  show_clock?: boolean
  message_text?: string
  message_active?: boolean
  emergency_text?: string
  emergency_active?: boolean
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

export interface MessagePayload {
  text?: string
  active?: boolean
}

export interface EmergencyPayload {
  text?: string
  active?: boolean
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
