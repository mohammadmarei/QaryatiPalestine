import { useEffect, useMemo, useRef, useState } from 'react'
import { useBlocker, useNavigate, useParams } from 'react-router'
import { FormProvider, useForm, type FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, ArrowRight, Compass, Eye, Save, Send } from 'lucide-react'
import { governorateById } from '@/data/governorates'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/feedback/States'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Stepper } from '@/components/ui/Stepper'
import { useAuth } from '@/hooks/useAuth'
import { useData } from '@/hooks/useData'
import { ApiError } from '@/api/client'
import { useI18n } from '@/hooks/useI18n'
import { useToast } from '@/hooks/useToast'
import { buildVillageSchema, emptyValues, stepFields, valuesFromVillage, villageFromValues, type VillageFormValues } from './schema'
import { AdminStep, AgricultureStep, BasicStep, FacilitiesStep, GeoStep, HeritageStep, HistoryStep, NamesStep, PopulationStep, SourcesStep } from './Steps'

const stepComponents = [BasicStep, NamesStep, AdminStep, GeoStep, PopulationStep, HistoryStep, HeritageStep, AgricultureStep, FacilitiesStep, SourcesStep]

export function VillageFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const { id } = useParams()
  const { t, pick } = useI18n()
  const { villages, population, saveVillage, setVillagePopulation } = useData()
  const { user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const existing = mode === 'edit' ? villages.find((v) => v.id === id) : undefined

  const [step, setStep] = useState(0)
  const [completed, setCompleted] = useState<Set<number>>(() => new Set(existing ? stepFields.map((_, i) => i) : []))
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  // After the first draft save of a new village, further saves update that record.
  const [draftId, setDraftId] = useState<string | null>(null)

  const schema = useMemo(() => buildVillageSchema(t), [t])
  const methods = useForm<VillageFormValues>({
    resolver: zodResolver(schema),
    defaultValues: existing ? valuesFromVillage(existing, population, villages) : emptyValues(),
    mode: 'onTouched',
  })
  const {
    trigger,
    getValues,
    handleSubmit,
    formState: { errors, isDirty },
  } = methods

  // Guard unsaved work: confirm before leaving the form, warn on reload/close.
  const leaveAllowed = useRef(false)
  const blocker = useBlocker(({ currentLocation, nextLocation }) => isDirty && !leaveAllowed.current && currentLocation.pathname !== nextLocation.pathname)
  useEffect(() => {
    if (!isDirty) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [isDirty])

  const steps = [
    t('Basic information', 'المعلومات الأساسية'),
    t('Alternative & historical names', 'الأسماء البديلة والتاريخية'),
    t('Administrative location', 'الموقع الإداري'),
    t('Geographic information', 'المعلومات الجغرافية'),
    t('Population records', 'السجلات السكانية'),
    t('Historical background', 'الخلفية التاريخية'),
    t('Heritage & landmarks', 'التراث والمعالم'),
    t('Agriculture & economy', 'الزراعة والاقتصاد'),
    t('Public facilities', 'المرافق العامة'),
    t('Sources & references', 'المصادر والمراجع'),
  ].map((label, i) => ({ key: String(i), label, invalid: stepFields[i].some((f) => f in errors) }))

  if (mode === 'edit' && !existing) {
    return (
      <EmptyState
        icon={<Compass className="size-7" />}
        title={t('Village not found', 'القرية غير موجودة')}
        description={t('It may have been deleted.', 'ربما حُذفت.')}
        action={<ButtonLink to="/dashboard/villages">{t('Back to villages', 'العودة إلى القرى')}</ButtonLink>}
      />
    )
  }

  const goTo = (i: number) => {
    setStep(i)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const next = async () => {
    const ok = await trigger(stepFields[step])
    if (!ok) {
      toast.error(t('Please fix the highlighted fields', 'يرجى تصحيح الحقول المحددة'))
      return
    }
    setCompleted((c) => new Set(c).add(step))
    goTo(Math.min(step + 1, stepFields.length - 1))
  }

  /**
   * Saves through the API: the village row, its sections, then its population series. Draft saves accept
   * incomplete data, but never invent it: coordinates left empty stay "not documented" (ADR-0008); the
   * server refuses to publish without them.
   */
  const persist = async (values: VillageFormValues, statusOverride?: VillageFormValues['status']) => {
    const validNum = (s: string) => s.trim() !== '' && !Number.isNaN(Number(s))
    const sanitized: VillageFormValues = {
      ...values,
      status: statusOverride ?? values.status,
      lat: validNum(values.lat) ? values.lat : '',
      lng: validNum(values.lng) ? values.lng : '',
      population: values.population.filter((p) => validNum(p.year) && validNum(p.population)),
    }
    const current = existing ?? villages.find((v) => v.id === draftId)
    const { village, population: records } = villageFromValues(sanitized, current, user?.id ?? '', villages.map((v) => v.id))
    const savedId = await saveVillage(village, current ? 'update' : 'create')
    await setVillagePopulation(savedId, records.map((r) => ({ ...r, villageId: savedId })))
    return { ...village, id: savedId }
  }

  const failed = (title: string, error: unknown) =>
    toast.error(title, error instanceof ApiError ? error.userMessage : t('Unexpected error', 'خطأ غير متوقع'))

  const saveDraft = async () => {
    const ok = await trigger(['nameAr', 'nameEn'])
    if (!ok) {
      goTo(0)
      toast.error(t('A draft needs at least the village name in both languages', 'تحتاج المسودة إلى اسم القرية باللغتين على الأقل'))
      return
    }
    setSavingDraft(true)
    try {
      const v = await persist(getValues(), mode === 'create' ? 'draft' : undefined)
      setDraftId(v.id)
      methods.reset(getValues())
      toast.success(t('Draft saved', 'تم حفظ المسودة'), t('Saved on the server as a draft.', 'حُفظت على الخادم كمسودة.'))
    } catch (error) {
      failed(t('The draft was not saved', 'لم تُحفظ المسودة'), error)
    } finally {
      setSavingDraft(false)
    }
  }

  const onInvalid = (errs: FieldErrors<VillageFormValues>) => {
    const first = stepFields.findIndex((fields) => fields.some((f) => f in errs))
    if (first >= 0) goTo(first)
    toast.error(t('Some steps need attention', 'بعض الخطوات بحاجة إلى مراجعة'), t('Steps with a red dot contain errors.', 'الخطوات المعلّمة بنقطة حمراء تحتوي على أخطاء.'))
  }

  const confirmSave = async () => {
    setSubmitting(true)
    const values = getValues()
    // Contributors cannot publish: the server keeps their village as a draft until an editor publishes it.
    const status = user?.role === 'contributor' ? 'draft' : values.status
    try {
      await persist(values, status)
    } catch (error) {
      setSubmitting(false)
      failed(t('The village was not saved', 'لم تُحفظ القرية'), error)
      return
    }
    setSubmitting(false)
    setConfirmOpen(false)
    leaveAllowed.current = true
    toast.success(
      mode === 'create' ? t('Village saved', 'تم حفظ القرية') : t('Changes saved', 'تم حفظ التغييرات'),
      t('Every change is now in the review queue.', 'أصبح كل تعديل الآن في قائمة المراجعة.'),
    )
    navigate('/dashboard/villages')
  }

  const StepComponent = stepComponents[step]
  const isLast = step === stepFields.length - 1
  const title = mode === 'create' ? t('Create village', 'إضافة قرية') : t(`Edit ${existing?.name.en}`, `تعديل ${existing?.name.ar}`)
  const values = getValues()

  return (
    <div>
      <PageHeader
        title={title}
        description={mode === 'create' ? t('Build a new village profile in ten short steps.', 'أنشئ ملف قرية جديدًا في عشر خطوات قصيرة.') : t('Update any section and save your changes.', 'حدّث أي قسم ثم احفظ التغييرات.')}
        crumbs={[{ label: t('Villages', 'القرى'), to: '/dashboard/villages' }, { label: mode === 'create' ? t('New', 'جديدة') : pick(existing!.name) }]}
        actions={
          existing && (
            <ButtonLink to={`/villages/${existing.id}`} variant="outline" icon={<Eye className="size-4" />}>
              {t('View profile', 'عرض الملف')}
            </ButtonLink>
          )
        }
      />

      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(() => setConfirmOpen(true), onInvalid)} noValidate className="grid gap-6 lg:grid-cols-[17rem_1fr]">
          <aside className="card h-fit p-4 lg:sticky lg:top-24">
            <Stepper steps={steps} current={step} onSelect={goTo} completed={completed} />
          </aside>

          <div className="card flex min-w-0 flex-col">
            <div key={step} className="animate-fade-in p-5 sm:p-8">
              <StepComponent />
            </div>
            <div className="sticky bottom-0 mt-auto flex flex-wrap items-center justify-between gap-3 rounded-b-[var(--radius-card)] border-t border-stone-line bg-paper/95 px-5 py-4 backdrop-blur sm:px-8">
              <Button variant="ghost" onClick={() => goTo(step - 1)} disabled={step === 0} icon={<ArrowLeft className="size-4 rtl:rotate-180" />}>
                {t('Previous', 'السابق')}
              </Button>
              <div className="flex flex-wrap items-center gap-2">
                {isDirty && <span className="hidden text-xs text-muted sm:inline">{t('Unsaved changes', 'تغييرات غير محفوظة')}</span>}
                <Button variant="outline" onClick={saveDraft} loading={savingDraft} icon={<Save className="size-4" />}>
                  {t('Save as draft', 'حفظ كمسودة')}
                </Button>
                {isLast ? (
                  <Button type="submit" icon={<Send className="size-4 rtl:-scale-x-100" />}>
                    {mode === 'create' ? t('Submit', 'إرسال') : t('Save changes', 'حفظ التغييرات')}
                  </Button>
                ) : (
                  <Button onClick={next}>
                    {t('Next', 'التالي')}
                    <ArrowRight className="size-4 rtl:rotate-180" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </form>
      </FormProvider>

      <Dialog
        open={confirmOpen}
        onClose={() => !submitting && setConfirmOpen(false)}
        title={mode === 'create' ? t('Submit this village?', 'إرسال هذه القرية؟') : t('Save changes?', 'حفظ التغييرات؟')}
        description={t('Changes are saved to the platform and enter the review queue.', 'تُحفظ التغييرات في المنصة وتدخل قائمة المراجعة.')}
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={submitting}>
              {t('Keep editing', 'متابعة التعديل')}
            </Button>
            <Button onClick={confirmSave} loading={submitting}>
              {mode === 'create' ? t('Confirm & submit', 'تأكيد وإرسال') : t('Confirm & save', 'تأكيد وحفظ')}
            </Button>
          </>
        }
      >
        <dl className="grid grid-cols-2 gap-3 rounded-2xl bg-paper p-4 text-sm">
          <div>
            <dt className="text-xs text-muted">{t('Village', 'القرية')}</dt>
            <dd className="font-medium">
              {values.nameAr} · {values.nameEn}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">{t('Governorate', 'المحافظة')}</dt>
            <dd className="font-medium">{values.governorateId ? pick(governorateById(values.governorateId)!.name) : '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">{t('Population records', 'السجلات السكانية')}</dt>
            <dd className="font-medium">{values.population.length}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">{t('Sources linked', 'المصادر المرتبطة')}</dt>
            <dd className="font-medium">{values.sourceIds.length}</dd>
          </div>
        </dl>
        {mode === 'create' && (
          <p className="mt-3 text-sm text-muted">{t('New villages enter the review queue before they are published.', 'تدخل القرى الجديدة قائمة المراجعة قبل نشرها.')}</p>
        )}
      </Dialog>

      <Dialog
        open={blocker.state === 'blocked'}
        onClose={() => blocker.reset?.()}
        size="sm"
        title={t('Leave without saving?', 'المغادرة دون حفظ؟')}
        description={t('You have unsaved changes in this form. Save a draft first to keep them.', 'لديك تغييرات غير محفوظة في هذا النموذج. احفظ مسودة أولًا للاحتفاظ بها.')}
        footer={
          <>
            <Button variant="outline" onClick={() => blocker.reset?.()}>
              {t('Stay on this page', 'البقاء في الصفحة')}
            </Button>
            <Button variant="danger" onClick={() => blocker.proceed?.()}>
              {t('Discard changes', 'تجاهل التغييرات')}
            </Button>
          </>
        }
      />
    </div>
  )
}
