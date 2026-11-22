import { Link } from 'react-router'
import { Check, ChevronLeft, Clock, MapPin } from 'lucide-react'
import type { Village } from '@/types'
import { verificationLabels } from '@/i18n/labels'
import { VillagePhoto } from '@/components/brand/VillagePhoto'
import { useI18n } from '@/hooks/useI18n'
import { cn } from '@/utils/cn'
import { governorateName } from '../utils'

interface Props {
  village: Village
  layout?: 'grid' | 'list'
  className?: string
  /** Kept for API compatibility with earlier callers. */
  catalogue?: string
}

export function VerifiedPill({ village }: { village: Village }) {
  const { pick } = useI18n()
  const verified = village.verification === 'verified'
  return (
    <span className="absolute start-3 top-3 z-10 flex items-center gap-1 rounded-full border border-white/45 bg-forest-800/85 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-md">
      {verified ? <Check className="size-3" aria-hidden /> : <Clock className="size-3" aria-hidden />}
      {pick(verificationLabels[village.verification])}
    </span>
  )
}

/** Village card: photo, verification pill, governorate, bilingual name and summary. */
export function VillageCard({ village, layout = 'grid', className }: Props) {
  const { t, pick, lang } = useI18n()
  const gov = pick(governorateName(village.governorateId))
  const primary = lang === 'ar' ? village.name.ar : village.name.en
  const secondary = lang === 'ar' ? village.name.en : village.name.ar

  return (
    <article
      className={cn(
        'group relative overflow-hidden rounded-[14px] border border-stone-line bg-white shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-lift',
        layout === 'list' && 'grid sm:grid-cols-[260px_1fr]',
        className,
      )}
    >
      <div className={cn('relative', layout === 'list' ? 'h-52 sm:h-full sm:min-h-[190px]' : 'h-[215px]')}>
        <VillagePhoto village={village} alt={t(`View of ${village.name.en}`, `منظر من قرية ${village.name.ar}`)} className="h-full" imgClassName="transition-transform duration-500 group-hover:scale-[1.04]" />
        <VerifiedPill village={village} />
        {village.depopulated && (
          <span className="absolute end-3 bottom-3 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
            {t(`Depopulated ${village.depopulated.year}`, `هُجّرت ${village.depopulated.year}`)}
          </span>
        )}
      </div>
      <div className={cn('p-5', layout === 'list' && 'self-center')}>
        <p className="flex items-center gap-1 text-xs font-bold text-sage">
          <MapPin className="size-[15px]" aria-hidden />
          {t(`${gov} Governorate`, `محافظة ${gov}`)}
        </p>
        <h3 className="my-1.5 flex flex-wrap items-baseline gap-2">
          <span className="text-[23px] leading-snug font-bold text-forest">{primary}</span>
          <small className={cn('text-xs font-medium text-[#94a3b8]', lang === 'ar' ? 'font-latin' : 'font-arabic')}>{secondary}</small>
        </h3>
        <p className="line-clamp-2 min-h-[46px] text-[13px] leading-[1.9] text-muted">{pick(village.summary)}</p>
        <Link
          to={`/villages/${village.id}`}
          className="mt-3.5 inline-flex items-center gap-1 text-xs font-bold text-forest after:absolute after:inset-0 hover:text-accent-dark"
        >
          {t('Discover the village', 'اكتشف القرية')}
          <ChevronLeft className="size-4 transition-transform group-hover:-translate-x-0.5 ltr:rotate-180 ltr:group-hover:translate-x-0.5" aria-hidden />
        </Link>
      </div>
    </article>
  )
}
