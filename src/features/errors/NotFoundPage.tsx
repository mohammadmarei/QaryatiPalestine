import { Compass, Home } from 'lucide-react'
import { ButtonLink } from '@/components/ui/Button'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useI18n } from '@/hooks/useI18n'
import { cn, container } from '@/utils/cn'

export function NotFoundPage() {
  const { t } = useI18n()
  useDocumentTitle(t('Page not found', 'الصفحة غير موجودة'))
  return (
    <section className={cn(container, 'flex flex-col items-center py-28 text-center')}>
      <span className="grid size-16 place-items-center rounded-full bg-accent-50 text-forest">
        <Compass className="size-8" aria-hidden />
      </span>
      <p className="mt-6 font-latin text-sm font-bold text-accent-dark">404</p>
      <h1 className="mt-2 text-4xl font-bold text-forest">{t('This page could not be found', 'لم نجد هذه الصفحة')}</h1>
      <p className="mt-3 max-w-md text-muted">{t('The page you are looking for does not exist or has moved. Every village, though, is only a search away.', 'الصفحة التي تبحث عنها غير موجودة أو نُقلت. لكن كل قرية على بُعد بحث واحد.')}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        <ButtonLink to="/" icon={<Home className="size-4" />}>
          {t('Back home', 'العودة للرئيسية')}
        </ButtonLink>
        <ButtonLink to="/villages" variant="secondary">
          {t('Explore villages', 'استكشف القرى')}
        </ButtonLink>
      </div>
    </section>
  )
}
