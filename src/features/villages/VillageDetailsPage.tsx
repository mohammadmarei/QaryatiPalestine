import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import { ChevronLeft, Compass, Eye, FilePlus2, Map as MapIcon, MapPin, Pencil, Share2, ShieldCheck } from 'lucide-react'
import { recordStatusLabels, verificationLabels } from '@/i18n/labels'
import { VillagePhoto } from '@/components/brand/VillagePhoto'
import { EmptyState } from '@/components/feedback/States'
import { SectionHeading } from '@/components/layout/Sections'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Breadcrumbs } from '@/components/ui/Misc'
import { useAuth } from '@/hooks/useAuth'
import { useData } from '@/hooks/useData'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useI18n } from '@/hooks/useI18n'
import { useToast } from '@/hooks/useToast'
import { cn, container } from '@/utils/cn'
import { VillageMap } from '../map/components/VillageMap'
import { VillageCard } from './components/VillageCard'
import { Agriculture, ArticleSection, Facilities, HeritageGrid, PopulationBlock, SourcesList, Timeline } from './components/ProfileSections'
import { governorateName, isPublic } from './utils'

function useScrollSpy(ids: string[]) {
  const [active, setActive] = useState(ids[0])
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: '-30% 0px -60% 0px' },
    )
    ids.forEach((id) => {
      const el = document.getElementById(id)
      if (el) obs.observe(el)
    })
    return () => obs.disconnect()
  }, [ids])
  return active
}

