import type { AxiosInstance } from 'axios'
import { RoomModule } from './modules/RoomModule.ts'
import { TimerModule } from './modules/TimerModule.ts'
import { RoomZoneModule, TimerZoneModule } from './modules/ZoneModule.ts'

export class ApiClient {
  readonly rooms: RoomModule
  readonly timers: TimerModule
  readonly roomZones: RoomZoneModule
  readonly timerZones: TimerZoneModule

  constructor(http: AxiosInstance) {
    this.rooms = new RoomModule(http)
    this.timers = new TimerModule(http)
    this.roomZones = new RoomZoneModule(http)
    this.timerZones = new TimerZoneModule(http)
  }
}
