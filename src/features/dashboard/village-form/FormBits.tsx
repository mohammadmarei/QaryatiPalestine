import type { ReactNode } from 'react'
import { useFormContext, type FieldPath } from 'react-hook-form'
import { Plus, Trash2 } from 'lucide-react'
import { Field, Input, Textarea } from '@/components/forms/Fields'
import { Button } from '@/components/ui/Button'
import { useI18n } from '@/hooks/useI18n'
import type { VillageFormValues } from './schema'

type Path = FieldPath<VillageFormValues>

/** Read a nested error message by dotted path, e.g. "events.0.year". */
// eslint-disable-next-line react-refresh/only-export-components
export function useFieldError() {
  const {
    formState: { errors },
  } = useFormContext<VillageFormValues>()
  return (path: string): string | undefined => {
    let cur: unknown = errors
    for (const part of path.split('.')) {
      if (cur && typeof cur === 'object') cur = (cur as Record<string, unknown>)[part]
      else return undefined
    }
    const msg = (cur as { message?: unknown } | undefined)?.message
    return typeof msg === 'string' ? msg : undefined
  }
}

export function TextField({ name, label, required, hint, dir, placeholder, type = 'text', inputMode }: { name: Path; label: ReactNode; required?: boolean; hint?: ReactNode; dir?: 'rtl' | 'ltr' | 'auto'; placeholder?: string; type?: string; inputMode?: 'numeric' | 'decimal' }) {
  const { register } = useFormContext<VillageFormValues>()
  const err = useFieldError()(name)
  return (
    <Field label={label} required={required} error={err} hint={hint}>
      {(id, d) => <Input id={id} type={type} dir={dir} inputMode={inputMode} placeholder={placeholder} aria-describedby={d} invalid={!!err} {...register(name)} />}
    </Field>
  )
}

/**
 * Arabic and English inputs side by side. Arabic comes first and is always
 * written right-to-left, whatever the interface language.
 */
export function BilingualField({ ar, en, label, required, multiline, rows = 3, hint }: { ar: Path; en: Path; label: string; required?: boolean; multiline?: boolean; rows?: number; hint?: ReactNode }) {
  const { register } = useFormContext<VillageFormValues>()
  const { t } = useI18n()
  const getErr = useFieldError()
  const errAr = getErr(ar)
  const errEn = getErr(en)
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-ink">
        {label}
        {required && <span className="ms-0.5 text-accent-dark">*</span>}
      </legend>
      <div className="grid gap-3 md:grid-cols-2">
        <Field error={errAr} label={<span className="text-xs font-normal text-muted">{t('Arabic', 'العربية')}</span>}>
          {(id, d) =>
            multiline ? (
              <Textarea id={id} rows={rows} dir="rtl" lang="ar" className="font-arabic" aria-describedby={d} invalid={!!errAr} {...register(ar)} />
            ) : (
              <Input id={id} dir="rtl" lang="ar" className="font-arabic" aria-describedby={d} invalid={!!errAr} {...register(ar)} />
            )
          }
        </Field>
        <Field error={errEn} label={<span className="text-xs font-normal text-muted">English</span>}>
          {(id, d) =>
            multiline ? (
              <Textarea id={id} rows={rows} dir="ltr" lang="en" aria-describedby={d} invalid={!!errEn} {...register(en)} />
            ) : (
              <Input id={id} dir="ltr" lang="en" aria-describedby={d} invalid={!!errEn} {...register(en)} />
            )
          }
        </Field>
      </div>
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </fieldset>
  )
}

/** Card wrapper for an item inside a repeatable list. */
export function RepeatItem({ index, title, onRemove, children }: { index: number; title: string; onRemove: () => void; children: ReactNode }) {
  const { t } = useI18n()
  return (
    <div className="animate-scale-in rounded-2xl border border-stone-line bg-beige/40 p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="flex items-center gap-2 text-sm font-semibold text-forest">
          <span className="flex size-6 items-center justify-center rounded-full bg-forest text-[0.7rem] text-gold">{index + 1}</span>
          {title}
        </p>
        <button type="button" onClick={onRemove} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-muted transition hover:bg-accent-50 hover:text-accent-dark">
          <Trash2 className="size-3.5" aria-hidden /> {t('Remove', 'إزالة')}
        </button>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

export function AddButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <Button variant="outline" onClick={onClick} icon={<Plus className="size-4" />} className="w-full border-dashed">
      {children}
    </Button>
  )
}

export function StepIntro({ title, description }: { title: string; description: string }) {
  return (
    <header className="mb-6 border-b border-stone-line pb-5">
      <h2 className="text-xl font-semibold text-forest">{title}</h2>
      <p className="mt-1 text-sm text-muted">{description}</p>
    </header>
  )
}