export function VillageDetailsPage() {
  const { id = '' } = useParams()
  const { t, pick, formatNumber, formatDate } = useI18n()
  const { villages, population, sources } = useData()
  const { user } = useAuth()
  const toast = useToast()
  const village = villages.find((v) => v.id === id)
  useDocumentTitle(village ? `${village.name.ar} · ${village.name.en}` : t('Village not found', 'القرية غير موجودة'))

  const sectionIds = useMemo(() => ['overview', 'population', 'history', 'heritage', 'agriculture', 'facilities', 'location', 'sources'], [])
  const active = useScrollSpy(sectionIds)

  if (!village || (!isPublic(village) && !user)) {
    return (
      <div className={cn(container, 'py-24')}>
        <EmptyState
          icon={<Compass className="size-7" />}
          title={t('This village profile could not be found', 'تعذّر العثور على ملف هذه القرية')}
          description={t('It may have been renamed, unpublished or not yet documented.', 'ربما تغيّر اسمه أو أُلغي نشره أو لم يُوثّق بعد.')}
          action={<ButtonLink to="/villages">{t('Back to villages', 'العودة إلى القرى')}</ButtonLink>}
        />
      </div>
    )
  }

  const records = population.filter((p) => p.villageId === village.id)
  const villageSources = sources.filter((s) => village.sourceIds.includes(s.id) || s.villageIds.includes(village.id))
  const gov = pick(governorateName(village.governorateId))
  const latest = [...records].filter((r) => r.kind !== 'estimate').sort((a, b) => b.year - a.year)[0]
  const nearbyVillages = village.nearby.flatMap((n) => villages.filter((v) => n.villageId && v.id === n.villageId && isPublic(v)))
  const related = villages.filter((v) => v.id !== village.id && isPublic(v) && (v.governorateId === village.governorateId || nearbyVillages.some((n) => n.id === v.id)))
  const relatedList = (related.length ? related : villages.filter((v) => v.id !== village.id && v.featured && isPublic(v))).slice(0, 3)
  const coords = `${village.coordinates.lat.toFixed(2)}°N, ${village.coordinates.lng.toFixed(2)}°E`
  const sourcesForPopulation = [...new Set(records.map((r) => sources.find((s) => s.id === r.sourceId)).map((s) => s?.author ?? s?.organization).filter(Boolean))].slice(0, 1)[0]

  const nav = [
    { id: 'overview', label: t('Overview', 'نظرة عامة') },
    { id: 'population', label: t('Population', 'السكان') },
    { id: 'history', label: t('History', 'التاريخ') },
    { id: 'heritage', label: t('Heritage & landmarks', 'التراث والمعالم') },
    { id: 'agriculture', label: t('Agriculture & economy', 'الزراعة والاقتصاد') },
    { id: 'facilities', label: t('Facilities', 'المرافق') },
    { id: 'location', label: t('Location', 'الموقع') },
    { id: 'sources', label: t('Sources', 'المصادر') },
  ]

  const share = async () => {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title: `${village.name.ar} · ${village.name.en} — Qaryati`, url })
        return
      }
      await navigator.clipboard.writeText(url)
      toast.success(t('Link copied', 'تم نسخ الرابط'))
    } catch {
      /* share sheet dismissed */
    }
  }

  const facts = [
    { k: t('Area', 'المساحة'), v: village.areaDunums !== undefined ? t(`${formatNumber(village.areaDunums)} dunums`, `${formatNumber(village.areaDunums)} دونم`) : '—' },
    { k: t('Elevation', 'الارتفاع'), v: village.elevationM !== undefined ? `${formatNumber(village.elevationM)} ${t('m', 'م')}` : '—' },
    { k: t('Population', 'السكان'), v: latest ? t(`${formatNumber(latest.population)} (${latest.year})`, `${formatNumber(latest.population)} نسمة (${latest.year})`) : '—' },
    { k: t('Coordinates', 'الإحداثيات'), v: coords, ltr: true },
  ]

  return (
    <div>
      {/* Cover */}
      <section className="relative h-[440px] text-white sm:h-[480px]">
        <VillagePhoto village={village} alt={village.coverCaption || t(`View of ${village.name.en}`, `منظر من قرية ${village.name.ar}`)} className="absolute inset-0" eager />
        <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(6,33,29,.92),rgba(6,33,29,.05)_70%)]" aria-hidden />
        <div className={cn(container, 'relative flex h-full flex-col justify-end pb-11')}>
          <Breadcrumbs tone="light" items={[{ label: t('Home', 'الرئيسية'), to: '/' }, { label: t('Villages', 'القرى'), to: '/villages' }, { label: pick(village.name) }]} className="mb-auto pt-7" />
          {!isPublic(village) && (
            <span className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-gold px-3 py-1 text-xs font-bold text-forest-800">
              <Eye className="size-3.5" /> {t('Team preview — not public', 'معاينة الفريق — غير منشور')}
            </span>
          )}
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-white/30 bg-white/15 px-3 py-1.5 text-xs font-bold backdrop-blur-md">
            <ShieldCheck className="size-[15px]" aria-hidden />
            {pick(verificationLabels[village.verification])}
          </span>
          <h1 className="mt-3 flex flex-wrap items-baseline gap-3 text-5xl font-bold sm:text-6xl">
            {pick(village.name)}
            <small className="text-lg font-medium text-white/70">{village.name.ar === pick(village.name) ? village.name.en : village.name.ar}</small>
          </h1>
          <p className="mt-3 flex items-center gap-1.5 text-[#d9e3e1]">
            <MapPin className="size-[18px]" aria-hidden />
            {t(`${gov} Governorate`, `محافظة ${gov}`)} · {pick(village.adminArea)}
          </p>
          {village.depopulated && <p className="mt-3 max-w-xl rounded-xl bg-black/30 px-4 py-2.5 text-sm backdrop-blur">{pick(village.depopulated.note)}</p>}
        </div>
        {village.coverImage && village.coverCaption && (
          <p className="absolute end-3 bottom-2 max-w-[70%] truncate text-[11px] text-white/70" dir="auto" title={village.coverCaption}>
            {t('Photo: ', 'صورة: ')}
            {village.coverCaption}
          </p>
        )}
      </section>

      {/* Section tabs */}
      <nav aria-label={t('Profile sections', 'أقسام الملف')} className="sticky top-[78px] z-30 border-b border-stone-line bg-white">
        <div className={cn(container, 'no-scrollbar flex gap-7 overflow-x-auto')}>
          {nav.map((n) => (
            <a
              key={n.id}
              href={`#${n.id}`}
              onClick={(e) => {
                e.preventDefault()
                document.getElementById(n.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
              aria-current={active === n.id ? 'location' : undefined}
              className={cn('relative shrink-0 py-4 text-sm font-bold whitespace-nowrap transition', active === n.id ? 'text-forest' : 'text-muted hover:text-forest')}
            >
              {n.label}
              {active === n.id && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-accent" aria-hidden />}
            </a>
          ))}
        </div>
      </nav>

      <div className={cn(container, 'grid gap-10 py-14 lg:grid-cols-[1fr_320px]')}>
        <article className="min-w-0 space-y-12">
          <ArticleSection id="overview" eyebrow={t('Overview', 'نظرة عامة')} title={t(`${village.name.en} at a glance`, `${village.name.ar} في سطور`)}>
            <p className="text-lg leading-loose font-semibold text-forest">{pick(village.summary)}</p>
            {pick(village.description) && pick(village.description) !== pick(village.summary) && <p className="mt-3 text-[16px] leading-loose text-[#475569]">{pick(village.description)}</p>}
            <div className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-4">
              {facts.map((f) => (
                <div key={f.k} className="rounded-xl border border-stone-line bg-white p-4">
                  <small className="block text-xs text-muted">{f.k}</small>
                  <b className="mt-1 block text-sm text-forest" dir={f.ltr ? 'ltr' : undefined}>
                    {f.v}
                  </b>
                </div>
              ))}
            </div>
            {village.nearby.length > 0 && (
              <div className="mt-6">
                <h3 className="mb-2.5 text-sm font-bold text-forest">{t('Nearby villages & cities', 'قرى ومدن مجاورة')}</h3>
                <ul className="flex flex-wrap gap-2">
                  {village.nearby.map((n, i) => (
                    <li key={`${n.villageId ?? n.name.en}-${i}`}>
                      {n.villageId ? (
                        <Link to={`/villages/${n.villageId}`} className="inline-block rounded-full border border-olive-200 bg-accent-50 px-3 py-1 text-xs font-bold text-forest hover:border-accent">
                          {pick(n.name)} · {formatNumber(n.distanceKm)} {t('km', 'كم')}
                        </Link>
                      ) : (
                        <span className="inline-block rounded-full border border-stone-line bg-white px-3 py-1 text-xs text-[#475569]">
                          {pick(n.name)} · {formatNumber(n.distanceKm)} {t('km', 'كم')}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </ArticleSection>

          <ArticleSection
            id="population"
            eyebrow={t('Demographics', 'الديموغرافيا')}
            title={t('Population over time', 'التطور السكاني')}
            aside={sourcesForPopulation && <span className="rounded-full bg-accent-50 px-3 py-1.5 text-xs font-bold text-forest">{t(`Source: ${sourcesForPopulation}`, `المصدر: ${sourcesForPopulation}`)}</span>}
          >
            <PopulationBlock records={records} sources={sources} />
          </ArticleSection>

          <ArticleSection id="history" eyebrow={t('Through time', 'عبر الزمن')} title={t('Historical background', 'خلفية تاريخية')}>
            {pick(village.history.overview) && <p className="leading-loose text-[#475569]">{pick(village.history.overview)}</p>}
            {(village.history.nameOrigin.ar || village.history.nameOrigin.en) && (
              <blockquote className="mt-5 rounded-xl border-s-4 border-gold bg-gold-50 px-5 py-4 text-[15px] text-forest">
                <b className="mb-1 block text-xs text-[#8a6d33]">{t('Origin of the name', 'أصل التسمية')}</b>
                {pick(village.history.nameOrigin)}
              </blockquote>
            )}
            {village.historicalNames.length > 0 && (
              <ul className="mt-5 flex flex-wrap gap-2">
                {village.historicalNames.map((h, i) => (
                  <li key={`${h.name.en}-${i}`} className="rounded-lg border border-stone-line bg-white px-3 py-2 text-sm">
                    <b className="text-forest">{pick(h.name)}</b>
                    {h.period && (
                      <span className="text-xs text-muted">
                        {' '}
                        · <bdi>{h.period}</bdi>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <Timeline village={village} />
          </ArticleSection>

          <ArticleSection id="heritage" eyebrow={t('Cultural identity', 'الهوية الثقافية')} title={t('Heritage & landmarks', 'التراث والمعالم')}>
            <HeritageGrid village={village} />
          </ArticleSection>

          <ArticleSection id="agriculture" eyebrow={t('Land & livelihood', 'الأرض والرزق')} title={t('Agriculture & economy', 'الزراعة والاقتصاد')}>
            <Agriculture village={village} />
          </ArticleSection>

          <ArticleSection id="facilities" eyebrow={t('Services', 'الخدمات')} title={t('Public facilities', 'المرافق العامة')}>
            <Facilities village={village} />
          </ArticleSection>

          <ArticleSection id="location" eyebrow={t('Geography', 'الجغرافيا')} title={t('Location', 'الموقع')}>
            <div className="h-[340px] overflow-hidden rounded-[14px] border border-stone-line">
              <VillageMap
                villages={[village, ...nearbyVillages]}
                selectedId={village.id}
                secondaryIds={nearbyVillages.map((v) => v.id)}
                center={[village.coordinates.lat, village.coordinates.lng]}
                zoom={12}
                scrollWheelZoom={false}
                className="h-full w-full"
              />
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="font-latin text-sm text-muted" dir="ltr">
                {village.coordinates.lat.toFixed(4)}° N, {village.coordinates.lng.toFixed(4)}° E
              </p>
              <ButtonLink to={`/map?village=${village.id}`} variant="secondary" icon={<MapIcon className="size-4" />}>
                {t('Open the interactive map', 'فتح الخريطة التفاعلية')}
              </ButtonLink>
            </div>
          </ArticleSection>

          <ArticleSection id="sources" eyebrow={t('Documentation', 'التوثيق')} title={t('Sources & references', 'المصادر والمراجع')}>
            <SourcesList sources={villageSources} emptyLabel={t('No sources linked yet.', 'لم تُربط مصادر بعد.')} />
          </ArticleSection>
        </article>

        <aside className="space-y-4 lg:sticky lg:top-[150px] lg:self-start">
          <div className="rounded-[14px] border border-stone-line bg-white p-5">
            <h3 className="text-base font-bold text-forest">{t('Village card', 'بطاقة القرية')}</h3>
            <dl className="mt-3 divide-y divide-stone-line text-sm">
              {[
                [t('Historical name', 'الاسم التاريخي'), village.historicalNames[0] ? pick(village.historicalNames[0].name) : '—'],
                [t('Also spelled', 'تُكتب أيضًا'), village.altSpellings.join('، ') || '—'],
                [t('Governorate', 'المحافظة'), gov],
                [t('Record status', 'حالة السجل'), pick(recordStatusLabels[village.status])],
                [t('Last updated', 'آخر تحديث'), formatDate(village.updatedAt, { day: 'numeric', month: 'long', year: 'numeric' })],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 py-2.5">
                  <dt className="text-muted">{k}</dt>
                  <dd className="text-end font-bold text-forest">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-4 grid gap-2">
              <Button variant="secondary" onClick={share} icon={<Share2 className="size-4" />} className="w-full">
                {t('Share', 'مشاركة')}
              </Button>
              {user ? (
                <ButtonLink to={`/dashboard/villages/${village.id}/edit`} variant="secondary" icon={<Pencil className="size-4" />} className="w-full">
                  {t('Edit profile', 'تعديل الملف')}
                </ButtonLink>
              ) : (
                <ButtonLink to="/login" state={{ from: `/dashboard/villages/${village.id}/edit` }} variant="secondary" icon={<Pencil className="size-4" />} className="w-full">
                  {t('Sign in to suggest an edit', 'سجّل الدخول لاقتراح تعديل')}
                </ButtonLink>
              )}
            </div>
          </div>
          <div className="rounded-[14px] bg-forest p-5 text-white">
            <span className="grid size-10 place-items-center rounded-xl bg-white/10 text-gold">
              <FilePlus2 className="size-5" aria-hidden />
            </span>
            <h3 className="mt-3 text-base font-bold">{t(`Have a document about ${village.name.en}?`, `هل لديك وثيقة عن ${village.name.ar}؟`)}</h3>
            <p className="mt-1 text-[13px] text-[#c3d1ce]">{t('Contribute a photo, an oral story or a trusted reference.', 'ساهم بصورة أو رواية شفوية أو مرجع موثوق.')}</p>
            <ButtonLink to={user ? '/dashboard/heritage' : '/register'} variant="gold" className="mt-4 w-full">
              {t('Add a contribution', 'أضف مساهمة')}
            </ButtonLink>
          </div>
        </aside>
      </div>

      {relatedList.length > 0 && (
        <section className="bg-mint py-16" aria-labelledby="related-h">
          <div className={container}>
            <SectionHeading
              id="related-h"
              title={t('Nearby villages you may like', 'قرى قريبة قد تهمك')}
              action={
                <ButtonLink to="/villages" variant="ghost">
                  {t('Show more', 'عرض المزيد')}
                  <ChevronLeft className="size-4 ltr:rotate-180" aria-hidden />
                </ButtonLink>
              }
            />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {relatedList.map((v) => (
                <VillageCard key={v.id} village={v} className="h-full" />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
