import type { ReactNode } from 'react'
import { BookOpen, Building, Church, ExternalLink, FileText, GraduationCap, HeartPulse, Landmark, Library, Map as MapIcon, Mic, Moon, Newspaper, Store, Users } from 'lucide-react'
import type { FacilityKind, PopulationRecord, Source, SourceType, Village } from '@/types'
import { culturalCategoryLabels, facilityKindLabels, heritageKindLabels, populationKindLabels, sourceTypeLabels } from '@/i18n/labels'
import { VillagePhoto } from '@/components/brand/VillagePhoto'
import { EmptyState } from '@/components/feedback/States'
import { Badge } from '@/components/ui/Badge'
import { useI18n } from '@/hooks/useI18n'
import { PopulationChart, PopulationLegend } from './PopulationChart'

/** A section of the village article: eyebrow, heading and content. */
export function ArticleSection({ id, eyebrow, title, aside, children }: { id: string; eyebrow: string; title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-40 border-b border-stone-line pb-12 last:border-0">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="mb-2 block text-xs font-extrabold tracking-[0.08em] text-accent-dark uppercase">{eyebrow}</span>
          <h2 id={`${id}-h`} className="text-2xl font-bold text-forest sm:text-[28px]">
            {title}
          </h2>
        </div>
        {aside}
      </div>
      {children}
    </section>
  )
}

