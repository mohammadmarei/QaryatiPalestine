import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { cn } from '@/utils/cn'

/** Compact icon button for table rows; renders a link when `to` is given. */
export function IconAction({ label, onClick, to, children, tone = 'default' }: { label: string; onClick?: () => void; to?: string; children: ReactNode; tone?: 'default' | 'danger' }) {
  const cls = cn('flex size-8 items-center justify-center rounded-lg text-muted transition', tone === 'danger' ? 'hover:bg-danger-50 hover:text-danger' : 'hover:bg-beige hover:text-forest')
  if (to)
    return (
      <Link to={to} className={cls} aria-label={label} title={label}>
        {children}
      </Link>
    )
  return (
    <button type="button" onClick={onClick} className={cls} aria-label={label} title={label}>
      {children}
    </button>
  )
}
