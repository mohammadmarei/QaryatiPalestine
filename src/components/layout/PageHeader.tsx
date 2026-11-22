import type { ReactNode } from 'react'
import { useI18n } from '@/hooks/useI18n'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { Breadcrumbs, type Crumb } from '../ui/Misc'

/** Dashboard page heading: breadcrumbs, title, description and actions. */
export function PageHeader({ title, description, crumbs, actions }: { title: string; description?: ReactNode; crumbs?: Crumb[]; actions?: ReactNode }) {
  const { t } = useI18n()
  useDocumentTitle(title)
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        <Breadcrumbs items={[{ label: t('Dashboard', 'لوحة التحكم'), to: '/dashboard' }, ...(crumbs ?? [{ label: title }])]} className="mb-2" />
        <h1 className="text-2xl font-bold text-forest sm:text-[28px]">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-muted sm:text-base">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
