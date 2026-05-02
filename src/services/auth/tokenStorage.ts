const KEYS = {
  ACCESS: 'auth_access_token',
  REFRESH: 'auth_refresh_token',
  EXPIRES_AT: 'auth_expires_at',
} as const

function decodeExp(token: string): number {
  const payload = JSON.parse(atob(token.split('.')[1])) as { exp: number }
  return payload.exp * 1000
}

export const tokenStorage = {
  getAccessToken(): string | null {
    return localStorage.getItem(KEYS.ACCESS)
  },

  getRefreshToken(): string | null {
    return localStorage.getItem(KEYS.REFRESH)
  },

  getExpiresAt(): number | null {
    const v = localStorage.getItem(KEYS.EXPIRES_AT)
    return v !== null ? parseInt(v, 10) : null
  },

  setTokens(access: string, refresh: string): void {
    localStorage.setItem(KEYS.ACCESS, access)
    localStorage.setItem(KEYS.REFRESH, refresh)
    localStorage.setItem(KEYS.EXPIRES_AT, String(decodeExp(access)))
  },

  updateAccessToken(access: string): void {
    localStorage.setItem(KEYS.ACCESS, access)
    localStorage.setItem(KEYS.EXPIRES_AT, String(decodeExp(access)))
  },

  clearTokens(): void {
    localStorage.removeItem(KEYS.ACCESS)
    localStorage.removeItem(KEYS.REFRESH)
    localStorage.removeItem(KEYS.EXPIRES_AT)
  },
}
