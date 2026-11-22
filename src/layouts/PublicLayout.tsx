import { Suspense } from 'react'
import { Outlet, useLocation } from 'react-router'
import { PublicNavbar } from '@/components/layout/PublicNavbar'
import { PublicFooter } from '@/components/layout/PublicFooter'
import { PageLoader } from '@/components/feedback/PageLoader'
import { useI18n } from '@/hooks/useI18n'

export function PublicLayout() {
  const location = useLocation()
  const { t } = useI18n()
  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[999] focus:rounded-lg focus:bg-forest focus:px-4 focus:py-2 focus:text-paper">
        {t('Skip to content', 'انتقل إلى المحتوى')}
      </a>
      <PublicNavbar />
      <main id="main" key={location.pathname} className="flex-1 animate-fade-in">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
      {location.pathname !== '/map' && <PublicFooter />}
    </div>
  )
}
