import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { ChevronRight, Search, X } from 'lucide-react'
import { useI18n } from '@/hooks/useI18n'
import { cn } from '@/utils/cn'
import { initials } from '@/utils/misc'

export interface Crumb {
  label: string
  to?: string
}

export function Breadcrumbs({ items, className, tone = 'default' }: { items: Crumb[]; className?: string; tone?: 'default' | 'light' }) {
  const { t } = useI18n()
  return (
    <nav aria-label={t('Breadcrumb', 'مسار التنقل')} className={className}>
      <ol className="flex flex-wrap items-center gap-1.5 text-sm">
        {items.map((c, i) => {
          const last = i === items.length - 1
          return (
            <li key={`${c.label}-${i}`} className="flex items-center gap-1.5">
              {c.to && !last ? (
                <Link to={c.to} className={cn('transition', tone === 'light' ? 'text-limestone/75 hover:text-white' : 'text-muted hover:text-forest')}>
                  {c.label}
                </Link>
              ) : (
                <span aria-current={last ? 'page' : undefined} className={cn('font-medium', tone === 'light' ? 'text-white' : 'text-ink')}>
                  {c.label}
                </span>
              )}
              {!last && <ChevronRight className={cn('size-3.5 rtl:rotate-180', tone === 'light' ? 'text-limestone/50' : 'text-muted/60')} aria-hidden />}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export function SearchBar({
  value,
  onChange,
  placeholder,
  className,
  size = 'md',
  autoFocus,
  ariaLabel,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
  size?: 'md' | 'lg'
  autoFocus?: boolean
  ariaLabel?: string
}) {
  const { t } = useI18n()
  return (
    <div className={cn('relative', className)}>
      <Search className={cn('pointer-events-none absolute inset-y-0 start-3.5 my-auto text-muted', size === 'lg' ? 'size-5' : 'size-4')} aria-hidden />
      <input
        type="search"
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? t('Search…', 'ابحث…')}
        aria-label={ariaLabel ?? placeholder ?? t('Search', 'بحث')}
        className={cn(
          'w-full rounded-xl border border-stone-line bg-white text-ink shadow-[inset_0_1px_2px_rgb(36_41_35/0.04)] transition placeholder:text-muted/70 hover:border-olive-200 focus:border-olive-400 focus:ring-4 focus:ring-olive-100 focus:outline-none [&::-webkit-search-cancel-button]:hidden',
          size === 'lg' ? 'h-13 ps-11 pe-11 text-base' : 'h-10 ps-10 pe-9 text-sm',
        )}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute inset-y-0 end-2 my-auto flex size-7 items-center justify-center rounded-lg text-muted transition hover:bg-beige hover:text-ink"
          aria-label={t('Clear search', 'مسح البحث')}
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  )
}

const avatarTones = ['bg-olive text-limestone', 'bg-accent text-paper', 'bg-forest text-gold', 'bg-gold text-forest', 'bg-limestone-dark text-forest']

export function Avatar({ name, size = 'md', className }: { name: string; size?: 'sm' | 'md' | 'lg' | 'xl'; className?: string }) {
  const tone = avatarTones[name.length % avatarTones.length]
  const sizes = { sm: 'size-7 text-[0.65rem]', md: 'size-9 text-xs', lg: 'size-12 text-sm', xl: 'size-20 text-xl' }
  return (
    <span className={cn('inline-flex shrink-0 items-center justify-center rounded-full font-semibold ring-2 ring-white', tone, sizes[size], className)} aria-hidden>
      {initials(name)}
    </span>
  )
}

export function Segmented<K extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { key: K; label: string; icon?: ReactNode }[]
  value: K
  onChange: (k: K) => void
  label: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-xl border border-stone-line bg-white p-1">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          role="radio"
          aria-checked={value === o.key}
          onClick={() => onChange(o.key)}
          title={o.label}
          className={cn('inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-sm transition', value === o.key ? 'bg-forest text-paper' : 'text-muted hover:text-ink')}
        >
          {o.icon}
          <span className={o.icon ? 'sr-only' : undefined}>{o.label}</span>
        </button>
      ))}
    </div>
  )
}

export function Chip({ children, onRemove }: { children: ReactNode; onRemove?: () => void }) {
  const { t } = useI18n()
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-olive-200 bg-olive-50 py-1 ps-3 pe-1.5 text-xs font-medium text-olive">
      {children}
      {onRemove && (
        <button type="button" onClick={onRemove} className="rounded-full p-0.5 transition hover:bg-olive-100" aria-label={t('Remove filter', 'إزالة الفلتر')}>
          <X className="size-3" />
        </button>
      )}
    </span>
  )
}

/** Lightweight popover menu with outside-click and Escape handling. */
export function Popover({
  trigger,
  children,
  align = 'end',
  className,
}: {
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode
  children: (close: () => void) => ReactNode
  align?: 'start' | 'end'
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      {open && (
        <div className={cn('absolute top-full z-50 mt-2 animate-scale-in rounded-2xl border border-stone-line bg-white shadow-lift', align === 'end' ? 'end-0' : 'start-0', className)}>
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  )
}

export function SectionEyebrow({ children, className, tone = 'accent' }: { children: ReactNode; className?: string; tone?: 'accent' | 'gold' }) {
  return <p className={cn('text-xs font-extrabold tracking-[0.08em] uppercase', tone === 'gold' ? 'text-gold' : 'text-accent-dark', className)}>{children}</p>
}