export function PopulationBlock({ records, sources }: { records: PopulationRecord[]; sources: Source[] }) {
  const { t, pick, formatNumber } = useI18n()
  const sorted = [...records].sort((a, b) => a.year - b.year)
  const sourceTitle = (id: string) => sources.find((s) => s.id === id)?.title ?? '—'

  if (!sorted.length) return <EmptyState title={t('No population records', 'لا توجد سجلات سكانية')} description={t('Population data for this village is still being collected.', 'ما زالت بيانات السكان لهذه القرية قيد الجمع.')} />

  return (
    <div className="space-y-5">
      <div className="rounded-[14px] border border-stone-line bg-white p-5">
        <div className="mb-3 flex justify-end">
          <PopulationLegend />
        </div>
        <PopulationChart records={sorted} />
      </div>
      <div className="overflow-x-auto rounded-[14px] border border-stone-line bg-white">
        <table className="w-full min-w-[520px] text-sm">
          <caption className="sr-only">{t('Population records', 'السجلات السكانية')}</caption>
          <thead className="bg-paper text-xs text-muted">
            <tr>
              <th scope="col" className="px-4 py-3 text-start font-bold">{t('Year', 'السنة')}</th>
              <th scope="col" className="px-4 py-3 text-start font-bold">{t('Population', 'السكان')}</th>
              <th scope="col" className="px-4 py-3 text-start font-bold">{t('Type', 'النوع')}</th>
              <th scope="col" className="px-4 py-3 text-start font-bold">{t('Source', 'المصدر')}</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={r.id} className="border-t border-stone-line">
                <td className="px-4 py-3 font-latin font-bold text-forest">{r.year}</td>
                <td className="px-4 py-3 font-latin">{formatNumber(r.population)}</td>
                <td className="px-4 py-3">
                  <Badge tone={r.kind === 'estimate' ? 'gold' : 'olive'}>{pick(populationKindLabels[r.kind])}</Badge>
                </td>
                <td className="max-w-xs px-4 py-3 text-xs text-muted" dir="auto">
                  <span className="line-clamp-1" title={sourceTitle(r.sourceId)}>
                    {sourceTitle(r.sourceId)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="border-t border-stone-line bg-gold-50 px-4 py-2.5 text-xs text-[#7a5f2b]">
          {t('Each figure links to its source; estimates are marked as such.', 'لكل رقم مصدره المذكور، والتقديرات مُعلَّمة بأنها تقديرات.')}
        </p>
      </div>
    </div>
  )
}

export function Timeline({ village }: { village: Village }) {
  const { pick, t } = useI18n()
  const events = village.history.events
  if (!events.length) return <p className="text-sm text-muted">{t('No events documented yet.', 'لم تُوثّق أحداث بعد.')}</p>
  return (
    <ol className="relative mt-6 space-y-7 border-s-2 border-accent-50 ps-7">
      {events.map((e) => (
        <li key={e.id} className="relative">
          <span className="absolute -start-[2.25rem] top-1.5 size-3.5 rounded-full border-[3px] border-white bg-accent ring-1 ring-accent/40" aria-hidden />
          <small className="font-latin text-xs font-bold text-accent-dark" dir="ltr">
            {e.year}
          </small>
          <h3 className="mt-0.5 text-lg font-bold text-forest">{pick(e.title)}</h3>
          <p className="mt-1 text-sm leading-loose text-muted">{pick(e.description)}</p>
        </li>
      ))}
    </ol>
  )
}

export function HeritageGrid({ village }: { village: Village }) {
  const { pick, t } = useI18n()
  if (!village.heritage.length) {
    return <EmptyState icon={<Landmark className="size-7" />} title={t('No landmarks documented yet', 'لم تُوثّق معالم بعد')} description={t('Know a landmark here? Contributors can submit one for review.', 'هل تعرف معلمًا هنا؟ يمكن للمساهمين إرساله للمراجعة.')} />
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {village.heritage.map((h) => (
        <article key={h.id} className="group overflow-hidden rounded-[14px] border border-stone-line bg-white">
          <VillagePhoto
            village={{ id: h.id, art: village.art }}
            src={h.image}
            alt={pick(h.name)}
            className="h-44"
            imgClassName="transition-transform duration-500 group-hover:scale-[1.04]"
          />
          <div className="p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="olive">{pick(heritageKindLabels[h.kind])}</Badge>
              {h.period && <span className="text-xs text-muted">{pick(h.period)}</span>}
            </div>
            <h3 className="mt-2 text-base font-bold text-forest">{pick(h.name)}</h3>
            <p className="mt-1 text-[13px] leading-relaxed text-muted">{pick(h.description)}</p>
          </div>
        </article>
      ))}
    </div>
  )
}

const facilityIcons: Record<FacilityKind, typeof Users> = {
  school: GraduationCap,
  clinic: HeartPulse,
  library: Library,
  community: Users,
  mosque: Moon,
  church: Church,
  council: Building,
  other: Store,
}

/** Quiet placeholder for a profile section that has no content yet. */
export function NoInfo() {
  const { t } = useI18n()
  return <p className="rounded-xl border border-dashed border-stone-line bg-white px-4 py-5 text-center text-sm text-muted">{t('No information available yet.', 'لا تتوفر معلومات بعد.')}</p>
}

export function Facilities({ village }: { village: Village }) {
  const { pick, formatNumber } = useI18n()
  if (!village.facilities.length) return <NoInfo />
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
      {village.facilities.map((f) => {
        const Icon = facilityIcons[f.kind]
        return (
          <div key={f.id} className="flex items-center gap-3 rounded-xl border border-stone-line bg-white p-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-50 text-forest">
              <Icon className="size-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <b className="block font-latin text-xl leading-tight text-forest">{f.count !== undefined ? formatNumber(f.count) : '1'}</b>
              <span className="block truncate text-xs text-muted" title={pick(f.name)}>
                {pick(f.name)}
              </span>
              <span className="text-[11px] text-sage">{pick(facilityKindLabels[f.kind])}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function Agriculture({ village }: { village: Village }) {
  const { pick, t } = useI18n()
  const { practices, crops, economy } = village.agriculture
  const general = practices ? pick(practices) : ''
  const perCrop = crops.some((c) => c.practices && pick(c.practices))
  if (!general && !crops.length && !economy.length && !village.culture.length) return <NoInfo />
  return (
    <div className="space-y-5">
      {general && <p className="leading-loose text-[#475569]">{general}</p>}
      {crops.length > 0 && (
        <div>
          <h3 className="mb-2.5 text-sm font-bold text-forest">{t('Major crops', 'المحاصيل الرئيسية')}</h3>
          {perCrop ? (
            <ul className="grid gap-3 sm:grid-cols-2">
              {crops.map((c, i) => (
                <li key={`${c.en}-${i}`} className="rounded-xl border border-olive-200 bg-accent-50/60 p-4">
                  <b className="block text-[15px] text-forest">{pick(c)}</b>
                  {c.practices && pick(c.practices) && (
                    <p className="mt-1.5 text-[13px] leading-relaxed text-[#475569]">
                      <span className="font-semibold text-forest/80">{t('Practices', 'الممارسات')}: </span>
                      {pick(c.practices)}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {crops.map((c, i) => (
                <li key={`${c.en}-${i}`} className="rounded-full border border-olive-200 bg-accent-50 px-3.5 py-1.5 text-[13px] font-bold text-forest">
                  {pick(c)}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {economy.length > 0 && (
        <div>
          <h3 className="mb-2.5 text-sm font-bold text-forest">{t('Local economy', 'الاقتصاد المحلي')}</h3>
          <ul className="flex flex-wrap gap-2">
            {economy.map((e, i) => (
              <li key={`${e.en}-${i}`} className="rounded-full border border-stone-line bg-white px-3.5 py-1.5 text-[13px] text-[#475569]">
                {pick(e)}
              </li>
            ))}
          </ul>
        </div>
      )}
      {village.culture.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {village.culture.map((c) => (
            <div key={c.id} className="rounded-xl border border-stone-line bg-white p-4">
              {c.category && <p className="text-[11px] font-bold uppercase tracking-wide text-olive">{pick(culturalCategoryLabels[c.category])}</p>}
              <p className="text-sm font-bold text-forest">{pick(c.title)}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-muted">{pick(c.description)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const sourceIcons: Record<SourceType, typeof BookOpen> = {
  book: BookOpen,
  article: Newspaper,
  archive: FileText,
  census: Users,
  website: ExternalLink,
  'oral-history': Mic,
  map: MapIcon,
}

export function SourcesList({ sources, emptyLabel }: { sources: Source[]; emptyLabel: string }) {
  const { pick, formatDate } = useI18n()
  if (!sources.length) return <p className="text-sm text-muted">{emptyLabel}</p>
  return (
    <ol className="grid gap-2.5">
      {sources.map((s, i) => {
        const Icon = sourceIcons[s.type]
        return (
          <li key={s.id} className="flex items-start gap-3.5 rounded-xl border border-stone-line bg-white p-4">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent-50 font-latin text-xs font-bold text-forest">{i + 1}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-forest" dir="auto">
                {s.title}
              </p>
              <p className="mt-1 text-xs text-muted" dir="auto">
                {[s.author, s.organization, s.reference].filter(Boolean).join(' — ')} · {formatDate(s.publishedAt, { year: 'numeric' })} · {pick(sourceTypeLabels[s.type])}
              </p>
              {s.url && (
                <a href={s.url} target="_blank" rel="noreferrer" className="mt-1.5 inline-flex items-center gap-1 text-xs font-bold break-all text-accent-dark hover:underline">
                  {s.url.replace(/^https?:\/\//, '')}
                  <ExternalLink className="size-3.5 shrink-0" aria-hidden />
                </a>
              )}
            </div>
            <Icon className="size-5 shrink-0 text-muted" aria-hidden />
          </li>
        )
      })}
    </ol>
  )
}
