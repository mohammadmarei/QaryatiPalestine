import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { ArrowRight, Check, ClipboardCheck, Eye, History, MessageSquareWarning, X } from 'lucide-react'
import type { ReviewStatus, Submission } from '@/types'
import { reviewStatusLabels, submissionKindLabels } from '@/i18n/labels'
import { PageHeader } from '@/components/layout/PageHeader'
import { VillagePhoto } from '@/components/brand/VillagePhoto'
import { EmptyState } from '@/components/feedback/States'
import { Field, Textarea } from '@/components/forms/Fields'
import { Badge, ReviewStatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog, Dialog } from '@/components/ui/Dialog'
import { Avatar } from '@/components/ui/Misc'
import { Tabs } from '@/components/ui/Tabs'
import { useAuth } from '@/hooks/useAuth'
import { useData } from '@/hooks/useData'
import { errorMessage } from '@/firebase/errors'
import { useI18n } from '@/hooks/useI18n'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/utils/cn'
import { can } from '../auth/permissions'

type TabKey = ReviewStatus | 'all'

function DecisionDialog({ submission, action, onClose }: { submission: Submission | null; action: 'rejected' | 'changes-requested' | null; onClose: () => void }) {
  const { t } = useI18n()
  const { reviewSubmission } = useData()
  const toast = useToast()
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const open = Boolean(submission && action)
  const isReject = action === 'rejected'

  const close = () => {
    setReason('')
    setError('')
    onClose()
  }

  const confirm = async () => {
    if (reason.trim().length < 10) {
      setError(t('Please give a reason of at least 10 characters', 'يرجى كتابة سبب لا يقل عن 10 أحرف'))
      return
    }
    if (!submission || !action) return
    try {
      await reviewSubmission(submission.id, action, reason.trim())
    } catch (err) {
      toast.error(t('The decision was not saved', 'لم يُحفظ القرار'), errorMessage(err))
      return
    }
    toast.success(isReject ? t('Submission rejected', 'تم رفض المساهمة') : t('Changes requested', 'تم طلب تعديلات'), t('The reason is stored with the review entry.', 'حُفظ السبب مع قرار المراجعة.'))
    close()
  }

  return (
    <Dialog
      open={open}
      onClose={close}
      size="sm"
      title={isReject ? t('Reject submission', 'رفض المساهمة') : t('Request changes', 'طلب تعديلات')}
      description={t('Your note is saved in the review history.', 'تُحفظ ملاحظتك في سجل المراجعة.')}
      footer={
        <>
          <Button variant="outline" onClick={close}>
            {t('Cancel', 'إلغاء')}
          </Button>
          <Button variant={isReject ? 'danger' : 'primary'} onClick={confirm}>
            {isReject ? t('Reject', 'رفض') : t('Send request', 'إرسال الطلب')}
          </Button>
        </>
      }
    >
      <Field label={isReject ? t('Reason for rejection', 'سبب الرفض') : t('What needs to change?', 'ما الذي يحتاج إلى تعديل؟')} required error={error}>
        {(id, d) => (
          <Textarea
            id={id}
            rows={4}
            value={reason}
            aria-describedby={d}
            invalid={!!error}
            onChange={(e) => {
              setReason(e.target.value)
              if (error) setError('')
            }}
            placeholder={t('e.g. The 1945 figure needs a source.', 'مثال: رقم عام 1945 بحاجة إلى مصدر.')}
          />
        )}
      </Field>
    </Dialog>
  )
}

