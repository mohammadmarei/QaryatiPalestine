import { BookMarked, Building2, Check, Eye, FileSearch, History, Landmark, LibraryBig, MapPin, MessagesSquare, Send, ShieldCheck, Sprout, Target, UsersRound } from 'lucide-react'
import type { Bilingual, VerificationStatus } from '@/types'
import { images } from '@/data/images'
import { PageHero, SectionHeading } from '@/components/layout/Sections'
import { VerificationBadge } from '@/components/ui/Badge'
import { ButtonLink } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Misc'
import { Reveal } from '@/components/ui/Reveal'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useI18n } from '@/hooks/useI18n'
import { cn, container } from '@/utils/cn'

const team: Bilingual[] = [
  { ar: 'محمد مرعي', en: 'Mohammad Marei' },
  { ar: 'عنان أبو خضر', en: 'Anan Abu Khader' },
  { ar: 'أيهم ياسين', en: 'Ayham Yassin' },
  { ar: 'كرم خضر', en: 'Karam Khader' },
]

export function AboutPage() {
  const { t, pick, lang, formatNumber } = useI18n()
  useDocumentTitle(t('About', 'عن قريتي'))

  const goals = [
    t('Document every Palestinian village in a consistent, structured profile.', 'توثيق كل قرية فلسطينية في ملف منظّم وموحّد البنية.'),
    t('Link every statement to a source that readers can check.', 'ربط كل معلومة بمصدر يستطيع القارئ الرجوع إليه.'),
    t('Preserve names — Arabic, historical and transliterated — so places remain findable.', 'حفظ الأسماء العربية والتاريخية والمكتوبة بالحروف اللاتينية كي تبقى الأماكن قابلة للبحث.'),
    t('Open the archive to students, researchers and families, in Arabic and English.', 'فتح الأرشيف للطلاب والباحثين والعائلات، بالعربية والإنجليزية.'),
    t('Invite communities to contribute knowledge through a careful review process.', 'دعوة المجتمعات للمساهمة بمعارفها عبر عملية مراجعة دقيقة.'),
  ]

  const documented = [
    { icon: BookMarked, label: t('Names & spellings', 'الأسماء وطرق كتابتها') },
    { icon: MapPin, label: t('Location & geography', 'الموقع والجغرافيا') },
    { icon: UsersRound, label: t('Population history', 'التاريخ السكاني') },
    { icon: History, label: t('Historical events', 'الأحداث التاريخية') },
    { icon: Landmark, label: t('Heritage & landmarks', 'التراث والمعالم') },
    { icon: Sprout, label: t('Agriculture & economy', 'الزراعة والاقتصاد') },
    { icon: Building2, label: t('Public facilities', 'المرافق العامة') },
    { icon: LibraryBig, label: t('Sources & references', 'المصادر والمراجع') },
  ]

  const steps = [
    { icon: FileSearch, title: t('Collect', 'الجمع'), body: t('Published works, census tables, maps, archives and oral testimony.', 'المؤلفات المنشورة وجداول التعداد والخرائط والأرشيفات والشهادات الشفوية.') },
    { icon: LibraryBig, title: t('Cite', 'التوثيق'), body: t('Every field is entered with a reference; unsourced claims are flagged.', 'تُدخل كل معلومة مع مرجعها، وتُعلَّم المعلومات غير الموثّقة.') },
    { icon: MessagesSquare, title: t('Review', 'المراجعة'), body: t('Reviewers compare submissions with sources and request changes.', 'يقارن المراجعون المساهمات بمصادرها ويطلبون التعديلات.') },
    { icon: ShieldCheck, title: t('Verify', 'التحقق'), body: t('Records matched against independent sources are marked verified.', 'تُعلَّم السجلات المطابقة لمصادر مستقلة بأنها موثّقة.') },
    { icon: Send, title: t('Publish & revise', 'النشر والتحديث'), body: t('Profiles stay open to correction, with every change logged.', 'تبقى الملفات مفتوحة للتصحيح، مع تسجيل كل تعديل.') },
  ]

  const statuses: { s: VerificationStatus; d: string }[] = [
    { s: 'verified', d: t('Cross-checked against independent sources.', 'تمت مطابقته مع مصادر مستقلة.') },
    { s: 'pending', d: t('Submitted with sources; review in progress.', 'أُرسل مع مصادره والمراجعة جارية.') },
    { s: 'needs-review', d: t('A reviewer flagged a question or conflict.', 'أشار مراجع إلى سؤال أو تعارض.') },
    { s: 'unverified', d: t('Initial entry, not yet reviewed.', 'إدخال أوّلي لم يُراجع بعد.') },
  ]

  return (
    <div>
      <PageHero
        crumbs={[{ label: t('Home', 'الرئيسية'), to: '/' }, { label: t('About', 'عن قريتي') }]}
        eyebrow={t('About the platform', 'عن المنصة')}
        title={t('Qaryati — a living memory of Palestinian villages', 'قريتي — ذاكرة حيّة للقرى الفلسطينية')}
        body={t(
          'A bilingual knowledge platform that documents Palestinian villages as structured, sourced profiles — bringing together what archives, scholarship and communities know about each place.',
          'منصة معرفية ثنائية اللغة توثّق القرى الفلسطينية في ملفات منظّمة ومستندة إلى المصادر، وتجمع ما تعرفه الأرشيفات والأبحاث والمجتمعات عن كل مكان.',
        )}
      />

      {/* Introduction */}
      <section className={cn(container, 'grid items-center gap-14 py-[92px] lg:grid-cols-[1.05fr_.95fr] lg:gap-[78px]')}>
        <Reveal className="relative sm:ps-10">
          <img src={images.valley} alt={t('Terraced hills of a Palestinian village', 'تلال مدرّجة في قرية فلسطينية')} loading="lazy" className="h-[360px] w-full rounded-[14px] rounded-ss-[160px] object-cover sm:h-[460px]" />
          <div className="absolute start-0 bottom-7 rounded-xl bg-white px-5 py-4 shadow-lift">
            <b className="block font-latin text-2xl text-forest">{formatNumber(16)}</b>
            <small className="text-xs text-muted">{t('governorates covered', 'محافظة مشمولة')}</small>
          </div>
        </Reveal>
        <Reveal delay={100}>
          <span className="mb-2.5 block text-xs font-extrabold tracking-[0.08em] text-accent-dark uppercase">{t('Who we are', 'من نحن')}</span>
          <h2 className="text-[28px] font-bold text-forest sm:text-[34px]">{t('Knowledge that belongs to its people', 'معرفة تنتمي إلى أهلها')}</h2>
          <p className="mt-4 text-[15px] leading-loose text-[#475569]">
            {t(
              'Knowledge about Palestinian villages is scattered across archives, books, family memory and the land itself. Qaryati brings these fragments together in structured, sourced and verifiable profiles, open to students, researchers, families and anyone who wants to know a village by name.',
              'تتوزّع المعرفة عن القرى الفلسطينية بين الأرشيفات والكتب وذاكرة العائلات والأرض نفسها. تجمع «قريتي» هذه الشذرات في ملفات منظّمة وموثّقة وقابلة للتحقق، مفتوحة للطلاب والباحثين والعائلات ولكل من يريد أن يعرف قريةً باسمها.',
            )}
          </p>
          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            {[
              { icon: Eye, title: t('Vision', 'الرؤية'), body: t('Every Palestinian village — inhabited or depopulated — can be found, read and remembered by name.', 'أن يمكن العثور على كل قرية فلسطينية — مأهولةً أو مُهجَّرة — وقراءتها وتذكّرها باسمها.') },
              { icon: Target, title: t('Mission', 'الرسالة'), body: t('Collect, organize, verify and openly share village knowledge with rigour and respect.', 'جمع معرفة القرى وتنظيمها والتحقق منها ومشاركتها بدقّة واحترام.') },
            ].map((c) => (
              <div key={c.title} className="rounded-[14px] border border-stone-line bg-white p-5">
                <span className="grid size-10 place-items-center rounded-xl bg-accent-50 text-forest">
                  <c.icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-3 font-bold text-forest">{c.title}</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-muted">{c.body}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* Goals + documented types */}
      <section className="bg-mint py-[92px]">
        <div className={cn(container, 'grid gap-12 lg:grid-cols-2')}>
          <div>
            <SectionHeading eyebrow={t('Goals', 'الأهداف')} title={t('What we set out to do', 'ما نسعى إليه')} />
            <ol className="grid gap-3">
              {goals.map((g, i) => (
                <li key={i} className="flex gap-4 rounded-xl border border-stone-line bg-white p-4">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-forest font-latin text-xs font-bold text-white">{i + 1}</span>
                  <p className="pt-1 text-sm leading-relaxed text-[#334155]">{g}</p>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <SectionHeading eyebrow={t('Types of information', 'أنواع المعلومات')} title={t('What a profile documents', 'ما يوثّقه الملف')} />
            <ul className="grid grid-cols-2 gap-3">
              {documented.map((d) => (
                <li key={d.label} className="flex items-center gap-3 rounded-xl border border-stone-line bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-lift">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-50 text-forest">
                    <d.icon className="size-5" aria-hidden />
                  </span>
                  <span className="text-sm font-bold text-forest">{d.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Method */}
      <section id="method" className="relative scroll-mt-24 overflow-hidden bg-forest py-[92px] text-white">
        <div className="pointer-events-none absolute inset-0 bg-dots-light [mask-image:linear-gradient(to_left,#000,transparent_65%)]" aria-hidden />
        <div className={cn(container, 'relative')}>
          <span className="mb-2.5 block text-xs font-extrabold tracking-[0.08em] text-gold uppercase">{t('Collection & verification', 'الجمع والتحقق')}</span>
          <h2 className="text-[28px] font-bold sm:text-[34px]">{t('How a record earns trust', 'كيف يكتسب السجل ثقته')}</h2>
          <ol className="mt-10 grid gap-3 md:grid-cols-5">
            {steps.map((s, i) => (
              <li key={s.title} className="rounded-[14px] border border-white/10 bg-white/[0.05] p-5">
                <div className="flex items-center justify-between">
                  <s.icon className="size-6 text-gold" aria-hidden />
                  <span className="font-latin text-xs text-white/40">0{i + 1}</span>
                </div>
                <h3 className="mt-4 font-bold">{s.title}</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-[#b8cbc7]">{s.body}</p>
              </li>
            ))}
          </ol>
          <div className="mt-8 rounded-[14px] bg-white p-6 text-ink">
            <h3 className="text-sm font-bold text-forest">{t('Verification statuses on profiles', 'حالات التوثيق في الملفات')}</h3>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {statuses.map(({ s, d }) => (
                <div key={s}>
                  <dt>
                    <VerificationBadge status={s} />
                  </dt>
                  <dd className="mt-2 text-[13px] text-muted">{d}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* Why it matters */}
      <section className={cn(container, 'grid items-center gap-12 py-[92px] lg:grid-cols-2')}>
        <div>
          <span className="mb-2.5 block text-xs font-extrabold tracking-[0.08em] text-accent-dark uppercase">{t('Why it matters', 'لماذا يهمّ ذلك')}</span>
          <h2 className="text-[28px] font-bold text-forest sm:text-[34px]">{t('Memory needs a place to live', 'الذاكرة تحتاج مكانًا تعيش فيه')}</h2>
          <ul className="mt-6 grid gap-4">
            {[
              t('Much village knowledge lives in elders and private documents that will not always be with us.', 'تعيش كثير من معرفة القرى في ذاكرة كبار السن والوثائق الخاصة التي لن تبقى معنا دائمًا.'),
              t('Gathering it carefully, with sources, protects it from loss and distortion.', 'جمعها بعناية ومع مصادرها يحميها من الضياع والتشويه.'),
              t('It gives future generations a reliable way back to their places.', 'ويمنح الأجيال القادمة طريقًا موثوقًا للعودة إلى أماكنها.'),
            ].map((p) => (
              <li key={p} className="flex gap-3">
                <span className="grid size-[27px] shrink-0 place-items-center rounded-full bg-accent-50 text-forest">
                  <Check className="size-4" aria-hidden />
                </span>
                <p className="text-[15px] leading-relaxed text-[#475569]">{p}</p>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-2">
            <ButtonLink to="/villages">{t('Explore the villages', 'استكشف القرى')}</ButtonLink>
            <ButtonLink to="/map" variant="secondary">
              {t('Open the map', 'افتح الخريطة')}
            </ButtonLink>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <img src={images.sebastia} alt={t('Historic stone architecture', 'عمارة حجرية تاريخية')} loading="lazy" className="h-72 w-full rounded-[14px] object-cover" />
          <img src={images.battir} alt={t('Agricultural terraces', 'مدرّجات زراعية')} loading="lazy" className="mt-10 h-72 w-full rounded-[14px] object-cover" />
        </div>
      </section>

      {/* Team */}
      <section id="team" className="scroll-mt-24 bg-mint py-[92px]">
        <div className={container}>
          <SectionHeading
            id="team-h"
            eyebrow={t('Project team', 'فريق المشروع')}
            title={t('The people behind Qaryati', 'الفريق وراء قريتي')}
            body={t('Qaryati was designed and built as a university Advanced Software Project.', 'صُمّمت «قريتي» وبُنيت ضمن مشروع جامعي في مساق البرمجيات المتقدمة.')}
          />
          <ul aria-labelledby="team-h" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {team.map((m) => (
              <li key={m.en} className="flex items-center gap-4 rounded-[14px] border border-stone-line bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lift">
                <Avatar name={m.en} size="lg" />
                <div className="min-w-0">
                  <p className="text-base font-bold text-forest">{pick(m)}</p>
                  <p className={cn('text-xs text-muted', lang === 'ar' ? 'font-latin' : 'font-arabic')}>{lang === 'ar' ? m.en : m.ar}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}
