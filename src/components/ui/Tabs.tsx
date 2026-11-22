import { useRef, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from '@/utils/cn'

export interface TabItem<K extends string> {
  key: K
  label: ReactNode
  icon?: ReactNode
  count?: number
}

/** Roving-tabindex tablist; arrow keys move between tabs (direction-aware). */
export function Tabs<K extends string>({
  items,
  value,
  onChange,
  className,
  variant = 'underline',
  idPrefix = 'tab',
}: {
  items: TabItem<K>[]
  value: K
  onChange: (k: K) => void
  className?: string
  variant?: 'underline' | 'pill'
  idPrefix?: string
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  const onKey = (e: KeyboardEvent, i: number) => {
    const rtl = document.documentElement.dir === 'rtl'
    const nextKey = rtl ? 'ArrowLeft' : 'ArrowRight'
    const prevKey = rtl ? 'ArrowRight' : 'ArrowLeft'
    let n = -1
    if (e.key === nextKey) n = (i + 1) % items.length
    if (e.key === prevKey) n = (i - 1 + items.length) % items.length
    if (e.key === 'Home') n = 0
    if (e.key === 'End') n = items.length - 1
    if (n >= 0) {
      e.preventDefault()
      onChange(items[n].key)
      refs.current[n]?.focus()
    }
  }

  return (
    <div
      role="tablist"
      className={cn(
        'no-scrollbar flex gap-1 overflow-x-auto',
        variant === 'underline' ? 'border-b border-stone-line' : 'rounded-2xl bg-beige p-1',
        className,
      )}
    >
      {items.map((it, i) => {
        const active = it.key === value
        return (
          <button
            key={it.key}
            ref={(el) => {
              refs.current[i] = el
            }}
            id={`${idPrefix}-${it.key}`}
            role="tab"
            type="button"
            aria-selected={active}
            aria-controls={`${idPrefix}-panel-${it.key}`}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(it.key)}
            onKeyDown={(e) => onKey(e, i)}
            className={cn(
              'relative inline-flex shrink-0 items-center gap-2 whitespace-nowrap text-sm font-medium transition',
              variant === 'underline'
                ? cn('px-3.5 py-3', active ? 'text-forest' : 'text-muted hover:text-ink')
                : cn('rounded-xl px-3.5 py-2', active ? 'bg-white text-forest shadow-soft' : 'text-muted hover:text-ink'),
            )}
          >
            {it.icon}
            {it.label}
            {typeof it.count === 'number' && (
              <span className={cn('rounded-full px-1.5 text-xs', active ? 'bg-olive-50 text-olive' : 'bg-beige text-muted')}>{it.count}</span>
            )}
            {variant === 'underline' && active && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-accent" />}
          </button>
        )
      })}
    </div>
  )
}

export function TabPanel({ id, idPrefix = 'tab', children, className }: { id: string; idPrefix?: string; children: ReactNode; className?: string }) {
  return (
    <div role="tabpanel" id={`${idPrefix}-panel-${id}`} aria-labelledby={`${idPrefix}-${id}`} className={cn('animate-fade-in', className)}>
      {children}
    </div>
  )
}
