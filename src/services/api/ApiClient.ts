import type { AxiosInstance } from 'axios'
import { TimerModule } from './modules/TimerModule.ts'
import { ZoneModule } from './modules/ZoneModule.ts'

export class ApiClient {
  readonly timer: TimerModule
  readonly zones: ZoneModule

  constructor(http: AxiosInstance) {
    this.timer = new TimerModule(http)
    this.zones = new ZoneModule(http)
  }
}
