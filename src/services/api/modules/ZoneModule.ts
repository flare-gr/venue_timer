import type { AxiosInstance } from 'axios'
import type { Zone, ZoneCreatePayload, ZoneUpdatePayload } from '../types.ts'

const roomBase = (roomId: number) => `/api/rooms/${roomId}/zones`
const timerBase = (roomId: number, timerId: number) =>
  `/api/rooms/${roomId}/timers/${timerId}/zones`

export class RoomZoneModule {
  private readonly http: AxiosInstance

  constructor(http: AxiosInstance) {
    this.http = http
  }

  async list(roomId: number): Promise<Zone[]> {
    const { data } = await this.http.get<Zone[]>(`${roomBase(roomId)}/`)
    return data
  }

  async get(roomId: number, zoneId: number): Promise<Zone> {
    const { data } = await this.http.get<Zone>(`${roomBase(roomId)}/${zoneId}/`)
    return data
  }

  async create(roomId: number, payload: ZoneCreatePayload): Promise<Zone> {
    const { data } = await this.http.post<Zone>(`${roomBase(roomId)}/`, payload)
    return data
  }

  async patch(roomId: number, zoneId: number, payload: ZoneUpdatePayload): Promise<Zone> {
    const { data } = await this.http.patch<Zone>(`${roomBase(roomId)}/${zoneId}/`, payload)
    return data
  }

  async delete(roomId: number, zoneId: number): Promise<void> {
    await this.http.delete(`${roomBase(roomId)}/${zoneId}/`)
  }
}

export class TimerZoneModule {
  private readonly http: AxiosInstance

  constructor(http: AxiosInstance) {
    this.http = http
  }

  async list(roomId: number, timerId: number): Promise<Zone[]> {
    const { data } = await this.http.get<Zone[]>(`${timerBase(roomId, timerId)}/`)
    return data
  }

  async get(roomId: number, timerId: number, zoneId: number): Promise<Zone> {
    const { data } = await this.http.get<Zone>(`${timerBase(roomId, timerId)}/${zoneId}/`)
    return data
  }

  async create(roomId: number, timerId: number, payload: ZoneCreatePayload): Promise<Zone> {
    const { data } = await this.http.post<Zone>(`${timerBase(roomId, timerId)}/`, payload)
    return data
  }

  async patch(
    roomId: number,
    timerId: number,
    zoneId: number,
    payload: ZoneUpdatePayload,
  ): Promise<Zone> {
    const { data } = await this.http.patch<Zone>(
      `${timerBase(roomId, timerId)}/${zoneId}/`,
      payload,
    )
    return data
  }

  async delete(roomId: number, timerId: number, zoneId: number): Promise<void> {
    await this.http.delete(`${timerBase(roomId, timerId)}/${zoneId}/`)
  }
}
