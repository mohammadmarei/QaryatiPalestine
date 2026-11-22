import { forwardRef, useId, useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { AlertCircle, ChevronDown, Eye, EyeOff } from 'lucide-react'
import { useI18n } from '@/hooks/useI18n'
import { cn } from '@/utils/cn'

// eslint-disable-next-line react-refresh/only-export-components
export const controlClass = (invalid?: boolean, className?: string) =>
  cn(
    'w-full rounded-xl border bg-white px-3.5 text-sm text-ink shadow-[inset_0_1px_2px_rgb(36_41_35/0.04)] transition placeholder:text-muted/70',
    'focus:outline-none focus:ring-4',
    invalid ? 'border-danger/70 focus:border-danger focus:ring-danger/15' : 'border-stone-line hover:border-olive-200 focus:border-olive-400 focus:ring-olive-100',
    'disabled:cursor-not-allowed disabled:bg-beige disabled:text-muted',
    className,
  )

interface FieldProps {
  label?: ReactNode
  error?: string
  hint?: ReactNode
  required?: boolean
  className?: string
  children: (id: string, describedBy: string | undefined) => ReactNode
  labelAside?: ReactNode
}

/** Label + control + hint/error wiring with correct aria attributes. */
export function Field({ label, error, hint, required, className, children, labelAside }: FieldProps) {
  const id = useId()
  const hintId = hint ? `${id}-hint` : undefined
  const errId = error ? `${id}-err` : undefined
  const describedBy = [hintId, errId].filter(Boolean).join(' ') || undefined
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <div className="flex items-center justify-between gap-2">
          <label htmlFor={id} className="text-sm font-medium text-ink">
            {label}
            {required && <span className="ms-0.5 text-danger" aria-hidden>*</span>}
          </label>
          {labelAside}
        </div>
      )}
      {children(id, describedBy)}
      {hint && !error && (
        <p id={hintId} className="text-xs text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errId} role="alert" className="flex items-center gap-1 text-xs font-medium text-danger">
          <AlertCircle className="size-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      )}
    </div>
  )
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean; leading?: ReactNode }

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ invalid, className, leading, ...rest }, ref) {
  if (leading) {
    return (
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-muted">{leading}</span>
        <input ref={ref} aria-invalid={invalid || undefined} className={controlClass(invalid, cn('h-11 ps-10', className))} {...rest} />
      </div>
    )
  }
  return <input ref={ref} aria-invalid={invalid || undefined} className={controlClass(invalid, cn('h-11', className))} {...rest} />
})

export const PasswordInput = forwardRef<HTMLInputElement, InputProps>(function PasswordInput({ invalid, className, ...rest }, ref) {
  const [show, setShow] = useState(false)
  const { t } = useI18n()
  return (
    <div className="relative">
      <input ref={ref} type={show ? 'text' : 'password'} aria-invalid={invalid || undefined} className={controlClass(invalid, cn('h-11 pe-11', className))} {...rest} />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute inset-y-0 end-1 my-auto flex size-9 items-center justify-center rounded-lg text-muted transition hover:bg-beige hover:text-ink"
        aria-label={show ? t('Hide password', 'إخفاء كلمة المرور') : t('Show password', 'إظهار كلمة المرور')}
        aria-pressed={show}
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  )
})

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }>(function Textarea(
  { invalid, className, rows = 4, ...rest },
  ref,
) {
  return <textarea ref={ref} rows={rows} aria-invalid={invalid || undefined} className={controlClass(invalid, cn('py-2.5 leading-relaxed', className))} {...rest} />
})

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }>(function Select(
  { invalid, className, children, ...rest },
  ref,
) {
  return (
    <div className="relative">
      <select ref={ref} aria-invalid={invalid || undefined} className={controlClass(invalid, cn('h-11 appearance-none pe-9', className))} {...rest}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute inset-y-0 end-3 my-auto size-4 text-muted" aria-hidden />
    </div>
  )
})

export const DateInput = forwardRef<HTMLInputElement, InputProps>(function DateInput(props, ref) {
  return <Input ref={ref} type="date" {...props} />
})

export const Checkbox = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { label: ReactNode; description?: ReactNode }>(function Checkbox(
  { label, description, className, id, ...rest },
  ref,
) {
  const auto = useId()
  const cid = id ?? auto
  return (
    <label htmlFor={cid} className={cn('flex cursor-pointer items-start gap-2.5 text-sm', className)}>
      <input ref={ref} id={cid} type="checkbox" className="mt-0.5 size-4 shrink-0 cursor-pointer rounded border-stone-line accent-forest" {...rest} />
      <span>
        <span className="text-ink">{label}</span>
        {description && <span className="block text-xs text-muted">{description}</span>}
      </span>
    </label>
  )
})

export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: ReactNode
  description?: ReactNode
  disabled?: boolean
}) {
  const id = useId()
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
        </label>
        {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50',
          checked ? 'bg-olive' : 'bg-limestone-dark',
        )}
      >
        <span
          className={cn(
            'inline-block size-5 rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-5.5 rtl:-translate-x-5.5' : 'translate-x-0.5 rtl:-translate-x-0.5',
          )}
        />
      </button>
    </div>
  )
}
