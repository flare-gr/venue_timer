/* eslint-disable react-refresh/only-export-components */
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { useEffect } from 'react'
import { clearAdminTheme } from '../../utils/adminTheme'

export const Route = createFileRoute('/display/_layout')({
  component: DisplayLayout,
})

function DisplayLayout() {
  useEffect(() => {
    // Clear any inline custom properties written by the admin theme
    clearAdminTheme()
    document.documentElement.setAttribute('data-theme', 'blackout')
    return () => {
      document.documentElement.removeAttribute('data-theme')
    }
  }, [])

  return <Outlet />
}
