import { Check, X } from 'lucide-react'
import { useI18n } from '@/hooks/useI18n'
import { cn } from '@/utils/cn'

// eslint-disable-next-line react-refresh/only-export-components
export const passwordRules = [
  { key: 'len', test: (p: string) => p.length >= 8, en: 'At least 8 characters', ar: '8 أحرف على الأقل' },
  { key: 'case', test: (p: string) => /[a-z]/.test(p) && /[A-Z]/.test(p), en: 'Upper & lower case letters', ar: 'أحرف كبيرة وصغيرة' },
  { key: 'num', test: (p: string) => /\d/.test(p), en: 'A number', ar: 'رقم واحد على الأقل' },
  { key: 'sym', test: (p: string) => /[^A-Za-z0-9]/.test(p), en: 'A symbol', ar: 'رمز خاص' },
]

// eslint-disable-next-line react-refresh/only-export-components
export const passwordScore = (p: string) => passwordRules.filter((r) => r.test(p)).length

export function PasswordStrength({ password }: { password: string }) {
  const { t } = useI18n()
  const score = passwordScore(password)
  const levels = [
    { label: t('Too weak', 'ضعيفة جدًا'), color: 'bg-danger', text: 'text-danger' },
    { label: t('Weak', 'ضعيفة'), color: 'bg-[#d97706]', text: 'text-[#b45309]' },
    { label: t('Fair', 'مقبولة'), color: 'bg-gold', text: 'text-[#8a6d33]' },
    { label: t('Good', 'جيدة'), color: 'bg-olive-400', text: 'text-olive-500' },
    { label: t('Strong', 'قوية'), color: 'bg-olive', text: 'text-olive' },
  ]
  const level = levels[score]

  return (
    <div className="space-y-2" aria-live="polite">
      <div className="flex items-center gap-3">
        <div className="flex flex-1 gap-1" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={cn('h-1.5 flex-1 rounded-full transition-colors duration-300', password && i < score ? level.color : 'bg-limestone')} />
          ))}
        </div>
        {password && <span className={cn('text-xs font-semibold', level.text)}>{level.label}</span>}
      </div>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-1">
        {passwordRules.map((r) => {
          const ok = r.test(password)
          return (
            <li key={r.key} className={cn('flex items-center gap-1.5 text-xs transition-colors', ok ? 'text-olive' : 'text-muted')}>
              {ok ? <Check className="size-3.5" aria-hidden /> : <X className="size-3.5 opacity-50" aria-hidden />}
              {t(r.en, r.ar)}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
