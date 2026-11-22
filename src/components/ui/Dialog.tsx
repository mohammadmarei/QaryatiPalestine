import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, X } from 'lucide-react'
import { useI18n } from '@/hooks/useI18n'
import { cn } from '@/utils/cn'
import { Button } from './Button'

interface DialogProps {
  open: boolean
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  children?: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }

/** Accessible modal: focus moves in, Escape closes, focus is trapped and restored. */
export function Dialog({ open, onClose, title, description, children, footer, size = 'md' }: DialogProps) {
  const { t, dir } = useI18n()
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const descId = useId()
  const closeRef = useRef(onClose)
  useEffect(() => {
    closeRef.current = onClose
  })

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    const panel = panelRef.current
    const focusables = () =>
      Array.from(panel?.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])') ?? [])
    const first = focusables().find((el) => el.tagName !== 'BUTTON' || !el.dataset.close) ?? focusables()[0]
    first?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current()
      if (e.key === 'Tab') {
        const els = focusables()
        if (!els.length) return
        const firstEl = els[0]
        const lastEl = els[els.length - 1]
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault()
          lastEl.focus()
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault()
          firstEl.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      previous?.focus()
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-end justify-center p-0 sm:items-center sm:p-6" dir={dir}>
      <div className="absolute inset-0 animate-fade-in bg-charcoal/45 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        className={cn('relative flex max-h-[92vh] w-full animate-scale-in flex-col overflow-hidden rounded-t-3xl bg-paper shadow-lift sm:rounded-[16px]', sizes[size])}
      >
        <div className="h-1.5 w-full bg-dots-light bg-forest" aria-hidden />
        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-3">
          <div>
            <h2 id={titleId} className="text-lg font-semibold text-ink">
              {title}
            </h2>
            {description && (
              <p id={descId} className="mt-1 text-sm text-muted">
                {description}
              </p>
            )}
          </div>
          <button type="button" data-close="true" onClick={onClose} className="-m-1 rounded-lg p-1.5 text-muted transition hover:bg-beige hover:text-ink" aria-label={t('Close', 'إغلاق')}>
            <X className="size-5" />
          </button>
        </div>
        {children && <div className="scrollbar-thin flex-1 overflow-y-auto px-6 py-3">{children}</div>}
        {footer && <div className="flex flex-col-reverse gap-2 border-t border-stone-line bg-paper px-6 py-4 sm:flex-row sm:justify-end">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  tone = 'danger',
  children,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: ReactNode
  description?: ReactNode
  confirmLabel?: string
  tone?: 'danger' | 'primary'
  children?: ReactNode
}) {
  const { t } = useI18n()
  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="sm"
      title={
        <span className="flex items-center gap-2.5">
          {tone === 'danger' && (
            <span className="flex size-8 items-center justify-center rounded-full bg-danger-50 text-danger">
              <AlertTriangle className="size-4" />
            </span>
          )}
          {title}
        </span>
      }
      description={description}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            {t('Cancel', 'إلغاء')}
          </Button>
          <Button
            variant={tone === 'danger' ? 'danger' : 'primary'}
            onClick={() => {
              onConfirm()
              onClose()
            }}
          >
            {confirmLabel ?? t('Confirm', 'تأكيد')}
          </Button>
        </>
      }
    >
      {children}
    </Dialog>
  )
}
