import type { AxiosInstance } from 'axios'
import type {
  Room,
  Timer,
  TimerCreatePayload,
  TimerUpdatePayload,
  StartPayload,
  ResetPayload,
  SetDurationPayload,
  AdjustPayload,
  MoveTimerPayload,
} from '../types.ts'

const base = (roomId: number) => `/api/rooms/${roomId}/timers`

export class TimerModule {
  private readonly http: AxiosInstance

  constructor(http: AxiosInstance) {
    this.http = http
  }

  async list(roomId: number): Promise<Timer[]> {
    const { data } = await this.http.get<Timer[]>(`${base(roomId)}/`)
    return data
  }

  async get(roomId: number, id: number): Promise<Timer> {
    const { data } = await this.http.get<Timer>(`${base(roomId)}/${id}/`)
    return data
  }

  async create(roomId: number, payload: TimerCreatePayload): Promise<Timer> {
    const { data } = await this.http.post<Timer>(`${base(roomId)}/`, payload)
    return data
  }

  async patch(roomId: number, id: number, payload: TimerUpdatePayload): Promise<Timer> {
    const { data } = await this.http.patch<Timer>(`${base(roomId)}/${id}/`, payload)
    return data
  }

  async delete(roomId: number, id: number): Promise<void> {
    await this.http.delete(`${base(roomId)}/${id}/`)
  }

  async start(roomId: number, id: number, payload?: StartPayload): Promise<Timer> {
    const { data } = await this.http.post<Timer>(`${base(roomId)}/${id}/start/`, payload)
    return data
  }

  async pause(roomId: number, id: number): Promise<Timer> {
    const { data } = await this.http.post<Timer>(`${base(roomId)}/${id}/pause/`)
    return data
  }

  async resume(roomId: number, id: number): Promise<Timer> {
    const { data } = await this.http.post<Timer>(`${base(roomId)}/${id}/resume/`)
    return data
  }

  async reset(roomId: number, id: number, payload?: ResetPayload): Promise<Timer> {
    const { data } = await this.http.post<Timer>(`${base(roomId)}/${id}/reset/`, payload)
    return data
  }

  async setDuration(
    roomId: number,
    id: number,
    payload: SetDurationPayload,
  ): Promise<Timer> {
    const { data } = await this.http.post<Timer>(
      `${base(roomId)}/${id}/set_duration/`,
      payload,
    )
    return data
  }

  async adjust(roomId: number, id: number, payload: AdjustPayload): Promise<Timer> {
    const { data } = await this.http.post<Timer>(
      `${base(roomId)}/${id}/adjust/`,
      payload,
    )
    return data
  }

  async move(roomId: number, id: number, payload: MoveTimerPayload): Promise<Room> {
    const { data } = await this.http.post<Room>(
      `${base(roomId)}/${id}/move/`,
      payload,
    )
    return data
  }
}
