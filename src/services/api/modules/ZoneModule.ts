import type { AxiosInstance } from 'axios'
import type { TimerZone, ZoneCreatePayload, ZoneUpdatePayload } from '../types.ts'

const base = (timerId: number) => `/api/timers/${timerId}/zones`

export class ZoneModule {
  private readonly http: AxiosInstance

  constructor(http: AxiosInstance) {
    this.http = http
  }

  async list(timerId: number): Promise<TimerZone[]> {
    const { data } = await this.http.get<TimerZone[]>(`${base(timerId)}/`)
    return data
  }

  async get(timerId: number, zoneId: number): Promise<TimerZone> {
    const { data } = await this.http.get<TimerZone>(`${base(timerId)}/${zoneId}/`)
    return data
  }

  async create(timerId: number, payload: ZoneCreatePayload): Promise<TimerZone> {
    const { data } = await this.http.post<TimerZone>(`${base(timerId)}/`, payload)
    return data
  }

  async update(timerId: number, zoneId: number, payload: ZoneUpdatePayload): Promise<TimerZone> {
    const { data } = await this.http.put<TimerZone>(`${base(timerId)}/${zoneId}/`, payload)
    return data
  }

  async patch(timerId: number, zoneId: number, payload: ZoneUpdatePayload): Promise<TimerZone> {
    const { data } = await this.http.patch<TimerZone>(`${base(timerId)}/${zoneId}/`, payload)
    return data
  }

  async delete(timerId: number, zoneId: number): Promise<void> {
    await this.http.delete(`${base(timerId)}/${zoneId}/`)
  }
}
