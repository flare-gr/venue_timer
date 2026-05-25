/* eslint-disable react-refresh/only-export-components */
import { createFileRoute, Outlet, redirect, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { authService } from '../../services/auth'
import { useAuth } from '../../services/auth'
import { useAdminThemeStore } from '../../store/themeStore'
import { applyAdminTheme, clearAdminTheme } from '../../utils/adminTheme'
import { LanguageSwitcher } from '../../components/admin/LanguageSwitcher'

export const Route = createFileRoute('/admin/_layout')({
  beforeLoad: () => {
    if (!authService.isAuthenticated()) {
      throw redirect({ to: '/admin/login' })
    }
  },
  component: AdminLayout,
})

function AdminLayout() {
  const { t } = useTranslation(['admin', 'common'])
  const { logout } = useAuth()
  const navigate = useNavigate()
  const { theme, toggle } = useAdminThemeStore()

  useEffect(() => {
    applyAdminTheme(theme)
  }, [theme])

  useEffect(() => {
    return () => clearAdminTheme()
  }, [])

  function handleLogout() {
    logout()
    void navigate({ to: '/admin/login' })
  }

  const isLight = theme === 'light'

  return (
    <div className="flex min-h-screen flex-col bg-cue-base">
      <header className="border-b border-cue-border bg-cue-surface">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">
          <div className="flex items-center gap-3">
            <span className="font-display text-xl leading-none tracking-[0.08em] text-cue-primary">
              {t('common:venueTimer')}
            </span>
            <span className="rounded border border-cue-border px-2 py-0.5 font-mono text-[10px] font-semibold tracking-widest text-cue-muted uppercase">
              {t('header.admin')}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <LanguageSwitcher />

            {/* Theme toggle */}
            <button
              type="button"
              onClick={toggle}
              title={isLight ? t('header.switchToDark') : t('header.switchToLight')}
              className="flex items-center gap-1.5 rounded border border-cue-border px-2.5 py-1 font-mono text-[10px] font-semibold tracking-widest text-cue-muted uppercase hover:border-cue-accent hover:text-cue-accent transition-colors duration-[120ms]"
            >
              <span>{isLight ? '☾' : '☀'}</span>
              <span>{isLight ? t('header.dark') : t('header.light')}</span>
            </button>

            <button
              onClick={handleLogout}
              className="font-mono text-xs text-cue-muted hover:text-[#FF2040] transition-colors duration-[120ms]"
            >
              {t('header.signOut')}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
