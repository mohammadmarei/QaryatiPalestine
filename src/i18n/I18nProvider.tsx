import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Bilingual, Lang } from '@/types'
import { storage } from '@/utils/storage'

export interface I18nValue {
  lang: Lang
  dir: 'rtl' | 'ltr'
  isRtl: boolean
  setLang: (lang: Lang) => void
  toggleLang: () => void
  /** Inline bilingual string: t('Explore', 'استكشف'). */
  t: (en: string, ar: string) => string
  /** Pick the active language from a bilingual record. */
  pick: (value: Bilingual | undefined) => string
  formatNumber: (n: number) => string
  formatDate: (iso: string, opts?: Intl.DateTimeFormatOptions) => string
  formatRelative: (iso: string) => string
}

// eslint-disable-next-line react-refresh/only-export-components
export const I18nContext = createContext<I18nValue | null>(null)

const LANG_KEY = 'qaryati.lang'

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => (storage.get(LANG_KEY) === 'en' ? 'en' : 'ar'))

  useEffect(() => {
    const root = document.documentElement
    root.lang = lang
    root.dir = lang === 'ar' ? 'rtl' : 'ltr'
    storage.set(LANG_KEY, lang)
  }, [lang])

  const setLang = useCallback((l: Lang) => setLangState(l), [])
  const toggleLang = useCallback(() => setLangState((l) => (l === 'ar' ? 'en' : 'ar')), [])

  const value = useMemo<I18nValue>(() => {
    // Latin digits are the common convention in Palestinian digital media.
    const locale = lang === 'ar' ? 'ar-PS-u-nu-latn' : 'en-GB'
    const numberFmt = new Intl.NumberFormat(locale)
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
    return {
      lang,
      dir: lang === 'ar' ? 'rtl' : 'ltr',
      isRtl: lang === 'ar',
      setLang,
      toggleLang,
      t: (en, ar) => (lang === 'ar' ? ar : en),
      pick: (v) => (v ? (lang === 'ar' ? v.ar || v.en : v.en || v.ar) : ''),
      formatNumber: (n) => numberFmt.format(n),
      // Missing or unreadable dates (records with an undocumented date) show as a dash instead of throwing.
      formatDate: (iso, opts = { year: 'numeric', month: 'short', day: 'numeric' }) => {
        const date = new Date(iso)
        return iso && !Number.isNaN(date.getTime()) ? new Intl.DateTimeFormat(locale, opts).format(date) : '—'
      },
      formatRelative: (iso) => {
        if (!iso || Number.isNaN(new Date(iso).getTime())) return '—'
        const diff = (new Date(iso).getTime() - Date.now()) / 1000
        const abs = Math.abs(diff)
        if (abs < 60) return rtf.format(Math.round(diff), 'second')
        if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute')
        if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour')
        if (abs < 86400 * 30) return rtf.format(Math.round(diff / 86400), 'day')
        if (abs < 86400 * 365) return rtf.format(Math.round(diff / (86400 * 30)), 'month')
        return rtf.format(Math.round(diff / (86400 * 365)), 'year')
      },
    }
  }, [lang, setLang, toggleLang])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
