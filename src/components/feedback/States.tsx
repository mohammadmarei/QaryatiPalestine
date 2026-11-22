import type { ReactNode } from 'react'
import { CloudOff, Inbox, RefreshCw, ShieldAlert } from 'lucide-react'
import { useI18n } from '@/hooks/useI18n'
import { cn } from '@/utils/cn'
import { Button, ButtonLink } from '../ui/Button'

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-xl', className)} aria-hidden />
}

export function CardSkeleton() {
  return (
    <div className="card overflow-hidden" aria-hidden>
      <Skeleton className="aspect-[4/3] rounded-none" />
      <div className="space-y-3 p-5">
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>
    </div>
  )
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2 p-4" aria-hidden>
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  )
}

export function EmptyState({ title, description, action, icon, className }: { title: string; description?: string; action?: ReactNode; icon?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
      <div className="relative mb-5">
        <span className="flex size-16 items-center justify-center rounded-full bg-accent-50 text-forest">{icon ?? <Inbox className="size-7" />}</span>
      </div>
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

/** Shown when the signed-in role is not expected to use a dashboard area. */
export function RestrictedState({ className }: { className?: string }) {
  const { t } = useI18n()
  return (
    <div className={cn('card', className)}>
      <EmptyState
        icon={<ShieldAlert className="size-7" />}
        title={t('Administrators only', 'للمسؤولين فقط')}
        description={t('This area is reserved for administrator accounts. Ask an administrator if you need access.', 'هذا القسم مخصّص لحسابات مدير النظام. تواصل مع مدير النظام إذا احتجت إلى الوصول.')}
        action={
          <ButtonLink to="/dashboard" variant="outline">
            {t('Back to dashboard', 'العودة إلى لوحة التحكم')}
          </ButtonLink>
        }
      />
    </div>
  )
}

export function ErrorState({ title, description, onRetry, className }: { title?: string; description?: string; onRetry?: () => void; className?: string }) {
  const { t } = useI18n()
  return (
    <div role="alert" className={cn('flex flex-col items-center justify-center rounded-[14px] border border-danger/20 bg-danger-50/60 px-6 py-12 text-center', className)}>
      <span className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-white text-danger ring-1 ring-danger/20">
        <CloudOff className="size-6" />
      </span>
      <h3 className="text-base font-semibold text-ink">{title ?? t('Something went wrong', 'حدث خطأ ما')}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-muted">{description ?? t('The content could not be loaded. Please try again.', 'تعذّر تحميل المحتوى. يرجى المحاولة مرة أخرى.')}</p>
      {onRetry && (
        <Button variant="outline" className="mt-5" onClick={onRetry} icon={<RefreshCw className="size-4" />}>
          {t('Try again', 'إعادة المحاولة')}
        </Button>
      )}
    </div>
  )
}
