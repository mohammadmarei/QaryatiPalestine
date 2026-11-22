import type { ReactNode } from 'react'
import { I18nProvider } from '@/i18n/I18nProvider'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { ToastProvider } from '@/components/feedback/ToastProvider'
import { DataProvider } from './DataProvider'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      <ToastProvider>
        <AuthProvider>
          <DataProvider>{children}</DataProvider>
        </AuthProvider>
      </ToastProvider>
    </I18nProvider>
  )
}
