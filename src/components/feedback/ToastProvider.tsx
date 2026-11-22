import { createContext, useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { cn } from '@/utils/cn'

export type ToastTone = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: number
  tone: ToastTone
  title: string
  description?: string
}

export interface ToastApi {
  toast: (t: Omit<Toast, 'id'>) => void
  success: (title: string, description?: string) => void
  error: (title: string, description?: string) => void
  info: (title: string, description?: string) => void
}

// eslint-disable-next-line react-refresh/only-export-components
export const ToastContext = createContext<ToastApi | null>(null)

const toneStyles: Record<ToastTone, { icon: typeof Info; ring: string; iconClass: string }> = {
  success: { icon: CheckCircle2, ring: 'border-olive-200', iconClass: 'text-olive-500' },
  error: { icon: XCircle, ring: 'border-danger/30', iconClass: 'text-danger' },
  info: { icon: Info, ring: 'border-stone-line', iconClass: 'text-forest' },
  warning: { icon: AlertTriangle, ring: 'border-gold/40', iconClass: 'text-gold' },
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const counter = useRef(0)

  const dismiss = useCallback((id: number) => setToasts((ts) => ts.filter((t) => t.id !== id)), [])

  const toast = useCallback(
    (t: Omit<Toast, 'id'>) => {
      const id = ++counter.current
      setToasts((ts) => [...ts.slice(-3), { ...t, id }])
      window.setTimeout(() => dismiss(id), 4500)
    },
    [dismiss],
  )

  const api = useMemo<ToastApi>(
    () => ({
      toast,
      success: (title, description) => toast({ tone: 'success', title, description }),
      error: (title, description) => toast({ tone: 'error', title, description }),
      info: (title, description) => toast({ tone: 'info', title, description }),
    }),
    [toast],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[1100] flex flex-col items-center gap-2 sm:inset-x-auto sm:end-6 sm:bottom-6 sm:items-end"
      >
        {toasts.map((t) => {
          const s = toneStyles[t.tone]
          const Icon = s.icon
          return (
            <div
              key={t.id}
              role={t.tone === 'error' ? 'alert' : 'status'}
              className={cn(
                'pointer-events-auto flex w-full max-w-sm animate-scale-in items-start gap-3 rounded-2xl border bg-white/95 p-4 shadow-lift backdrop-blur',
                s.ring,
              )}
            >
              <Icon className={cn('mt-0.5 size-5 shrink-0', s.iconClass)} aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">{t.title}</p>
                {t.description && <p className="mt-0.5 text-sm text-muted">{t.description}</p>}
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="rounded-lg p-1 text-muted transition hover:bg-beige hover:text-ink"
                aria-label="Dismiss"
              >
                <X className="size-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
