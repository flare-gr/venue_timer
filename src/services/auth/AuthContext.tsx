import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { authService } from './AuthService'
import { tokenStorage } from './tokenStorage'

export interface AuthState {
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() =>
    authService.isAuthenticated(),
  )
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const scheduleRefresh = useCallback(() => {
    if (refreshTimerRef.current !== null) {
      clearTimeout(refreshTimerRef.current)
    }
    const expiresAt = tokenStorage.getExpiresAt()
    if (expiresAt === null) return
    const delay = expiresAt - Date.now() - 60_000
    if (delay <= 0) return
    refreshTimerRef.current = setTimeout(async () => {
      try {
        await authService.refreshTokens()
        setIsAuthenticated(true)
        scheduleRefresh()
      } catch {
        setIsAuthenticated(false)
      }
    }, delay)
  }, [])

  useEffect(() => {
    authService.setOnAuthFailure(() => setIsAuthenticated(false))
    if (authService.isAuthenticated()) scheduleRefresh()
    return () => {
      if (refreshTimerRef.current !== null) {
        clearTimeout(refreshTimerRef.current)
      }
    }
  }, [scheduleRefresh])

  const login = useCallback(
    async (username: string, password: string) => {
      await authService.login(username, password)
      setIsAuthenticated(true)
      scheduleRefresh()
    },
    [scheduleRefresh],
  )

  const logout = useCallback(() => {
    authService.logout()
    if (refreshTimerRef.current !== null) {
      clearTimeout(refreshTimerRef.current)
      refreshTimerRef.current = null
    }
    setIsAuthenticated(false)
  }, [])

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (ctx === null) {
    throw new Error('useAuth must be used within <AuthProvider>')
  }
  return ctx
}
