import { useMemo, useState, type ReactNode } from 'react'
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import { useI18n } from '@/hooks/useI18n'
import { cn } from '@/utils/cn'
import { paginate } from '@/utils/misc'
import { readSettings } from '@/features/settings/settingsStore'
import { Pagination } from '../ui/Pagination'
import { EmptyState, TableSkeleton } from '../feedback/States'

export interface Column<T> {
  key: string
  header: ReactNode
  cell: (row: T) => ReactNode
  /** Providing a sort value makes the column sortable. */
  sortValue?: (row: T) => string | number
  className?: string
  headerClassName?: string
}

type SortState = { key: string; dir: 'asc' | 'desc' } | null

export function DataTable<T>({
  rows,
  columns,
  rowKey,
  pageSize: pageSizeProp,
  initialSort = null,
  loading,
  emptyTitle,
  emptyDescription,
  emptyAction,
  caption,
  resetPageKey,
}: {
  rows: T[]
  columns: Column<T>[]
  rowKey: (row: T) => string
  pageSize?: number
  initialSort?: SortState
  loading?: boolean
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: ReactNode
  caption: string
  /** Changing this value (e.g. the filters) returns to page 1. */
  resetPageKey?: string
}) {
  const { t, lang } = useI18n()
  const [pageSize] = useState(() => pageSizeProp ?? readSettings().pageSize)
  const [sort, setSort] = useState<SortState>(initialSort)
  const [page, setPage] = useState(1)

  // Return to the first page whenever the filters change.
  const [lastResetKey, setLastResetKey] = useState(resetPageKey)
  if (resetPageKey !== lastResetKey) {
    setLastResetKey(resetPageKey)
    setPage(1)
  }

  const sorted = useMemo(() => {
    if (!sort) return rows
    const col = columns.find((c) => c.key === sort.key)
    if (!col?.sortValue) return rows
    const get = col.sortValue
    const collator = new Intl.Collator(lang, { numeric: true, sensitivity: 'base' })
    return [...rows].sort((a, b) => {
      const va = get(a)
      const vb = get(b)
      const r = typeof va === 'number' && typeof vb === 'number' ? va - vb : collator.compare(String(va), String(vb))
      return sort.dir === 'asc' ? r : -r
    })
  }, [rows, sort, columns, lang])

  const { items, totalPages, page: current } = paginate(sorted, page, pageSize)

  const toggleSort = (key: string) =>
    setSort((s) => (s?.key === key ? (s.dir === 'asc' ? { key, dir: 'desc' } : null) : { key, dir: 'asc' }))

  return (
    <div>
      <div className="scrollbar-thin overflow-x-auto">
        <table className="w-full min-w-[720px] border-separate border-spacing-0 text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              {columns.map((c) => {
                const active = sort?.key === c.key
                return (
                  <th
                    key={c.key}
                    scope="col"
                    aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}
                    className={cn('sticky top-0 border-b border-stone-line bg-beige/70 px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-muted rtl:tracking-normal', c.headerClassName)}
                  >
                    {c.sortValue ? (
                      <button type="button" onClick={() => toggleSort(c.key)} className="inline-flex items-center gap-1 transition hover:text-ink">
                        {c.header}
                        {active ? sort.dir === 'asc' ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" /> : <ChevronsUpDown className="size-3.5 opacity-50" />}
                      </button>
                    ) : (
                      c.header
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          {!loading && (
            <tbody>
              {items.map((row) => (
                <tr key={rowKey(row)} className="group transition-colors hover:bg-beige/40">
                  {columns.map((c) => (
                    <td key={c.key} className={cn('border-b border-stone-line/70 px-4 py-3.5 align-middle', c.className)}>
                      {c.cell(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          )}
        </table>
        {loading && <TableSkeleton />}
        {!loading && rows.length === 0 && <EmptyState title={emptyTitle ?? t('No records found', 'لا توجد سجلات')} description={emptyDescription} action={emptyAction} />}
      </div>
      {!loading && rows.length > 0 && (
        <div className="border-t border-stone-line px-4 py-3">
          <Pagination page={current} totalPages={totalPages} onChange={setPage} totalItems={rows.length} pageSize={pageSize} />
        </div>
      )}
    </div>
  )
}
