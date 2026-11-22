import { useMemo } from 'react'
import { Link } from 'react-router'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ArrowUpRight, ClipboardCheck, FileEdit, FilePlus2, Hourglass, LibraryBig, MapPinned, ShieldCheck, UsersRound } from 'lucide-react'
import type { VerificationStatus } from '@/types'
import { governorates } from '@/data/governorates'
import { auditActionLabels, submissionKindLabels, verificationLabels } from '@/i18n/labels'
import { PageHeader } from '@/components/layout/PageHeader'
import { VillagePhoto } from '@/components/brand/VillagePhoto'
import { EmptyState } from '@/components/feedback/States'
import { Badge, RecordStatusBadge } from '@/components/ui/Badge'
import { ButtonLink } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Misc'
import { ChartCard, StatCard } from '@/components/ui/StatCard'
import { useAuth } from '@/hooks/useAuth'
import { useData } from '@/hooks/useData'
import { useI18n } from '@/hooks/useI18n'

const verificationColors: Record<VerificationStatus, string> = {
  verified: '#10B981',
  pending: '#D6B46A',
  'needs-review': '#8B9A65',
  unverified: '#CBD5E1',
}

export function DashboardOverviewPage() {
  const { t, pick, formatNumber, formatRelative, isRtl } = useI18n()
  const { user } = useAuth()
  const { villages, auditLogs, users, submissions } = useData()

  const stats = useMemo(
    () => ({
      total: villages.length,
      verified: villages.filter((v) => v.verification === 'verified').length,
      pending: villages.filter((v) => v.status === 'pending' || v.verification === 'pending').length,
      drafts: villages.filter((v) => v.status === 'draft').length,
    }),
    [villages],
  )

  const byGov = useMemo(
    () =>
      governorates
        .map((g) => ({ name: pick(g.name), count: villages.filter((v) => v.governorateId === g.id).length }))
        .filter((g) => g.count > 0)
        .sort((a, b) => b.count - a.count),
    [villages, pick],
  )

  const byStatus = (Object.keys(verificationColors) as VerificationStatus[]).map((s) => ({
    key: s,
    name: pick(verificationLabels[s]),
    value: villages.filter((v) => v.verification === s).length,
  }))

  const recent = [...villages].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5)
  const activity = auditLogs.slice(0, 7)
  const userName = (id: string) => users.find((u) => u.id === id)?.name ?? '—'
  const pending = submissions.filter((s) => s.status === 'pending').sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
  const pendingReviews = pending.length
  const pendingList = pending.slice(0, 4)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? t('Good morning', 'صباح الخير') : hour < 18 ? t('Good afternoon', 'مساء الخير') : t('Good evening', 'مساء الخير')

  const quickActions = [
    { to: '/dashboard/villages/new', icon: FilePlus2, label: t('Add a village', 'إضافة قرية'), desc: t('Start a new profile', 'ابدأ ملفًا جديدًا') },
    { to: '/dashboard/population', icon: UsersRound, label: t('Population record', 'سجل سكاني'), desc: t('Add census data', 'أضف بيانات تعداد') },
    { to: '/dashboard/sources', icon: LibraryBig, label: t('Add a source', 'إضافة مصدر'), desc: t('Cite a reference', 'وثّق مرجعًا') },
    { to: '/dashboard/reviews', icon: ClipboardCheck, label: t('Review queue', 'قائمة المراجعة'), desc: t(`${pendingReviews} waiting`, `${pendingReviews} بالانتظار`) },
  ]

  return (
    <div>
      <PageHeader
        title={`${greeting}${user ? `${isRtl ? '، ' : ', '}${user.name.split(' ')[0]}` : ''}`}
        description={t('Here is the state of the village archive today.', 'إليك حالة أرشيف القرى اليوم.')}
        crumbs={[{ label: t('Overview', 'نظرة عامة') }]}
        actions={
          <>
            <ButtonLink to="/dashboard/reviews" variant="outline" icon={<ClipboardCheck className="size-4" />}>
              {t('Reviews', 'المراجعات')}
              {pendingReviews > 0 && <span className="rounded-full bg-accent px-1.5 text-xs text-white">{pendingReviews}</span>}
            </ButtonLink>
            <ButtonLink to="/dashboard/villages/new" icon={<FilePlus2 className="size-4" />}>
              {t('Add village', 'إضافة قرية')}
            </ButtonLink>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('Total villages', 'إجمالي القرى')} value={formatNumber(stats.total)} icon={<MapPinned className="size-5" />} tone="forest" />
        <StatCard label={t('Verified villages', 'قرى موثّقة')} value={formatNumber(stats.verified)} icon={<ShieldCheck className="size-5" />} hint={t(`${Math.round((stats.verified / Math.max(stats.total, 1)) * 100)}% of records`, `${Math.round((stats.verified / Math.max(stats.total, 1)) * 100)}% من السجلات`)} />
        <StatCard label={t('Pending records', 'سجلات معلّقة')} value={formatNumber(stats.pending)} icon={<Hourglass className="size-5" />} tone="gold" hint={t('Awaiting verification', 'بانتظار التحقق')} />
        <StatCard label={t('Draft records', 'مسودات')} value={formatNumber(stats.drafts)} icon={<FileEdit className="size-5" />} tone="accent" hint={t('Not yet submitted', 'لم تُرسل بعد')} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <ChartCard title={t('Distribution by governorate', 'التوزيع حسب المحافظة')} subtitle={t('Village profiles per governorate', 'عدد ملفات القرى في كل محافظة')}>
          <div className="h-72" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byGov} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
                <CartesianGrid horizontal={false} stroke="#E2E8F0" strokeDasharray="3 4" />
                <XAxis type="number" allowDecimals={false} reversed={isRtl} tickLine={false} axisLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis type="category" dataKey="name" interval={0} orientation={isRtl ? 'right' : 'left'} width={120} tickLine={false} axisLine={false} tick={{ fill: '#172033', fontSize: 12 }} />
                <Tooltip cursor={{ fill: 'rgba(18,60,53,0.06)' }} contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 13 }} formatter={(v) => [v, t('Villages', 'القرى')]} />
                <Bar dataKey="count" radius={isRtl ? [6, 0, 0, 6] : [0, 6, 6, 0]} barSize={14} animationDuration={800}>
                  {byGov.map((g, i) => (
                    <Cell key={g.name} fill={i === 0 ? '#10B981' : '#123C35'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title={t('Verification status', 'حالة التوثيق')} subtitle={t('Across all village records', 'لجميع سجلات القرى')}>
          <div className="relative h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byStatus} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="92%" paddingAngle={2} stroke="none" animationDuration={800}>
                  {byStatus.map((s) => (
                    <Cell key={s.key} fill={verificationColors[s.key]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 13 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-semibold text-ink">{formatNumber(stats.total)}</span>
              <span className="text-xs text-muted">{t('records', 'سجل')}</span>
            </div>
          </div>
          <ul className="mt-4 grid grid-cols-2 gap-2">
            {byStatus.map((s) => (
              <li key={s.key} className="flex items-center justify-between gap-2 rounded-xl bg-paper px-3 py-2 text-xs">
                <span className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full" style={{ background: verificationColors[s.key] }} />
                  {s.name}
                </span>
                <span className="font-semibold">{formatNumber(s.value)}</span>
              </li>
            ))}
          </ul>
        </ChartCard>
      </div>

      <section className="card mt-6 overflow-hidden" aria-labelledby="pending-h">
        <header className="flex items-center justify-between border-b border-stone-line px-5 py-4 sm:px-6">
          <h2 id="pending-h" className="flex items-center gap-2 text-base font-semibold">
            {t('Awaiting review', 'بانتظار المراجعة')}
            {pendingReviews > 0 && <span className="rounded-full bg-accent px-1.5 text-xs font-semibold text-white">{formatNumber(pendingReviews)}</span>}
          </h2>
          <Link to="/dashboard/reviews" className="text-sm font-medium text-olive hover:text-accent-dark">
            {t('Open review queue', 'فتح قائمة المراجعة')}
          </Link>
        </header>
        {pendingList.length === 0 ? (
          <EmptyState icon={<ClipboardCheck className="size-7" />} title={t('All caught up', 'لا توجد مراجعات معلّقة')} description={t('New submissions will appear here.', 'ستظهر المساهمات الجديدة هنا.')} className="py-10" />
        ) : (
          <ul className="grid grid-cols-1 divide-y divide-stone-line md:grid-cols-2 md:divide-y-0">
            {pendingList.map((s) => {
              const v = villages.find((x) => x.id === s.villageId)
              return (
                <li key={s.id} className="md:border-b md:border-stone-line md:odd:border-e">
                  <Link to="/dashboard/reviews" className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-beige/50 sm:px-6">
                    <Avatar name={userName(s.submittedBy)} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink">
                        {v ? pick(v.name) : s.villageId} — {pick(s.summary)}
                      </span>
                      <span className="block text-xs text-muted">
                        {userName(s.submittedBy)} · {formatRelative(s.submittedAt)}
                      </span>
                    </span>
                    <Badge tone="neutral">{pick(submissionKindLabels[s.kind])}</Badge>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_1fr]">
        <section className="card overflow-hidden">
          <header className="flex items-center justify-between border-b border-stone-line px-5 py-4 sm:px-6">
            <h2 className="text-base font-semibold">{t('Recent updates', 'آخر التحديثات')}</h2>
            <Link to="/dashboard/villages" className="text-sm font-medium text-olive hover:text-accent-dark">
              {t('View all', 'عرض الكل')}
            </Link>
          </header>
          {recent.length === 0 && <EmptyState icon={<MapPinned className="size-7" />} title={t('No village records yet', 'لا توجد سجلات قرى بعد')} className="py-10" />}
          <ul className="divide-y divide-stone-line">
            {recent.map((v) => (
              <li key={v.id}>
                <Link to={`/dashboard/villages/${v.id}/edit`} className="flex items-center gap-4 px-5 py-3.5 transition hover:bg-beige/50 sm:px-6">
                  <VillagePhoto village={v} alt="" className="size-12 shrink-0 rounded-xl" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-2">
                      <span className="ar-display text-lg font-bold text-forest" lang="ar">
                        {v.name.ar}
                      </span>
                      <span className="truncate text-sm text-muted">{v.name.en}</span>
                    </span>
                    <span className="block text-xs text-muted">
                      {t('Updated', 'تحديث')} {formatRelative(v.updatedAt)} · {userName(v.createdBy)}
                    </span>
                  </span>
                  <RecordStatusBadge status={v.status} />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="card overflow-hidden">
          <header className="flex items-center justify-between border-b border-stone-line px-5 py-4 sm:px-6">
            <h2 className="text-base font-semibold">{t('Recent activity', 'آخر النشاطات')}</h2>
            <Link to="/dashboard/audit-logs" className="text-sm font-medium text-olive hover:text-accent-dark">
              {t('Audit log', 'سجل النشاط')}
            </Link>
          </header>
          {activity.length === 0 && <EmptyState title={t('No activity recorded yet', 'لا يوجد نشاط مسجّل بعد')} className="py-10" />}
          <ol className="relative px-5 py-4 sm:px-6">
            {activity.map((a) => (
              <li key={a.id} className="relative flex gap-3 pb-4 last:pb-0">
                <Avatar name={userName(a.userId)} size="sm" />
                <div className="min-w-0 text-sm">
                  <p className="text-ink">
                    <span className="font-medium">{userName(a.userId)}</span> <span className="text-muted">· {pick(auditActionLabels[a.action])}</span>
                  </p>
                  <p className="truncate text-muted" title={a.details}>
                    {a.entityLabel} — {a.details}
                  </p>
                  <p className="text-xs text-muted/80">{formatRelative(a.at)}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <section className="relative mt-6 overflow-hidden rounded-[var(--radius-panel)] bg-forest p-6 text-limestone sm:p-8" aria-labelledby="qa-h">
        <div className="pointer-events-none absolute inset-0 bg-dots-light" aria-hidden />
        <h2 id="qa-h" className="relative text-lg font-semibold text-white">
          {t('Quick actions', 'إجراءات سريعة')}
        </h2>
        <ul className="relative mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((q) => (
            <li key={q.to}>
              <Link to={q.to} className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-4 transition hover:bg-white/[0.12]">
                <span className="flex size-10 items-center justify-center rounded-xl bg-gold/15 text-gold">
                  <q.icon className="size-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-white">{q.label}</span>
                  <span className="block text-xs text-limestone/70">{q.desc}</span>
                </span>
                <ArrowUpRight className="size-4 text-limestone/50 transition group-hover:text-gold rtl:-scale-x-100" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
