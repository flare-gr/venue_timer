import type { AxiosInstance } from 'axios'
import type {
  Room,
  RoomCreatePayload,
  RoomUpdatePayload,
  MessagePayload,
  EmergencyPayload,
  PoiPayload,
  SkipToPayload,
  ReorderPayload,
  ModeSwitchEligibility,
} from '../types.ts'

const BASE = '/api/rooms'

export class RoomModule {
  private readonly http: AxiosInstance

  constructor(http: AxiosInstance) {
    this.http = http
  }

  async list(): Promise<Room[]> {
    const { data } = await this.http.get<Room[]>(`${BASE}/`)
    return data
  }

  async get(id: number): Promise<Room> {
    const { data } = await this.http.get<Room>(`${BASE}/${id}/`)
    return data
  }

  async create(payload: RoomCreatePayload): Promise<Room> {
    const { data } = await this.http.post<Room>(`${BASE}/`, payload)
    return data
  }

  async patch(id: number, payload: RoomUpdatePayload): Promise<Room> {
    const { data } = await this.http.patch<Room>(`${BASE}/${id}/`, payload)
    return data
  }

  async delete(id: number): Promise<void> {
    await this.http.delete(`${BASE}/${id}/`)
  }

  async advance(id: number): Promise<Room> {
    const { data } = await this.http.post<Room>(`${BASE}/${id}/advance/`)
    return data
  }

  async previous(id: number): Promise<Room> {
    const { data } = await this.http.post<Room>(`${BASE}/${id}/previous/`)
    return data
  }

  async skipTo(id: number, payload: SkipToPayload): Promise<Room> {
    const { data } = await this.http.post<Room>(`${BASE}/${id}/skip_to/`, payload)
    return data
  }

  async reorder(id: number, payload: ReorderPayload): Promise<Room> {
    const { data } = await this.http.post<Room>(`${BASE}/${id}/reorder/`, payload)
    return data
  }

  async message(id: number, payload: MessagePayload): Promise<Room> {
    const { data } = await this.http.post<Room>(`${BASE}/${id}/message/`, payload)
    return data
  }

  async emergency(id: number, payload: EmergencyPayload): Promise<Room> {
    const { data } = await this.http.post<Room>(`${BASE}/${id}/emergency/`, payload)
    return data
  }

  async poi(id: number, payload: PoiPayload): Promise<Room> {
    const { data } = await this.http.post<Room>(`${BASE}/${id}/poi/`, payload)
    return data
  }

  async getModeSwitchEligibility(id: number): Promise<ModeSwitchEligibility> {
    const { data } = await this.http.get<ModeSwitchEligibility>(
      `${BASE}/${id}/mode_switch_eligibility/`,
    )
    return data
  }
}
