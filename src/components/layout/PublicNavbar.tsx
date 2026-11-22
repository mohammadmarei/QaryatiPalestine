import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { NavLink, useLocation } from 'react-router'
import { Globe, LayoutDashboard, Menu, X } from 'lucide-react'
import { useI18n } from '@/hooks/useI18n'
import { useAuth } from '@/hooks/useAuth'
import { cn, container } from '@/utils/cn'
import { Logo } from '../brand/Logo'
import { ButtonLink } from '../ui/Button'

export function LanguageToggle({ className, tone = 'default' }: { className?: string; tone?: 'default' | 'light' }) {
  const { lang, toggleLang } = useI18n()
  return (
    <button
      type="button"
      onClick={toggleLang}
      className={cn(
        'inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium transition',
        tone === 'light' ? 'text-limestone hover:bg-white/10' : 'text-muted hover:bg-beige hover:text-forest',
        className,
      )}
      aria-label={lang === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
    >
      <Globe className="size-[17px]" aria-hidden />
      <span className={lang === 'ar' ? 'font-latin' : 'font-arabic'}>{lang === 'ar' ? 'EN' : 'ع'}</span>
    </button>
  )
}

export function PublicNavbar() {
  const { t } = useI18n()
  const { user } = useAuth()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const [lastPath, setLastPath] = useState(pathname)

  // Close the mobile menu whenever the route changes.
  if (pathname !== lastPath) {
    setLastPath(pathname)
    setOpen(false)
  }

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const links = [
    { to: '/', label: t('Home', 'الرئيسية'), end: true },
    { to: '/villages', label: t('Villages', 'القرى') },
    { to: '/map', label: t('Map', 'الخريطة') },
    { to: '/about', label: t('About', 'عن قريتي') },
  ]

  return (
    <header className="sticky top-0 z-[500] h-[78px] border-b border-stone-line bg-white/[0.97] backdrop-blur-md">
      <div className={cn(container, 'flex h-full items-center justify-between gap-9')}>
        <Logo />

        <nav aria-label={t('Main', 'القائمة الرئيسية')} className="me-auto hidden h-full items-center gap-8 lg:flex">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                cn(
                  'group relative flex h-full items-center text-sm font-semibold transition-colors',
                  isActive ? 'text-forest' : 'text-[#475569] hover:text-forest',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {l.label}
                  <span className={cn('absolute -bottom-px h-0.5 bg-accent transition-all duration-200', isActive ? 'inset-x-0' : 'inset-x-1/2 group-hover:inset-x-0')} aria-hidden />
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <LanguageToggle />
          {user ? (
            <ButtonLink to="/dashboard" icon={<LayoutDashboard className="size-4" />}>
              {t('Dashboard', 'لوحة التحكم')}
            </ButtonLink>
          ) : (
            <>
              <ButtonLink to="/login" variant="secondary">
                {t('Sign in', 'تسجيل الدخول')}
              </ButtonLink>
              <ButtonLink to="/register">{t('Register', 'إنشاء حساب')}</ButtonLink>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 lg:hidden">
          <LanguageToggle />
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="flex size-10 items-center justify-center rounded-lg text-forest transition hover:bg-beige"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? t('Close menu', 'إغلاق القائمة') : t('Open menu', 'فتح القائمة')}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/*
        Rendered into <body>: the header's backdrop blur makes it the containing
        block for fixed children, which squeezed this panel to zero height.
      */}
      {open &&
        createPortal(
        <div id="mobile-menu" className="fixed inset-x-0 top-[78px] bottom-0 z-[500] flex animate-fade-in flex-col overflow-y-auto bg-white lg:hidden">
          <nav aria-label={t('Mobile', 'قائمة الجوال')} className="flex flex-col px-5 py-3">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) => cn('border-b border-stone-line py-4 text-base font-semibold', isActive ? 'text-accent-dark' : 'text-forest')}
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-auto grid gap-2 border-t border-stone-line bg-paper p-5">
            {user ? (
              <ButtonLink to="/dashboard" icon={<LayoutDashboard className="size-4" />}>
                {t('Go to dashboard', 'الذهاب إلى لوحة التحكم')}
              </ButtonLink>
            ) : (
              <>
                <ButtonLink to="/register">{t('Create an account', 'إنشاء حساب')}</ButtonLink>
                <ButtonLink to="/login" variant="secondary">
                  {t('Sign in', 'تسجيل الدخول')}
                </ButtonLink>
              </>
            )}
          </div>
        </div>,
          document.body,
        )}
    </header>
  )
}
