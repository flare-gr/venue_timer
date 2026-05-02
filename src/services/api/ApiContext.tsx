import { createContext, useContext, type ReactNode } from 'react'
import { authService } from '../auth/AuthService.ts'
import { ApiClient } from './ApiClient.ts'

const client = new ApiClient(authService.apiClient)

const ApiContext = createContext<ApiClient | null>(null)

export function ApiProvider({ children }: { children: ReactNode }) {
  return <ApiContext.Provider value={client}>{children}</ApiContext.Provider>
}

export function useApi(): ApiClient {
  const ctx = useContext(ApiContext)
  if (ctx === null) throw new Error('useApi must be used within <ApiProvider>')
  return ctx
}
