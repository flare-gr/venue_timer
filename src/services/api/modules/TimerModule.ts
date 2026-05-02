import type { AxiosInstance } from 'axios'
import type {
  Timer,
  TimerCreatePayload,
  TimerUpdatePayload,
  StartPayload,
  ResetPayload,
  SetDurationPayload,
  MessagePayload,
  EmergencyPayload,
} from '../types.ts'

const BASE = '/api/timers'

export class TimerModule {
  private readonly http: AxiosInstance

  constructor(http: AxiosInstance) {
    this.http = http
  }

  async list(): Promise<Timer[]> {
    const { data } = await this.http.get<Timer[]>(`${BASE}/`)
    return data
  }

  async get(id: number): Promise<Timer> {
    const { data } = await this.http.get<Timer>(`${BASE}/${id}/`)
    return data
  }

  async create(payload: TimerCreatePayload): Promise<Timer> {
    const { data } = await this.http.post<Timer>(`${BASE}/`, payload)
    return data
  }

  async update(id: number, payload: TimerUpdatePayload): Promise<Timer> {
    const { data } = await this.http.put<Timer>(`${BASE}/${id}/`, payload)
    return data
  }

  async patch(id: number, payload: TimerUpdatePayload): Promise<Timer> {
    const { data } = await this.http.patch<Timer>(`${BASE}/${id}/`, payload)
    return data
  }

  async delete(id: number): Promise<void> {
    await this.http.delete(`${BASE}/${id}/`)
  }

  async start(id: number, payload?: StartPayload): Promise<Timer> {
    const { data } = await this.http.post<Timer>(`${BASE}/${id}/start/`, payload)
    return data
  }

  async pause(id: number): Promise<Timer> {
    const { data } = await this.http.post<Timer>(`${BASE}/${id}/pause/`)
    return data
  }

  async resume(id: number): Promise<Timer> {
    const { data } = await this.http.post<Timer>(`${BASE}/${id}/resume/`)
    return data
  }

  async reset(id: number, payload?: ResetPayload): Promise<Timer> {
    const { data } = await this.http.post<Timer>(`${BASE}/${id}/reset/`, payload)
    return data
  }

  async setDuration(id: number, payload: SetDurationPayload): Promise<Timer> {
    const { data } = await this.http.post<Timer>(`${BASE}/${id}/set_duration/`, payload)
    return data
  }

  async message(id: number, payload: MessagePayload): Promise<Timer> {
    const { data } = await this.http.post<Timer>(`${BASE}/${id}/message/`, payload)
    return data
  }

  async emergency(id: number, payload: EmergencyPayload): Promise<Timer> {
    const { data } = await this.http.post<Timer>(`${BASE}/${id}/emergency/`, payload)
    return data
  }
}
