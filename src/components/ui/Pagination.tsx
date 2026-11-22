import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useI18n } from '@/hooks/useI18n'
import { cn } from '@/utils/cn'

function pageList(page: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const set = new Set([1, total, page, page - 1, page + 1])
  const sorted = [...set].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)
  const out: (number | '…')[] = []
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push('…')
    out.push(p)
  })
  return out
}

export function Pagination({
  page,
  totalPages,
  onChange,
  totalItems,
  pageSize,
  className,
}: {
  page: number
  totalPages: number
  onChange: (p: number) => void
  totalItems?: number
  pageSize?: number
  className?: string
}) {
  const { t, formatNumber } = useI18n()
  const from = totalItems && pageSize ? (page - 1) * pageSize + 1 : 0
  const to = totalItems && pageSize ? Math.min(page * pageSize, totalItems) : 0

  return (
    <nav aria-label={t('Pagination', 'التنقل بين الصفحات')} className={cn('flex flex-col items-center justify-between gap-3 sm:flex-row', className)}>
      {totalItems !== undefined && pageSize ? (
        <p className="text-sm text-muted">
          {totalItems === 0
            ? t('No results', 'لا توجد نتائج')
            : t(`Showing ${formatNumber(from)}–${formatNumber(to)} of ${formatNumber(totalItems)}`, `عرض ${formatNumber(from)}–${formatNumber(to)} من ${formatNumber(totalItems)}`)}
        </p>
      ) : (
        <span />
      )}
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onChange(page - 1)}
            disabled={page <= 1}
            className="flex size-9 items-center justify-center rounded-lg border border-stone-line bg-white text-ink transition hover:bg-beige disabled:opacity-40"
            aria-label={t('Previous page', 'الصفحة السابقة')}
          >
            <ChevronLeft className="size-4 rtl:rotate-180" />
          </button>
          {pageList(page, totalPages).map((p, i) =>
            p === '…' ? (
              <span key={`e${i}`} className="px-1.5 text-muted">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onChange(p)}
                aria-current={p === page ? 'page' : undefined}
                className={cn(
                  'flex size-9 items-center justify-center rounded-lg text-sm font-medium transition',
                  p === page ? 'bg-forest text-paper' : 'text-ink hover:bg-beige',
                )}
              >
                {formatNumber(p)}
              </button>
            ),
          )}
          <button
            type="button"
            onClick={() => onChange(page + 1)}
            disabled={page >= totalPages}
            className="flex size-9 items-center justify-center rounded-lg border border-stone-line bg-white text-ink transition hover:bg-beige disabled:opacity-40"
            aria-label={t('Next page', 'الصفحة التالية')}
          >
            <ChevronRight className="size-4 rtl:rotate-180" />
          </button>
        </div>
      )}
    </nav>
  )
}
