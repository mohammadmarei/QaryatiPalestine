import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { BookOpen, Building2, Check, ChevronLeft, FileText, Mail, Map as MapIcon, MessageSquareText, Search, UsersRound } from 'lucide-react'
import { governorates } from '@/data/governorates'
import { images } from '@/data/images'
import { ButtonLink, Button, buttonClass } from '@/components/ui/Button'
import { mailtoContact } from '@/config/contact'
import { Reveal } from '@/components/ui/Reveal'
import { SectionHeading } from '@/components/layout/Sections'
import { useData } from '@/hooks/useData'
import { useI18n } from '@/hooks/useI18n'
import { cn, container } from '@/utils/cn'
import { VillageCard } from '../villages/components/VillageCard'
import { isPublic } from '../villages/utils'

export function HeroSection() {
  const { t, lang } = useI18n()
  const navigate = useNavigate()
  const { villages } = useData()
  const [q, setQ] = useState('')

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    navigate(`/villages${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`)
  }

  // Shortcuts to featured published villages first, then other published ones.
  const quick = villages.filter(isPublic).sort((a, b) => Number(b.featured) - Number(a.featured)).slice(0, 4)

  return (
    <section className="relative min-h-[610px] overflow-hidden text-white">
      <img src={images.hero} alt={t('A Palestinian village among green hills', 'قرية فلسطينية بين التلال الخضراء')} className="absolute inset-0 h-full w-full object-cover" fetchPriority="high" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,36,31,.48),rgba(5,36,31,.94)_68%)] ltr:bg-[linear-gradient(-90deg,rgba(5,36,31,.48),rgba(5,36,31,.94)_68%)]" aria-hidden />
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_2px_2px,white_1px,transparent_0)] [background-size:32px_32px] opacity-[0.09] [mask-image:linear-gradient(to_left,#000,transparent_65%)] ltr:[mask-image:linear-gradient(to_right,#000,transparent_65%)]"
        aria-hidden
      />

      <div className={cn(container, 'relative z-10 pt-20 pb-20 sm:pt-[105px]')}>
        <p className="flex animate-fade-up items-center gap-2.5 text-[13px] font-bold text-[#d9e7e4]">
          <i className="h-px w-[26px] bg-gold" aria-hidden />
          {t('The memory of place, kept for generations', 'ذاكرة المكان، محفوظة للأجيال')}
        </p>
        <h1 className="mt-4 mb-4 max-w-[700px] animate-fade-up text-[42px] leading-[1.25] font-bold tracking-[-0.04em] [animation-delay:80ms] sm:text-[clamp(42px,5.4vw,68px)] ltr:sm:text-[clamp(40px,4.6vw,58px)]">
          {t('Every village is a story,', 'كل قرية حكاية،')}
          <br />
          <em className="text-gold-light not-italic">{t('and every story a homeland.', 'وكل حكاية وطن.')}</em>
        </h1>
        <p className="mb-7 max-w-[610px] animate-fade-up text-[17px] leading-loose text-[#d9e3e1] [animation-delay:160ms]">
          {t(
            'A knowledge platform documenting the memory of Palestinian villages — their history, land and heritage — in a trusted reference open to everyone.',
            'منصة معرفية توثّق ذاكرة القرى الفلسطينية، وتجمع تاريخها وأرضها وتراثها في مرجع موثوق ومتاح للجميع.',
          )}
        </p>

        <form onSubmit={onSubmit} role="search" className="flex h-[62px] w-full max-w-[650px] animate-fade-up items-center gap-3 rounded-xl bg-white py-2 ps-[18px] pe-2.5 text-muted shadow-[0_15px_45px_rgba(0,0,0,.22)] [animation-delay:240ms]">
          <Search className="size-5 shrink-0" aria-hidden />
          <label htmlFor="hero-search" className="sr-only">
            {t('Search for a village', 'ابحث عن قرية')}
          </label>
          <input
            id="hero-search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('Search a village, governorate, or landmark…', 'ابحث عن قرية، محافظة، أو معلم...')}
            className="min-w-0 flex-1 bg-transparent px-1 text-ink outline-none placeholder:text-muted/80"
          />
          <Button type="submit" className="h-[46px] min-w-[82px]">
            {t('Search', 'بحث')}
          </Button>
        </form>

        <div className="mt-4 flex flex-wrap items-center gap-2.5 text-xs text-[#b8cbc7]">
          <span>{t('Popular:', 'بحث شائع:')}</span>
          {quick.map((v) => (
            <Link key={v.id} to={`/villages/${v.id}`} className="border-b border-white/30 px-0.5 py-0.5 text-white transition hover:border-gold">
              {lang === 'ar' ? v.name.ar : v.name.en}
            </Link>
          ))}
        </div>

        <Link to="/map" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-gold-light transition hover:text-white">
          <MapIcon className="size-4" aria-hidden />
          {t('Or browse every village on the interactive map', 'أو تصفّح القرى على الخريطة التفاعلية')}
          <ChevronLeft className="size-4 ltr:rotate-180" aria-hidden />
        </Link>
      </div>
    </section>
  )
}

