import { NavLink } from 'react-router'
import {
  BookOpen,
  ClipboardCheck,
  Globe,
  Landmark,
  LayoutDashboard,
  LibraryBig,
  LogOut,
  MapPinned,
  ScrollText,
  Settings,
  UserCircle,
  Users,
  UsersRound,
  X,
} from 'lucide-react'
import { useI18n } from '@/hooks/useI18n'
import { useAuth } from '@/hooks/useAuth'
import { useData } from '@/hooks/useData'
import { can } from '@/features/auth/permissions'
import { cn } from '@/utils/cn'
import { Logo } from '../brand/Logo'

export function DashboardSidebar({ open, onClose, onLogout }: { open: boolean; onClose: () => void; onLogout: () => void }) {
  const { t } = useI18n()
  const { submissions } = useData()
  const { user } = useAuth()
  const pending = submissions.filter((s) => s.status === 'pending').length

  const groups = [
    {
      label: t('Overview', 'نظرة عامة'),
      items: [{ to: '/dashboard', label: t('Dashboard', 'لوحة التحكم'), icon: LayoutDashboard, end: true }],
    },
    {
      label: t('Content', 'المحتوى'),
      items: [
        { to: '/dashboard/villages', label: t('Villages', 'القرى'), icon: MapPinned },
        { to: '/dashboard/population', label: t('Population', 'السكان'), icon: UsersRound },
        { to: '/dashboard/heritage', label: t('History & Heritage', 'التاريخ والتراث'), icon: Landmark },
        { to: '/dashboard/sources', label: t('Sources', 'المصادر'), icon: LibraryBig },
      ],
    },
    {
      label: t('Workflow', 'سير العمل'),
      items: [{ to: '/dashboard/reviews', label: t('Review & Verification', 'المراجعة والتحقق'), icon: ClipboardCheck, badge: pending }],
    },
    {
      label: t('Administration', 'الإدارة'),
      items: [
        ...(can.manageUsers(user?.role) ? [{ to: '/dashboard/users', label: t('Users', 'المستخدمون'), icon: Users }] : []),
        ...(can.viewAuditLogs(user?.role) ? [{ to: '/dashboard/audit-logs', label: t('Audit logs', 'سجل النشاط'), icon: ScrollText }] : []),
      ],
    },
    {
      label: t('Account', 'الحساب'),
      items: [
        { to: '/dashboard/profile', label: t('Profile', 'الملف الشخصي'), icon: UserCircle },
        { to: '/dashboard/settings', label: t('Settings', 'الإعدادات'), icon: Settings },
      ],
    },
  ]

  return (
    <>
      {open && <div className="fixed inset-0 z-[600] animate-fade-in bg-charcoal/50 lg:hidden" onClick={onClose} aria-hidden />}
      <aside
        className={cn(
          'fixed inset-y-0 start-0 z-[700] flex w-72 flex-col overflow-hidden bg-forest text-limestone transition-transform duration-300 lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full lg:rtl:translate-x-0',
        )}
        aria-label={t('Dashboard navigation', 'تنقل لوحة التحكم')}
      >
        <div className="pointer-events-none absolute inset-0 bg-dots-light opacity-50" aria-hidden />
        <div className="relative flex h-18 items-center justify-between px-5">
          <Logo inverted to="/dashboard" />
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-limestone/70 hover:bg-white/10 lg:hidden" aria-label={t('Close navigation', 'إغلاق القائمة')}>
            <X className="size-5" />
          </button>
        </div>

        <nav className="scrollbar-thin relative flex-1 space-y-6 overflow-y-auto px-3 py-5">
          {groups.filter((g) => g.items.length > 0).map((g) => (
            <div key={g.label}>
              <p className="px-3 pb-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-gold/80 rtl:tracking-normal rtl:text-xs">{g.label}</p>
              <ul className="space-y-0.5">
                {g.items.map((it) => (
                  <li key={it.to}>
                    <NavLink
                      to={it.to}
                      end={'end' in it ? it.end : false}
                      onClick={onClose}
                      className={({ isActive }) =>
                        cn(
                          'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition',
                          isActive ? 'bg-white/[0.09] font-medium text-white' : 'text-limestone/75 hover:bg-white/5 hover:text-white',
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && <span className="absolute inset-y-2 start-0 w-0.5 rounded-full bg-gold" aria-hidden />}
                          <it.icon className={cn('size-[1.15rem] shrink-0', isActive ? 'text-gold' : 'text-limestone/60 group-hover:text-limestone')} aria-hidden />
                          <span className="flex-1">{it.label}</span>
                          {'badge' in it && it.badge ? (
                            <span className="rounded-full bg-accent px-1.5 py-0.5 text-[0.65rem] font-semibold leading-none text-white">{it.badge}</span>
                          ) : null}
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="relative space-y-1 border-t border-white/10 p-3">
          <NavLink to="/" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-limestone/75 transition hover:bg-white/5 hover:text-white">
            <Globe className="size-[1.15rem]" aria-hidden />
            {t('View public site', 'عرض الموقع العام')}
          </NavLink>
          <NavLink to="/about" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-limestone/75 transition hover:bg-white/5 hover:text-white">
            <BookOpen className="size-[1.15rem]" aria-hidden />
            {t('Documentation method', 'منهجية التوثيق')}
          </NavLink>
          <button type="button" onClick={onLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-limestone/75 transition hover:bg-white/5 hover:text-white">
            <LogOut className="size-[1.15rem] rtl:rotate-180" aria-hidden />
            {t('Log out', 'تسجيل الخروج')}
          </button>
        </div>
      </aside>
    </>
  )
}
