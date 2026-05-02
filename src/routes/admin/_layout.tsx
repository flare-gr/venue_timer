/* eslint-disable react-refresh/only-export-components */
import { createFileRoute, Outlet, redirect, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { authService } from '../../services/auth'
import { useAuth } from '../../services/auth'

export const Route = createFileRoute('/admin/_layout')({
  beforeLoad: () => {
    if (!authService.isAuthenticated()) {
      throw redirect({ to: '/admin/login' })
    }
  },
  component: AdminLayout,
})

function AdminLayout() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    document.documentElement.dataset.theme = 'rehearsal'
    return () => {
      delete document.documentElement.dataset.theme
    }
  }, [])

  function handleLogout() {
    logout()
    void navigate({ to: '/admin/login' })
  }

  return (
    <div className="flex min-h-screen flex-col bg-cue-base">
      {/* Nav bar */}
      <header className="border-b border-cue-border bg-cue-surface">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">
          <div className="flex items-center gap-3">
            <span className="font-display text-xl leading-none tracking-[0.08em] text-cue-primary">
              VENUE TIMER
            </span>
            <span className="rounded border border-cue-border px-2 py-0.5 font-mono text-[10px] font-semibold tracking-widest text-cue-muted uppercase">
              Admin
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="font-mono text-xs text-cue-muted hover:text-[#FF2040] transition-colors duration-[120ms]"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
