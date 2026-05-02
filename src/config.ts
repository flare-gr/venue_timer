const rawHost = (import.meta.env.VITE_API_HOST as string | undefined) ?? 'localhost:8000'

// Accept either a bare host ("localhost:8000") or a full URL ("http://localhost:8000")
const apiBaseUrl = rawHost.startsWith('http') ? rawHost : `http://${rawHost}`
const wsBaseUrl = apiBaseUrl.replace(/^http/, 'ws')

export const config = {
  apiBaseUrl,
  wsBaseUrl,
} as const
