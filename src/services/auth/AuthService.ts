import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios'
import { tokenStorage } from './tokenStorage'

import { config } from '../../config'

const BASE_URL = config.apiBaseUrl

interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

class AuthService {
  readonly apiClient: AxiosInstance
  private readonly authClient: AxiosInstance
  private isRefreshing = false
  private refreshQueue: Array<(token: string) => void> = []
  private onAuthFailure: (() => void) | null = null

  constructor() {
    this.authClient = axios.create({
      baseURL: BASE_URL,
      headers: { 'Content-Type': 'application/json' },
    })

    this.apiClient = axios.create({
      baseURL: BASE_URL,
      headers: { 'Content-Type': 'application/json' },
    })

    this.apiClient.interceptors.request.use((config) => {
      const token = tokenStorage.getAccessToken()
      if (token) config.headers.Authorization = `Bearer ${token}`
      return config
    })

    this.apiClient.interceptors.response.use(
      (res) => res,
      async (error: unknown) => {
        const axiosError = error as {
          response?: { status: number }
          config: RetryConfig
        }
        const original = axiosError.config

        if (axiosError.response?.status === 401 && !original._retry) {
          original._retry = true

          if (!this.isRefreshing) {
            this.isRefreshing = true
            try {
              await this.refreshTokens()
              const newToken = tokenStorage.getAccessToken()!
              this.refreshQueue.forEach((cb) => cb(newToken))
              this.refreshQueue = []
            } catch {
              tokenStorage.clearTokens()
              this.onAuthFailure?.()
              return Promise.reject(error)
            } finally {
              this.isRefreshing = false
            }
          }

          return new Promise((resolve) => {
            this.refreshQueue.push((token) => {
              original.headers.Authorization = `Bearer ${token}`
              resolve(this.apiClient(original))
            })
          })
        }

        return Promise.reject(error)
      },
    )
  }

  setOnAuthFailure(handler: () => void): void {
    this.onAuthFailure = handler
  }

  async login(username: string, password: string): Promise<void> {
    const { data } = await this.authClient.post<{
      access: string
      refresh: string
    }>('/api/auth/token/', { username, password })
    tokenStorage.setTokens(data.access, data.refresh)
  }

  logout(): void {
    tokenStorage.clearTokens()
  }

  async refreshTokens(): Promise<void> {
    const refresh = tokenStorage.getRefreshToken()
    if (!refresh) throw new Error('No refresh token available')
    const { data } = await this.authClient.post<{ access: string }>(
      '/api/auth/token/refresh/',
      { refresh },
    )
    tokenStorage.updateAccessToken(data.access)
  }

  isAuthenticated(): boolean {
    return tokenStorage.getAccessToken() !== null
  }

  getExpiresAt(): number | null {
    return tokenStorage.getExpiresAt()
  }
}

export const authService = new AuthService()
