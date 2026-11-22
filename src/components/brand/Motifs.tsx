import { cn } from '@/utils/cn'

/** Qaryati mark: a village house inside a rounded forest-green tile. */
export function LogoMark({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <span className={cn('grid shrink-0 place-items-center rounded-xl', inverted ? 'bg-white/10 text-white ring-1 ring-white/15' : 'bg-forest text-white', className)} aria-hidden>
      <svg viewBox="0 0 40 40" className="w-[74%]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 31V17l13-9 13 9v14M13 31V21l7-5 7 5v10M17 31v-7h6v7" />
        <path d="M4 32h32" />
      </svg>
    </span>
  )
}
