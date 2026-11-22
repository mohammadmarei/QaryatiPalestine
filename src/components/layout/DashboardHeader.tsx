import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { Bell, BellOff, ChevronDown, House, LogOut, Menu, Search, Settings, UserCircle } from 'lucide-react'
import { roleLabels } from '@/i18n/labels'
import { useAuth } from '@/hooks/useAuth'
import { useData } from '@/hooks/useData'
import { useI18n } from '@/hooks/useI18n'
import { cn } from '@/utils/cn'
import { storage } from '@/utils/storage'
import { EmptyState } from '../feedback/States'
import { Avatar, Popover } from '../ui/Misc'
import { LanguageToggle } from './PublicNavbar'

/** Ids of notifications the user has opened, so read state survives a reload. */
const READ_KEY = 'qaryati.notifications.read'

export function DashboardHeader({ onMenu, onLogout }: { onMenu: () => void; onLogout: () => void }) {
  const { t, pick, formatRelative } = useI18n()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [readIds, setReadIds] = useState<string[]>(() => storage.getJSON<string[]>(READ_KEY, []))
  const { submissions } = useData()
  // Notifications are the records waiting in the review queue, newest first (empty for roles without access).
  const items = submissions
    .filter((s) => s.status === 'pending')
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
    .slice(0, 8)
    .map((s) => ({
      id: `review-${s.id}`,
      title: { en: 'Awaiting review', ar: 'بانتظار المراجعة' },
      body: s.summary,
      at: s.submittedAt,
      read: readIds.includes(`review-${s.id}`),
      href: '/dashboard/reviews',
    }))
  const unread = items.filter((n) => !n.read).length

  const markRead = (ids: string[]) => {
    const next = [...new Set([...readIds, ...ids])]
    setReadIds(next)
    storage.setJSON(READ_KEY, next)
  }

  const onSearch = (e: FormEvent) => {
    e.preventDefault()
    navigate(`/dashboard/villages${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ''}`)
  }

  return (
    <header className="sticky top-0 z-[400] border-b border-stone-line bg-paper/90 backdrop-blur-md">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button type="button" onClick={onMenu} className="flex size-10 items-center justify-center rounded-xl text-ink hover:bg-beige lg:hidden" aria-label={t('Open navigation', 'فتح القائمة')}>
          <Menu className="size-5" />
        </button>

        <form onSubmit={onSearch} role="search" className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-muted" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('Search villages…', 'ابحث عن قرية…')}
            aria-label={t('Search villages', 'البحث عن القرى')}
            className="h-10 w-full rounded-xl border border-stone-line bg-white ps-9 pe-3 text-sm transition placeholder:text-muted/70 focus:border-olive-400 focus:ring-4 focus:ring-olive-100 focus:outline-none"
          />
        </form>

        <div className="ms-auto flex items-center gap-1">
          <Link
            to="/"
            className="inline-flex h-10 items-center gap-1.5 rounded-xl px-2.5 text-sm font-medium text-ink transition hover:bg-beige"
            aria-label={t('Home page', 'الصفحة الرئيسية')}
            title={t('Home page', 'الصفحة الرئيسية')}
          >
            <House className="size-5" aria-hidden />
            <span className="hidden md:inline">{t('Home', 'الرئيسية')}</span>
          </Link>
          <LanguageToggle className="hidden sm:inline-flex" />

          <Popover
            className="w-[min(22rem,calc(100vw-2rem))]"
            trigger={({ open, toggle }) => (
              <button
                type="button"
                onClick={toggle}
                aria-expanded={open}
                aria-haspopup="dialog"
                className="relative flex size-10 items-center justify-center rounded-xl text-ink transition hover:bg-beige"
                aria-label={t(`Notifications (${unread} unread)`, `الإشعارات (${unread} غير مقروءة)`)}
              >
                <Bell className="size-5" />
                {unread > 0 && <span className="absolute end-2 top-2 size-2 rounded-full bg-accent ring-2 ring-paper" />}
              </button>
            )}
          >
            {(close) => (
              <div>
                <div className="flex items-center justify-between border-b border-stone-line px-4 py-3">
                  <p className="text-sm font-semibold">{t('Notifications', 'الإشعارات')}</p>
                  {unread > 0 && (
                    <button type="button" onClick={() => markRead(items.map((n) => n.id))} className="text-xs font-medium text-olive hover:underline">
                      {t('Mark all as read', 'تحديد الكل كمقروء')}
                    </button>
                  )}
                </div>
                {items.length === 0 && <EmptyState icon={<BellOff className="size-6" />} title={t('No notifications yet', 'لا توجد إشعارات بعد')} className="py-8" />}
                <ul className="max-h-80 overflow-y-auto">
                  {items.map((n) => (
                    <li key={n.id}>
                      <Link
                        to={n.href}
                        onClick={() => {
                          markRead([n.id])
                          close()
                        }}
                        className="flex gap-3 px-4 py-3 transition hover:bg-beige/60"
                      >
                        <span className={cn('mt-1.5 size-2 shrink-0 rounded-full', n.read ? 'bg-transparent' : 'bg-accent')} />
                        <span className="min-w-0">
                          <span className={cn('block text-sm text-ink', n.read ? 'font-normal' : 'font-semibold')}>
                            {pick(n.title)}
                            {!n.read && <span className="sr-only"> ({t('unread', 'غير مقروء')})</span>}
                          </span>
                          <span className="block text-xs text-muted">{pick(n.body)}</span>
                          <span className="mt-1 block text-[0.7rem] text-muted/80">{formatRelative(n.at)}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Popover>

          {user && (
            <Popover
              className="w-60"
              trigger={({ open, toggle }) => (
                <button type="button" onClick={toggle} aria-expanded={open} aria-haspopup="menu" className="flex items-center gap-2 rounded-xl py-1 ps-1 pe-2 transition hover:bg-beige">
                  <Avatar name={user.name} size="sm" />
                  <span className="hidden text-start sm:block">
                    <span className="block text-sm leading-tight font-medium text-ink">{user.name}</span>
                    <span className="block text-xs leading-tight text-muted">{pick(roleLabels[user.role])}</span>
                  </span>
                  <ChevronDown className="size-4 text-muted" />
                </button>
              )}
            >
              {(close) => (
                <div role="menu" className="p-1.5">
                  <div className="px-3 py-2">
                    <p className="truncate text-sm font-medium">{user.name}</p>
                    <p className="truncate text-xs text-muted">{user.email}</p>
                  </div>
                  <div className="my-1 h-px bg-stone-line" />
                  <Link role="menuitem" to="/dashboard/profile" onClick={close} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-beige">
                    <UserCircle className="size-4 text-muted" /> {t('Profile', 'الملف الشخصي')}
                  </Link>
                  <Link role="menuitem" to="/dashboard/settings" onClick={close} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-beige">
                    <Settings className="size-4 text-muted" /> {t('Settings', 'الإعدادات')}
                  </Link>
                  <button
                    role="menuitem"
                    type="button"
                    onClick={() => {
                      close()
                      onLogout()
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-accent-dark hover:bg-accent-50"
                  >
                    <LogOut className="size-4 rtl:rotate-180" /> {t('Log out', 'تسجيل الخروج')}
                  </button>
                </div>
              )}
            </Popover>
          )}
        </div>
      </div>
    </header>
  )
}