export function StatsStrip() {
  const { t, formatNumber } = useI18n()
  const { villages, population, sources, users } = useData()
  const published = villages.filter(isPublic).length
  const facts = villages.reduce((n, v) => n + v.history.events.length + v.heritage.length + v.facilities.length + v.nearby.length, 0) + population.length

  const stats = [
    { value: formatNumber(published), label: t('Villages documented', 'قرية وبلدة موثّقة'), icon: Building2 },
    { value: formatNumber(facts), label: t('Documented facts', 'معلومة موثّقة'), icon: MessageSquareText },
    { value: formatNumber(sources.length), label: t('Sources & references', 'مصدر ومرجع'), icon: FileText },
    { value: formatNumber(users.length), label: t('Researchers & contributors', 'باحثًا ومساهمًا'), icon: UsersRound },
  ]

  return (
    <section className="border-b border-stone-line bg-white" aria-label={t('Platform figures', 'أرقام المنصة')}>
      <div className={cn(container, 'grid grid-cols-2 gap-y-4 py-6 lg:grid-cols-4')}>
        {stats.map((s, i) => (
          <div key={s.label} className={cn('flex justify-center border-stone-line px-4 py-2 sm:px-6', i % 2 === 0 && 'border-e', i === 1 && 'lg:border-e')}>
            {/* Fixed-width block: every card is laid out the same, whatever its label length. */}
            <div className="flex w-full max-w-[13.5rem] items-center gap-3.5">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent-50 text-forest">
                <s.icon className="size-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <strong className="block font-latin text-2xl leading-tight font-bold text-forest">{s.value}</strong>
                <small className="mt-1 block text-xs text-muted">{s.label}</small>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export function GovernoratesSection() {
  const { t, pick, formatNumber } = useI18n()
  const { villages } = useData()
  const [showAll, setShowAll] = useState(false)
  const count = (id: string) => villages.filter((v) => isPublic(v) && v.governorateId === id).length
  const ranked = [...governorates].sort((a, b) => count(b.id) - count(a.id))
  const list = showAll ? ranked : ranked.slice(0, 6)

  return (
    <section className={cn(container, 'py-[92px]')} aria-labelledby="gov-title">
      <SectionHeading
        id="gov-title"
        eyebrow={t('Explore by region', 'استكشف حسب المنطقة')}
        title={t('Governorates of Palestine', 'محافظات فلسطين')}
        body={t('A journey through the villages and towns of the homeland.', 'رحلة معرفية عبر قرى ومدن الوطن، من الشمال إلى الجنوب.')}
        action={
          <Button variant="ghost" onClick={() => setShowAll((s) => !s)} aria-expanded={showAll}>
            {showAll ? t('Show fewer', 'عرض أقل') : t('Show all governorates', 'عرض جميع المحافظات')}
            <ChevronLeft className={cn('size-[17px] ltr:rotate-180', showAll && '-rotate-90 ltr:-rotate-90')} aria-hidden />
          </Button>
        }
      />
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {list.map((g, i) => (
          <li key={g.id} className="animate-fade-up" style={{ animationDelay: `${(i % 6) * 40}ms` }}>
            <Link
              to={`/villages?gov=${g.id}`}
              className="group relative block h-full min-h-[180px] overflow-hidden rounded-[13px] border border-stone-line bg-white p-5 text-forest transition duration-300 hover:-translate-y-1 hover:border-[#c5d7d2] hover:shadow-lift"
            >
              <span className="absolute end-3.5 top-3 font-latin text-[11px] font-semibold text-[#cbd5d3]">{String(i + 1).padStart(2, '0')}</span>
              <span className="mb-6 grid size-[46px] place-items-center rounded-xl bg-accent-50 text-forest">
                <Building2 className="size-5" aria-hidden />
              </span>
              <b className="block text-base">{pick(g.name)}</b>
              <small className="mt-1 block text-xs text-muted">{t(`${formatNumber(count(g.id))} villages`, `${formatNumber(count(g.id))} قرية`)}</small>
              <ChevronLeft className="absolute end-4 bottom-5 size-[18px] text-sage transition group-hover:-translate-x-1 ltr:rotate-180 ltr:group-hover:translate-x-1" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function FeaturedSection() {
  const { t } = useI18n()
  const { villages } = useData()
  const featured = villages.filter((v) => v.featured && isPublic(v)).slice(0, 3)

  return (
    <section className="bg-mint py-[92px]" aria-labelledby="featured-title">
      <div className={container}>
        <SectionHeading
          id="featured-title"
          eyebrow={t('From our archive', 'من أرشيفنا')}
          title={t('Featured villages', 'قرى مختارة')}
          body={t('Stories documented with care by researchers and historical sources.', 'حكايات موثقة بعناية من باحثين ومصادر تاريخية.')}
          action={
            <ButtonLink to="/villages" variant="secondary">
              {t('Explore all villages', 'استكشف كل القرى')}
            </ButtonLink>
          }
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((v, i) => (
            <Reveal key={v.id} delay={i * 80}>
              <VillageCard village={v} className="h-full" />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

export function AboutSection() {
  const { t } = useI18n()
  const points = [
    [t('Documented content', 'محتوى موثّق'), t('A clear review method grounded in academic and local sources.', 'نعتمد منهجية مراجعة واضحة ومصادر أكاديمية ومحلية.')],
    [t('Shared knowledge', 'معرفة تشاركية'), t('Village communities can contribute photos, stories and documents.', 'نفتح الباب لأهالي القرى للمساهمة بالصور والقصص والوثائق.')],
    [t('Bilingual experience', 'تجربة ثنائية اللغة'), t('Content in Arabic and English to reach a wider audience.', 'نقدّم المحتوى بالعربية والإنجليزية للوصول إلى جمهور أوسع.')],
  ]
  return (
    <section id="about" className={cn(container, 'grid items-center gap-14 py-[92px] lg:grid-cols-[1.05fr_.95fr] lg:gap-[78px]')} aria-labelledby="about-title">
      <Reveal className="relative ps-0 sm:ps-10">
        <img src={images.olive} alt={t('Olive trees in Palestine', 'أشجار الزيتون في فلسطين')} loading="lazy" className="h-[360px] w-full rounded-[14px] rounded-ss-[160px] object-cover sm:h-[490px]" />
        <div className="absolute start-0 bottom-7 flex min-w-[235px] items-center gap-3 rounded-xl bg-white px-5 py-4 shadow-lift">
          <BookOpen className="size-5 text-accent" aria-hidden />
          <div>
            <b className="block text-[13px] text-forest">{t('Responsible documentation', 'توثيق مسؤول')}</b>
            <small className="mt-1 block text-[11px] text-muted">{t('Every fact linked to its source', 'كل معلومة مرتبطة بمصدرها')}</small>
          </div>
        </div>
      </Reveal>
      <Reveal delay={100}>
        <span className="mb-2.5 block text-xs font-extrabold tracking-[0.08em] text-accent-dark uppercase">{t('About Qaryati', 'عن قريتي')}</span>
        <h2 id="about-title" className="text-[28px] font-bold text-forest sm:text-[34px]">
          {t('A living memory, not just an archive', 'ذاكرة حيّة، لا مجرد أرشيف')}
        </h2>
        <p className="mt-3 text-[15px] leading-loose text-[#475569]">
          {t(
            'We are building a trusted digital reference that preserves local knowledge and makes it available to families, researchers and future generations.',
            'نبني مرجعاً رقمياً موثوقاً يحفظ المعرفة المحلية ويجعلها متاحة للعائلات والباحثين والأجيال القادمة.',
          )}
        </p>
        <ul className="my-7 grid gap-4">
          {points.map(([title, body]) => (
            <li key={title} className="flex gap-3">
              <span className="grid size-[27px] shrink-0 place-items-center rounded-full bg-accent-50 text-forest">
                <Check className="size-4" aria-hidden />
              </span>
              <p>
                <b className="block text-sm text-forest">{title}</b>
                <small className="mt-1 block text-xs leading-relaxed text-muted">{body}</small>
              </p>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-2">
          <ButtonLink to="/register" icon={undefined}>
            {t('Contribute with us', 'ساهم معنا')}
            <ChevronLeft className="size-[17px] ltr:rotate-180" aria-hidden />
          </ButtonLink>
          <ButtonLink to="/about" variant="secondary">
            {t('Learn more', 'اعرف المزيد')}
          </ButtonLink>
        </div>
      </Reveal>
    </section>
  )
}

export function NewsletterSection() {
  const { t } = useI18n()
  return (
    <section className="bg-forest py-14 text-white" aria-labelledby="news-title">
      <div className={cn(container, 'flex flex-col justify-between gap-8 lg:flex-row lg:items-center lg:gap-12')}>
        <div>
          <span className="mb-2.5 block text-xs font-extrabold tracking-[0.08em] text-gold uppercase">{t('Stay in touch', 'ابقَ على صلة')}</span>
          <h2 id="news-title" className="text-[28px] font-bold">
            {t('Do you know the story of your village?', 'هل تعرف حكاية قريتك؟')}
          </h2>
          <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-[#b8cbc7]">
            {t(
              'Send us documents, photos or corrections with their sources, or create a contributor account and submit them for review.',
              'أرسل لنا وثائق أو صورًا أو تصحيحات مع مصادرها، أو أنشئ حساب مساهم وأرسلها للمراجعة.',
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <a href={mailtoContact('Qaryati: village information')} className={buttonClass('gold', 'lg')}>
            <Mail className="size-4" aria-hidden />
            {t('Email us', 'راسلنا')}
          </a>
          <ButtonLink to="/register" variant="outline" size="lg" className="border-white/40 text-white hover:bg-white/10">
            {t('Become a contributor', 'كن مساهمًا')}
          </ButtonLink>
        </div>
      </div>
    </section>
  )
}
