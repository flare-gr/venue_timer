/* eslint-disable react-refresh/only-export-components */
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../services/auth'
import { authService } from '../../services/auth'
import { applyAdminTheme, clearAdminTheme } from '../../utils/adminTheme'
import { LanguageSwitcher } from '../../components/admin/LanguageSwitcher'

export const Route = createFileRoute('/admin/login')({
  component: LoginPage,
})

function LoginPage() {
  const { t } = useTranslation(['admin', 'common'])
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    applyAdminTheme('light')
    if (authService.isAuthenticated()) {
      void navigate({ to: '/admin/rooms' })
    }
    return () => clearAdminTheme()
  }, [navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(username, password)
      await navigate({ to: '/admin/rooms' })
    } catch {
      setError(t('login.invalidCredentials'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-cue-base bg-dot-grid">
      {/* Vignette overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(14,32,72,0.08) 100%)',
        }}
      />

      <div className="w-full max-w-sm px-4 animate-fade-slide-up">
        {/* Card */}
        <div className="overflow-hidden rounded-lg border border-cue-border bg-cue-surface shadow-md">
          {/* Top accent bar */}
          <div className="h-1 w-full bg-cue-accent" />

          <div className="px-8 py-8">
            {/* Logo */}
            <div className="mb-8 text-center">
              <h1
                className="font-display text-4xl leading-none tracking-[0.08em] text-cue-primary"
              >
                {t('common:venueTimer')}
              </h1>
              <p className="mt-1.5 font-mono text-[10px] font-semibold tracking-[0.3em] text-cue-muted uppercase">
                {t('login.console')}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block font-mono text-[10px] font-semibold tracking-widest text-cue-muted uppercase">
                  {t('login.username')}
                </label>
                <input
                  type="text"
                  required
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded border border-cue-border bg-cue-base px-3 py-2.5 font-mono text-sm text-cue-primary placeholder:text-cue-muted/50 focus:border-cue-accent focus:outline-none transition-colors duration-[120ms]"
                  placeholder={t('login.usernamePlaceholder')}
                />
              </div>

              <div>
                <label className="mb-1.5 block font-mono text-[10px] font-semibold tracking-widest text-cue-muted uppercase">
                  {t('login.password')}
                </label>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded border border-cue-border bg-cue-base px-3 py-2.5 font-mono text-sm text-cue-primary placeholder:text-cue-muted/50 focus:border-cue-accent focus:outline-none transition-colors duration-[120ms]"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <p
                  className="rounded border border-[#FF2040]/30 bg-[#FF2040]/5 px-3 py-2 font-mono text-xs text-[#FF2040]"
                  role="alert"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || !username || !password}
                className="mt-2 w-full rounded bg-cue-accent py-3 font-display text-base tracking-[0.12em] text-white hover:bg-[#0044AA] disabled:opacity-50 transition-colors duration-[120ms]"
              >
                {loading ? t('login.signingIn') : t('login.signIn')}
              </button>
            </form>
          </div>
        </div>

        <div className="mt-4 flex flex-col items-center gap-3">
          <LanguageSwitcher />
          <p className="text-center font-mono text-[10px] text-cue-muted/60 tracking-wider">
            {t('login.footer')}
          </p>
        </div>
      </div>
    </div>
  )
}
