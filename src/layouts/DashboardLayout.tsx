import { Suspense, useState } from 'react'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router'
import { DashboardSidebar } from '@/components/layout/DashboardSidebar'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { PageLoader } from '@/components/feedback/PageLoader'
import { useAuth } from '@/hooks/useAuth'
import { useI18n } from '@/hooks/useI18n'
import { useToast } from '@/hooks/useToast'

export function DashboardLayout() {
  const { user, logout } = useAuth()
  const { t } = useI18n()
  const toast = useToast()
  const location = useLocation()
  const navigate = useNavigate()
  const [navOpen, setNavOpen] = useState(false)

  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />

  const onLogout = () => {
    logout()
    toast.info(t('You have been logged out', 'تم تسجيل الخروج'), t('Your session on this device has ended.', 'انتهت جلستك على هذا الجهاز.'))
    navigate('/')
  }

  return (
    <div className="flex min-h-dvh bg-beige/60">
      <DashboardSidebar open={navOpen} onClose={() => setNavOpen(false)} onLogout={onLogout} />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader onMenu={() => setNavOpen(true)} onLogout={onLogout} />
        <main key={location.pathname} className="flex-1 animate-fade-in px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  )
}
