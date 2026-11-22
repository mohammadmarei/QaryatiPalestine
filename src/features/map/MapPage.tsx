import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { Check, ChevronDown, Clock, List, MapPin, Search, X } from 'lucide-react'
import { governorates } from '@/data/governorates'
import { verificationLabels } from '@/i18n/labels'
import { VillagePhoto } from '@/components/brand/VillagePhoto'
import { EmptyState } from '@/components/feedback/States'
import { ButtonLink } from '@/components/ui/Button'
import { useData } from '@/hooks/useData'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useI18n } from '@/hooks/useI18n'
import { cn } from '@/utils/cn'
import { governorateName, isPublic, matchesVillage } from '../villages/utils'
import { markerColors, VillageMap } from './components/VillageMap'

export function MapPage() {
  const { t, pick, formatNumber } = useI18n()
  const { villages } = useData()
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState('')
  const [gov, setGov] = useState('')
  const [listOpen, setListOpen] = useState(false)
  const selectedId = params.get('village')
  useDocumentTitle(t('Interactive map', 'الخريطة التفاعلية'))

  const visible = useMemo(() => villages.filter((v) => isPublic(v) && matchesVillage(v, q) && (!gov || v.governorateId === gov)), [villages, q, gov])
  const selected = visible.find((v) => v.id === selectedId)

  const select = (id: string | null) => {
    const next = new URLSearchParams(params)
    if (id) next.set('village', id)
    else next.delete('village')
    setParams(next, { replace: true })
  }

  return (
    <div className="flex h-[calc(100dvh-78px)] flex-col">
      {/* Toolbar */}
      <div className="relative z-[450] flex flex-col gap-3 border-b border-stone-line bg-white px-5 py-3.5 md:flex-row md:items-center">
        <div className="me-auto">
          <h1 className="text-xl font-bold text-forest">{t('Village map', 'خريطة القرى')}</h1>
          <p className="text-xs text-muted">{t(`Explore ${formatNumber(visible.length)} Palestinian villages`, `استكشف ${formatNumber(visible.length)} قرية وبلدة فلسطينية`)}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="flex h-[43px] items-center gap-2 rounded-lg border border-stone-line px-3 text-muted focus-within:border-olive-400 sm:w-72">
            <Search className="size-[18px] shrink-0" aria-hidden />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('Search on the map…', 'ابحث على الخريطة...')}
              aria-label={t('Search villages on the map', 'البحث عن القرى على الخريطة')}
              className="w-full min-w-0 bg-transparent text-ink outline-none"
            />
          </div>
          <select value={gov} onChange={(e) => setGov(e.target.value)} aria-label={t('Filter by governorate', 'التصفية حسب المحافظة')} className="h-[43px] rounded-lg border border-stone-line bg-white px-3 text-sm text-[#475569] outline-none sm:w-48">
            <option value="">{t('All governorates', 'جميع المحافظات')}</option>
            {governorates.map((g) => (
              <option key={g.id} value={g.id}>
                {pick(g.name)}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setListOpen((o) => !o)}
            aria-expanded={listOpen}
            aria-controls="map-list"
            className="inline-flex h-[43px] items-center justify-center gap-2 rounded-[9px] border border-stone-line bg-white px-4 text-[13px] font-bold text-forest hover:border-[#b6c9c5]"
          >
            <List className="size-4" aria-hidden />
            {t('Results list', 'قائمة النتائج')}
            <ChevronDown className={cn('size-4 transition', listOpen && 'rotate-180')} aria-hidden />
          </button>
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        <VillageMap villages={visible} selectedId={selectedId} onSelect={select} fitToVillages popups={false} className="h-full w-full" />

        {/* Results list */}
        {listOpen && (
          <div id="map-list" className="absolute top-24 left-3 z-[420] max-h-[calc(100%-8rem)] w-[min(18rem,calc(100%-1.5rem))] animate-scale-in overflow-y-auto rounded-xl border border-stone-line bg-white p-1.5 shadow-lift sm:max-h-[calc(100%-15rem)]">
            {visible.length === 0 ? (
              <EmptyState title={t('No villages found', 'لا توجد قرى')} className="py-8" />
            ) : (
              visible.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => {
                    select(v.id)
                    // On phones the list would cover the selected-village card.
                    if (window.matchMedia('(max-width: 639px)').matches) setListOpen(false)
                  }}
                  aria-pressed={v.id === selectedId}
                  className={cn('flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-start transition', v.id === selectedId ? 'bg-accent-50' : 'hover:bg-paper')}
                >
                  <MapPin className="size-4 shrink-0 text-accent-dark" aria-hidden />
                  <span className="min-w-0">
                    <b className="block text-sm text-forest">{pick(v.name)}</b>
                    <small className="block truncate text-xs text-muted">{pick(governorateName(v.governorateId))}</small>
                  </span>
                </button>
              ))
            )}
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-6 left-3 z-[400] hidden sm:block rounded-xl border border-stone-line bg-white/95 p-3.5 text-xs shadow-lift backdrop-blur">
          <b className="mb-2 block text-forest">{t('Map legend', 'دليل الخريطة')}</b>
          <ul className="space-y-1.5 text-[#475569]">
            {[
              [markerColors.verified, t('Verified village', 'قرية موثّقة')],
              [markerColors.review, t('Under review', 'قيد المراجعة')],
              [markerColors.depopulated, t('Depopulated site', 'موقع مهجّر')],
            ].map(([c, l]) => (
              <li key={l} className="flex items-center gap-2">
                <i className="size-2.5 rounded-full" style={{ background: c }} />
                {l}
              </li>
            ))}
          </ul>
        </div>

        {/* Selected village card */}
        {selected && (
          <div className="absolute inset-x-3 bottom-6 z-[430] mx-auto max-w-[300px] animate-scale-in overflow-hidden rounded-[14px] bg-white shadow-lift sm:inset-x-auto sm:top-3 sm:right-3 sm:bottom-auto sm:mx-0 sm:w-[300px]">
            <div className="relative">
              <VillagePhoto village={selected} alt={pick(selected.name)} className="h-36" />
              <button
                type="button"
                onClick={() => select(null)}
                className="absolute end-2.5 top-2.5 grid size-8 place-items-center rounded-full bg-white/90 text-forest shadow hover:bg-white"
                aria-label={t('Clear selection', 'إلغاء التحديد')}
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="p-4">
              <span className="inline-flex items-center gap-1 rounded-full bg-accent-50 px-2 py-0.5 text-[11px] font-bold text-forest">
                {selected.verification === 'verified' ? <Check className="size-3" /> : <Clock className="size-3" />}
                {pick(verificationLabels[selected.verification])}
              </span>
              <h3 className="mt-2 text-xl font-bold text-forest">
                {pick(selected.name)} <small className="text-xs font-medium text-muted">{selected.name.en === pick(selected.name) ? selected.name.ar : selected.name.en}</small>
              </h3>
              <p className="mt-1 flex items-center gap-1 text-xs text-sage">
                <MapPin className="size-3.5" aria-hidden />
                {t(`${pick(governorateName(selected.governorateId))} Governorate`, `محافظة ${pick(governorateName(selected.governorateId))}`)}
              </p>
              <ButtonLink to={`/villages/${selected.id}`} className="mt-3.5 w-full">
                {t('View village page', 'عرض صفحة القرية')}
              </ButtonLink>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
