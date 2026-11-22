import { Suspense } from 'react'
import { Link, Outlet, useLocation } from 'react-router'
import { ChevronRight } from 'lucide-react'
import { images } from '@/data/images'
import { Logo } from '@/components/brand/Logo'
import { LanguageToggle } from '@/components/layout/PublicNavbar'
import { PageLoader } from '@/components/feedback/PageLoader'
import { useI18n } from '@/hooks/useI18n'

/** Split layout: a photo with a quote on one side, the form on the other. */
export function AuthLayout() {
  const { t } = useI18n()
  const location = useLocation()
  return (
    <div className="grid min-h-dvh bg-white lg:grid-cols-[1fr_1fr]">
      <aside className="relative hidden overflow-hidden lg:block">
        <img src={images.hero} alt={t('A Palestinian village', 'قرية فلسطينية')} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(6,33,29,.95),rgba(6,33,29,.35))]" aria-hidden />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <Logo inverted />
          <figure>
            <blockquote className="text-4xl leading-snug font-bold">
              {t('“The land speaks Arabic,', '“الأرض بتتكلم عربي،')}
              <br />
              {t('and its stories are a trust.”', 'وحكاياتها أمانة.”')}
            </blockquote>
            <figcaption className="mt-4 text-[#c3d1ce]">{t('Together we keep the memory of place for generations to come.', 'معاً نحفظ ذاكرة المكان للأجيال القادمة.')}</figcaption>
          </figure>
        </div>
      </aside>

      <div className="flex flex-col px-5 py-6 sm:px-12">
        <div className="flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-1.5 text-[13px] font-bold text-muted transition hover:text-forest">
            <ChevronRight className="size-4 ltr:rotate-180" aria-hidden />
            {t('Back to home', 'العودة إلى الرئيسية')}
          </Link>
          <LanguageToggle />
        </div>
        <main key={location.pathname} className="mx-auto flex w-full max-w-[420px] flex-1 animate-fade-up flex-col justify-center py-10">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  )
}
