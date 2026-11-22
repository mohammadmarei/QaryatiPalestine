import type { ReactNode } from 'react'
import { TrendingUp } from 'lucide-react'
import { cn } from '@/utils/cn'

export function StatCard({
  label,
  value,
  icon,
  hint,
  trend,
  tone = 'olive',
  className,
}: {
  label: string
  value: ReactNode
  icon: ReactNode
  hint?: ReactNode
  trend?: string
  tone?: 'olive' | 'accent' | 'gold' | 'forest'
  className?: string
}) {
  const tones = {
    olive: 'bg-accent-50 text-forest',
    accent: 'bg-accent-50 text-accent-dark',
    gold: 'bg-gold-50 text-[#8a6d33]',
    forest: 'bg-forest text-white',
  }
  return (
    <div className={cn('rounded-[14px] border border-stone-line bg-white p-5 shadow-soft', className)}>
      <span className={cn('grid size-11 place-items-center rounded-xl', tones[tone])}>{icon}</span>
      <p className="mt-4 text-[13px] text-muted">{label}</p>
      <p className="mt-1 font-latin text-[28px] leading-tight font-bold text-forest">{value}</p>
      {(hint || trend) && (
        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted">
          {trend && (
            <span className="inline-flex items-center gap-1 font-bold text-accent-dark">
              <TrendingUp className="size-3.5" aria-hidden />
              {trend}
            </span>
          )}
          {hint}
        </div>
      )}
    </div>
  )
}

export function ChartCard({ title, subtitle, action, children, className }: { title: string; subtitle?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn('flex flex-col rounded-[14px] border border-stone-line bg-white p-5 shadow-soft sm:p-6', className)}>
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-forest">{title}</h3>
          {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
        </div>
        {action}
      </header>
      <div className="min-h-0 flex-1">{children}</div>
    </section>
  )
}
