import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { LayoutGrid, List, Search, SearchX, X } from 'lucide-react'
import type { VerificationStatus } from '@/types'
import { governorates } from '@/data/governorates'
import { verificationLabels } from '@/i18n/labels'
import { CardSkeleton, EmptyState } from '@/components/feedback/States'
import { PageHero } from '@/components/layout/Sections'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Misc'
import { Pagination } from '@/components/ui/Pagination'
import { useData } from '@/hooks/useData'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useI18n } from '@/hooks/useI18n'
import { cn, container } from '@/utils/cn'
import { paginate } from '@/utils/misc'
import { VillageCard } from './components/VillageCard'
import { governorateName, isPublic, matchesVillage } from './utils'

type SortKey = 'name-asc' | 'name-desc' | 'updated-desc' | 'updated-asc'
const PAGE_SIZE = 9
const statuses: VerificationStatus[] = ['verified', 'pending', 'unverified', 'needs-review']

const selectClass = 'h-[43px] min-w-0 rounded-lg border border-stone-line bg-white px-3 text-sm text-[#475569] outline-none transition focus:border-olive-400 focus:ring-4 focus:ring-olive-100'

export function VillagesExplorerPage() {
  const { t, pick, lang, formatNumber } = useI18n()
  const { villages } = useData()
  const [params, setParams] = useSearchParams()
  useDocumentTitle(t('Explore villages', 'استكشف القرى'))

  const q = params.get('q') ?? ''
  const gov = params.get('gov') ?? ''
  const status = params.get('status') ?? ''
  const featured = params.get('featured') === '1'
  const sort = (params.get('sort') as SortKey) || 'name-asc'
  const view = params.get('view') === 'list' ? 'list' : 'grid'
  const page = Number(params.get('page') ?? '1') || 1

  const update = (patch: Record<string, string | null>, resetPage = true) => {
    const next = new URLSearchParams(params)
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)))
    if (resetPage) next.delete('page')
    setParams(next, { replace: true })
  }

  // Simulated latency: results "arrive" shortly after the filters change.
  const filterKey = `${q}|${gov}|${status}|${featured}|${sort}`
  const [loadedKey, setLoadedKey] = useState<string | null>(null)
  useEffect(() => {
    const id = window.setTimeout(() => setLoadedKey(filterKey), 380)
    return () => window.clearTimeout(id)
  }, [filterKey])
  const loading = loadedKey !== filterKey

  const publicVillages = useMemo(() => villages.filter(isPublic), [villages])

  const results = useMemo(() => {
    const collator = new Intl.Collator(lang, { sensitivity: 'base' })
    const list = publicVillages.filter((v) => matchesVillage(v, q) && (!gov || v.governorateId === gov) && (!status || v.verification === status) && (!featured || v.featured))
    return [...list].sort((a, b) => {
      switch (sort) {
        case 'name-desc':
          return collator.compare(pick(b.name), pick(a.name))
        case 'updated-desc':
          return b.updatedAt.localeCompare(a.updatedAt)
        case 'updated-asc':
          return a.updatedAt.localeCompare(b.updatedAt)
        default:
          return collator.compare(pick(a.name), pick(b.name))
      }
    })
  }, [publicVillages, q, gov, status, featured, sort, lang, pick])

  const { items, totalPages, page: current } = paginate(results, page, PAGE_SIZE)

  const activeFilters = [
    q && { key: 'q', label: `“${q}”` },
    gov && { key: 'gov', label: pick(governorateName(gov)) },
    status && { key: 'status', label: pick(verificationLabels[status as VerificationStatus]) },
    featured && { key: 'featured', label: t('Featured', 'مختارة') },
  ].filter(Boolean) as { key: string; label: string }[]

  return (
    <div>
      <PageHero
        eyebrow={t('Village directory', 'دليل القرى')}
        title={t('Explore the villages of Palestine', 'استكشف قرى فلسطين')}
        body={t('Browse a documented encyclopedia of villages and towns, and discover the stories of places and people.', 'تصفّح موسوعة موثّقة من القرى والبلدات، واكتشف قصص المكان والناس.')}
      />

      <section className={cn(container, 'pt-8 pb-20')}>
        {/* Filter bar */}
        <div className="flex flex-col gap-2.5 rounded-xl border border-stone-line bg-white p-3 md:flex-row md:items-center">
          <div className="flex h-[43px] min-w-0 flex-1 items-center gap-2 rounded-lg border border-stone-line px-3 text-muted focus-within:border-olive-400 focus-within:ring-4 focus-within:ring-olive-100">
            <Search className="size-[18px] shrink-0" aria-hidden />
            <input
              type="search"
              value={q}
              onChange={(e) => update({ q: e.target.value || null })}
              placeholder={t('Search by village name…', 'ابحث باسم القرية...')}
              aria-label={t('Search villages', 'البحث عن القرى')}
              className="w-full min-w-0 bg-transparent text-ink outline-none [&::-webkit-search-cancel-button]:hidden"
            />
            {q && (
              <button type="button" onClick={() => update({ q: null })} className="rounded p-0.5 hover:bg-beige" aria-label={t('Clear search', 'مسح البحث')}>
                <X className="size-4" />
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2.5 md:flex">
            <select value={gov} onChange={(e) => update({ gov: e.target.value || null })} aria-label={t('Governorate', 'المحافظة')} className={cn(selectClass, 'md:w-44')}>
              <option value="">{t('All governorates', 'جميع المحافظات')}</option>
              {governorates.map((g) => (
                <option key={g.id} value={g.id}>
                  {pick(g.name)}
                </option>
              ))}
            </select>
            <select value={status} onChange={(e) => update({ status: e.target.value || null })} aria-label={t('Verification status', 'حالة التوثيق')} className={cn(selectClass, 'md:w-44')}>
              <option value="">{t('All statuses', 'كل الحالات')}</option>
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {pick(verificationLabels[s])}
                </option>
              ))}
            </select>
          </div>
          <label className="flex h-[43px] cursor-pointer items-center gap-2 rounded-lg border border-stone-line px-3 text-sm whitespace-nowrap text-[#475569]">
            <input type="checkbox" checked={featured} onChange={(e) => update({ featured: e.target.checked ? '1' : null })} className="size-4 accent-forest" />
            {t('Featured only', 'المختارة فقط')}
          </label>
        </div>

        {activeFilters.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {activeFilters.map((f) => (
              <Chip key={f.key} onRemove={() => update({ [f.key]: null })}>
                {f.label}
              </Chip>
            ))}
            <button type="button" onClick={() => setParams({}, { replace: true })} className="text-xs font-bold text-accent-dark hover:underline">
              {t('Clear all', 'مسح الكل')}
            </button>
          </div>
        )}

        {/* Results bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-0.5 pt-6 pb-4 text-[13px] text-muted">
          <p aria-live="polite">
            <b className="text-forest">{formatNumber(results.length)}</b> {t('matching villages', 'قرى مطابقة')}
          </p>
          <div className="flex items-center gap-1.5">
            <select value={sort} onChange={(e) => update({ sort: e.target.value })} aria-label={t('Sort by', 'ترتيب حسب')} className={cn(selectClass, 'h-9 w-44')}>
              <option value="name-asc">{t('Sort: A–Z', 'الترتيب: أبجدياً')}</option>
              <option value="name-desc">{t('Sort: Z–A', 'الترتيب: عكسياً')}</option>
              <option value="updated-desc">{t('Recently updated', 'الأحدث تحديثاً')}</option>
              <option value="updated-asc">{t('Least recently updated', 'الأقدم تحديثاً')}</option>
            </select>
            {(['grid', 'list'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => update({ view: v === 'grid' ? null : v }, false)}
                aria-pressed={view === v}
                aria-label={v === 'grid' ? t('Grid view', 'عرض شبكي') : t('List view', 'عرض قائمة')}
                className={cn('grid size-9 place-items-center rounded-[7px] border transition', view === v ? 'border-forest bg-forest text-white' : 'border-stone-line bg-white text-muted hover:text-forest')}
              >
                {v === 'grid' ? <LayoutGrid className="size-[18px]" /> : <List className="size-[18px]" />}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className={cn('grid gap-5', view === 'grid' ? 'sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1')}>
            {Array.from({ length: view === 'grid' ? 6 : 3 }, (_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="rounded-[13px] border border-dashed border-[#cbd5e1] bg-white">
            <EmptyState
              icon={<SearchX className="size-7" />}
              title={t('No matching villages', 'لم نجد قرى مطابقة')}
              description={t('Try another name or remove a filter.', 'جرّب البحث باسم آخر أو أزل عوامل التصفية.')}
              action={
                <Button variant="secondary" onClick={() => setParams({}, { replace: true })}>
                  {t('Clear search', 'مسح البحث')}
                </Button>
              }
            />
          </div>
        ) : (
          <ul className={cn('grid gap-5', view === 'grid' ? 'gap-y-6 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 gap-3.5')}>
            {items.map((v, i) => (
              <li key={v.id} className="animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
                <VillageCard village={v} layout={view} className="h-full" />
              </li>
            ))}
          </ul>
        )}

        {!loading && results.length > 0 && (
          <Pagination
            className="mt-10"
            page={current}
            totalPages={totalPages}
            totalItems={results.length}
            pageSize={PAGE_SIZE}
            onChange={(p) => {
              update({ page: p > 1 ? String(p) : null }, false)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          />
        )}
      </section>
    </div>
  )
}
