import { create } from 'zustand'

export type WsStatus = 'connecting' | 'connected' | 'disconnected'

interface WsStore {
  statuses: Record<number, WsStatus>
  setStatus: (timerId: number, status: WsStatus) => void
}

export const useWsStore = create<WsStore>()((set) => ({
  statuses: {},
  setStatus: (timerId, status) =>
    set((state) => ({ statuses: { ...state.statuses, [timerId]: status } })),
}))
