import { create } from 'zustand'

export type WsStatus = 'connecting' | 'connected' | 'disconnected'

interface WsStore {
  statuses: Record<number, WsStatus>
  setStatus: (roomId: number, status: WsStatus) => void
}

export const useWsStore = create<WsStore>()((set) => ({
  statuses: {},
  setStatus: (roomId, status) =>
    set((state) => ({ statuses: { ...state.statuses, [roomId]: status } })),
}))
