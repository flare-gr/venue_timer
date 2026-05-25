import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { I18nextProvider } from 'react-i18next'
import './index.css'
import i18n from './services/i18n'
import { AuthProvider } from './services/auth'
import { ApiProvider } from './services/api'
import { routeTree } from './routeTree.gen'

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nextProvider i18n={i18n}>
      <AuthProvider>
        <ApiProvider>
          <RouterProvider router={router} />
        </ApiProvider>
      </AuthProvider>
    </I18nextProvider>
  </StrictMode>,
)