export function ReviewsPage() {
  const { t, pick, formatDate, formatRelative } = useI18n()
  const { submissions, villages, users, reviewSubmission } = useData()
  const { user } = useAuth()
  const toast = useToast()
  const [tab, setTab] = useState<TabKey>('pending')
  const [viewing, setViewing] = useState<string | null>(null)
  const [decision, setDecision] = useState<{ id: string; action: 'rejected' | 'changes-requested' } | null>(null)
  const [toApprove, setToApprove] = useState<Submission | null>(null)
  const canReview = can.reviewSubmissions(user?.role)
  const isOpen = (s: Submission) => canReview && (s.status === 'pending' || s.status === 'changes-requested')

  const userName = (id: string) => users.find((u) => u.id === id)?.name ?? '—'
  const village = (id: string) => villages.find((v) => v.id === id)

  const list = useMemo(() => [...submissions].filter((s) => tab === 'all' || s.status === tab).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)), [submissions, tab])
  const count = (s: TabKey) => (s === 'all' ? submissions.length : submissions.filter((x) => x.status === s).length)

  const current = submissions.find((s) => s.id === viewing) ?? null
  const decisionSub = submissions.find((s) => s.id === decision?.id) ?? null

  const approve = async (s: Submission) => {
    try {
      await reviewSubmission(s.id, 'approved')
      toast.success(t('Submission approved', 'تم قبول المساهمة'), t('The record is now marked verified.', 'أصبح السجل موثّقًا.'))
    } catch (error) {
      toast.error(t('The decision was not saved', 'لم يُحفظ القرار'), errorMessage(error))
    }
  }

  const recentDecisions = submissions
    .flatMap((s) => s.history.filter((h) => h.action !== 'submitted').map((h) => ({ ...h, sub: s })))
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 6)

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'pending', label: t('Awaiting review', 'بانتظار المراجعة') },
    { key: 'changes-requested', label: t('Changes requested', 'مطلوب تعديلات') },
    { key: 'approved', label: t('Approved', 'مقبولة') },
    { key: 'rejected', label: t('Rejected', 'مرفوضة') },
    { key: 'all', label: t('All', 'الكل') },
  ]

  return (
    <div>
      <PageHeader title={t('Review & verification', 'المراجعة والتحقق')} description={t('Check contributions against their sources before they reach the public archive.', 'راجع المساهمات مقابل مصادرها قبل وصولها إلى الأرشيف العام.')} />

      <div className="grid gap-6 xl:grid-cols-[1fr_20rem]">
        <section className="card overflow-hidden">
          <div className="px-2 pt-1 sm:px-4">
            <Tabs idPrefix="reviews" value={tab} onChange={setTab} items={tabs.map((x) => ({ ...x, count: count(x.key) }))} />
          </div>
          {list.length === 0 ? (
            <EmptyState icon={<ClipboardCheck className="size-7" />} title={t('Nothing in this queue', 'لا شيء في هذه القائمة')} description={t('All caught up — new submissions will appear here.', 'لا يوجد ما يُراجع — ستظهر المساهمات الجديدة هنا.')} />
          ) : (
            <ul className="divide-y divide-stone-line" role="tabpanel" id={`reviews-panel-${tab}`} aria-labelledby={`reviews-${tab}`}>
              {list.map((s) => {
                const v = village(s.villageId)
                return (
                  <li key={s.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:px-6">
                    <div className="flex min-w-0 flex-1 items-center gap-4">
                      {v ? <VillagePhoto village={v} alt="" className="size-14 shrink-0 rounded-xl" /> : <span className="size-14 shrink-0 rounded-xl bg-mint" />}
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="ar-display text-lg leading-tight font-bold text-forest">{v?.name.ar ?? s.villageId}</span>
                          <span className="text-sm text-muted">{v?.name.en}</span>
                          <Badge tone="neutral">{pick(submissionKindLabels[s.kind])}</Badge>
                        </div>
                        <p className="mt-0.5 truncate text-sm text-ink/75">{pick(s.summary)}</p>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                          <Avatar name={userName(s.submittedBy)} size="sm" className="size-5 text-[0.55rem] ring-0" />
                          {userName(s.submittedBy)} · {formatDate(s.submittedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      <ReviewStatusBadge status={s.status} />
                      <Button variant="ghost" size="sm" icon={<Eye className="size-4" />} onClick={() => setViewing(s.id)}>
                        {t('Details', 'التفاصيل')}
                      </Button>
                      {isOpen(s) && (
                        <>
                          <Button size="sm" icon={<Check className="size-4" />} onClick={() => setToApprove(s)}>
                            {t('Approve', 'قبول')}
                          </Button>
                          <Button size="sm" variant="outline" className="text-accent-dark" icon={<X className="size-4" />} onClick={() => setDecision({ id: s.id, action: 'rejected' })}>
                            {t('Reject', 'رفض')}
                          </Button>
                        </>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <aside className="h-fit space-y-6">
          <section className="card p-5" aria-labelledby="workflow-h">
            <h2 id="workflow-h" className="text-sm font-semibold text-ink">
              {t('How review works', 'كيف تتم المراجعة')}
            </h2>
            <ul className="mt-3 space-y-2.5 text-xs text-muted">
              <li className="flex flex-wrap items-center gap-1.5">
                <ReviewStatusBadge status="approved" />
                <ArrowRight className="size-3 rtl:rotate-180" aria-hidden />
                {t('village is published and verified', 'تُنشر القرية وتُوثَّق')}
              </li>
              <li className="flex flex-wrap items-center gap-1.5">
                <ReviewStatusBadge status="changes-requested" />
                <ArrowRight className="size-3 rtl:rotate-180" aria-hidden />
                {t('returned to the contributor', 'تُعاد إلى المساهم')}
              </li>
              <li className="flex flex-wrap items-center gap-1.5">
                <ReviewStatusBadge status="rejected" />
                <ArrowRight className="size-3 rtl:rotate-180" aria-hidden />
                {t('closed without changes', 'تُغلق دون تغييرات')}
              </li>
            </ul>
          </section>
          <section className="card p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
              <History className="size-4 text-accent-dark" /> {t('Review history', 'سجل المراجعة')}
            </h2>
            {recentDecisions.length === 0 && <p className="mt-4 text-sm text-muted">{t('No review decisions yet.', 'لا توجد قرارات مراجعة بعد.')}</p>}
            <ol className="mt-4 space-y-4">
              {recentDecisions.map((h, i) => (
                <li key={`${h.sub.id}-${i}`} className="relative flex gap-3">
                  <span className={cn('mt-1.5 size-2 shrink-0 rounded-full', h.action === 'approved' ? 'bg-olive' : h.action === 'rejected' ? 'bg-danger' : 'bg-accent')} />
                  <div className="min-w-0 text-sm">
                    <p className="text-ink">
                      <span className="font-medium">{userName(h.by)}</span> · {pick(reviewStatusLabels[h.action as ReviewStatus])}
                    </p>
                    <button type="button" onClick={() => setViewing(h.sub.id)} className="text-start text-xs text-olive hover:text-accent-dark">
                      {village(h.sub.villageId) ? pick(village(h.sub.villageId)!.name) : h.sub.villageId} — {pick(h.sub.summary)}
                    </button>
                    <p className="text-xs text-muted/80">{formatRelative(h.at)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>

      {/* Details */}
      <Dialog
        open={!!current}
        onClose={() => setViewing(null)}
        size="lg"
        title={current ? `${village(current.villageId)?.name.ar ?? ''} · ${village(current.villageId)?.name.en ?? current.villageId}` : ''}
        description={current ? `${pick(submissionKindLabels[current.kind])} — ${pick(current.summary)}` : undefined}
        footer={
          current && isOpen(current) ? (
            <>
              <Button
                variant="outline"
                icon={<MessageSquareWarning className="size-4" />}
                onClick={() => {
                  setDecision({ id: current.id, action: 'changes-requested' })
                  setViewing(null)
                }}
              >
                {t('Request changes', 'طلب تعديلات')}
              </Button>
              <Button
                variant="outline"
                className="text-accent-dark"
                icon={<X className="size-4" />}
                onClick={() => {
                  setDecision({ id: current.id, action: 'rejected' })
                  setViewing(null)
                }}
              >
                {t('Reject', 'رفض')}
              </Button>
              <Button
                icon={<Check className="size-4" />}
                onClick={() => {
                  setToApprove(current)
                  setViewing(null)
                }}
              >
                {t('Approve', 'قبول')}
              </Button>
            </>
          ) : undefined
        }
      >
        {current && (
          <div className="space-y-6 pb-2">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <ReviewStatusBadge status={current.status} />
              <span className="text-muted">
                {t('Submitted by', 'أرسلها')} <span className="font-medium text-ink">{userName(current.submittedBy)}</span> · {formatDate(current.submittedAt, { dateStyle: 'medium', timeStyle: 'short' })}
              </span>
              <Link to={`/villages/${current.villageId}`} className="text-olive hover:text-accent-dark">
                {t('Open profile', 'فتح الملف')} ↗
              </Link>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-ink">{t('Proposed changes', 'التغييرات المقترحة')}</h3>
              <ul className="mt-3 space-y-2">
                {current.changes.map((c, i) => (
                  <li key={i} className="rounded-xl border border-stone-line bg-white p-3 text-sm">
                    <p className="font-mono text-xs text-accent-dark">{c.field}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      {c.before && (
                        <>
                          <span className="flex flex-col gap-0.5">
                            <span className="text-[0.68rem] text-muted">{t('Previous value', 'القيمة السابقة')}</span>
                            <span className="rounded-md bg-[#fbeceb] px-2 py-0.5 text-danger line-through" dir="auto">
                              {c.before}
                            </span>
                          </span>
                          <ArrowRight className="mt-4 size-3.5 text-muted rtl:rotate-180" aria-hidden />
                        </>
                      )}
                      <span className="flex flex-col gap-0.5">
                        <span className="text-[0.68rem] text-muted">{c.before ? t('New value', 'القيمة الجديدة') : t('Proposed value', 'القيمة المقترحة')}</span>
                        <span className="rounded-md bg-olive-50 px-2 py-0.5 text-olive" dir="auto">
                          {c.after}
                        </span>
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-ink">{t('History', 'السجل')}</h3>
              <ol className="mt-3 space-y-3 border-s-2 border-stone-line ps-4">
                {current.history.map((h, i) => (
                  <li key={i} className="text-sm">
                    <p>
                      <span className="font-medium">{userName(h.by)}</span>{' '}
                      <span className="text-muted">· {h.action === 'submitted' ? t('Submitted', 'أُرسلت') : pick(reviewStatusLabels[h.action])}</span>
                    </p>
                    {h.note && <p className="mt-0.5 rounded-lg bg-beige px-2.5 py-1.5 text-ink/80">{h.note}</p>}
                    <p className="text-xs text-muted">{formatDate(h.at, { dateStyle: 'medium', timeStyle: 'short' })}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </Dialog>

      <DecisionDialog submission={decisionSub} action={decision?.action ?? null} onClose={() => setDecision(null)} />
      <ConfirmDialog
        open={!!toApprove}
        onClose={() => setToApprove(null)}
        tone="primary"
        title={t('Approve this submission?', 'قبول هذه المساهمة؟')}
        description={
          toApprove
            ? t(
                `${village(toApprove.villageId)?.name.en ?? toApprove.villageId} will be marked as verified and published on the public site.`,
                `ستُعلَّم ${village(toApprove.villageId)?.name.ar ?? toApprove.villageId} كقرية موثّقة وتُنشر على الموقع العام.`,
              )
            : undefined
        }
        confirmLabel={t('Approve & publish', 'قبول ونشر')}
        onConfirm={() => toApprove && approve(toApprove)}
      />
    </div>
  )
}
