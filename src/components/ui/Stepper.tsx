import { Check } from 'lucide-react'
import { useI18n } from '@/hooks/useI18n'
import { cn } from '@/utils/cn'

export interface Step {
  key: string
  label: string
  /** Shows a warning dot when the step has validation errors. */
  invalid?: boolean
}

/**
 * Vertical stepper on large screens, a compact progress strip on small ones.
 * Completed steps are clickable so long forms can be revisited freely.
 */
export function Stepper({ steps, current, onSelect, completed }: { steps: Step[]; current: number; onSelect: (i: number) => void; completed: Set<number> }) {
  const { t, formatNumber } = useI18n()
  return (
    <>
      {/* Mobile: progress strip */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-forest">{steps[current]?.label}</span>
          <span className="text-muted">
            {t('Step', 'الخطوة')} {formatNumber(current + 1)} / {formatNumber(steps.length)}
          </span>
        </div>
        <div className="mt-2 flex gap-1" aria-hidden>
          {steps.map((s, i) => (
            <span key={s.key} className={cn('h-1.5 flex-1 rounded-full transition', i < current || completed.has(i) ? 'bg-olive' : i === current ? 'bg-accent' : 'bg-limestone')} />
          ))}
        </div>
      </div>

      {/* Desktop: vertical list */}
      <ol className="hidden lg:block" aria-label={t('Form steps', 'خطوات النموذج')}>
        {steps.map((s, i) => {
          const done = completed.has(i) && i !== current
          const active = i === current
          return (
            <li key={s.key} className="relative">
              {i < steps.length - 1 && <span className={cn('absolute start-[1.05rem] top-9 h-[calc(100%-1.5rem)] w-px', done ? 'bg-olive-300' : 'bg-stone-line')} aria-hidden />}
              <button
                type="button"
                onClick={() => onSelect(i)}
                aria-current={active ? 'step' : undefined}
                className={cn('group flex w-full items-center gap-3 rounded-xl px-1 py-2 text-start transition', active ? '' : 'hover:bg-beige/70')}
              >
                <span
                  className={cn(
                    'relative flex size-8.5 shrink-0 items-center justify-center rounded-full text-xs font-semibold ring-1 transition',
                    active ? 'bg-forest text-paper ring-forest' : done ? 'bg-olive-50 text-olive ring-olive-200' : 'bg-white text-muted ring-stone-line',
                  )}
                >
                  {done ? <Check className="size-4" /> : formatNumber(i + 1)}
                  {s.invalid && <span className="absolute -end-0.5 -top-0.5 size-2.5 rounded-full bg-accent ring-2 ring-white" />}
                </span>
                <span className={cn('text-sm', active ? 'font-semibold text-forest' : 'text-ink/80')}>{s.label}</span>
              </button>
            </li>
          )
        })}
      </ol>
    </>
  )
}
