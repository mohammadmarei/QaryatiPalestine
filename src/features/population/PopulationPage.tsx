import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CalendarRange, Pencil, Plus, Trash2, TrendingUp, UsersRound } from 'lucide-react'
import type { PopulationRecord } from '@/types'
import { populationKindLabels } from '@/i18n/labels'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable, type Column } from '@/components/tables/DataTable'
import { IconAction } from '@/components/tables/IconAction'
import { Field, Input, Select, Textarea } from '@/components/forms/Fields'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog, Dialog } from '@/components/ui/Dialog'
import { ChartCard, StatCard } from '@/components/ui/StatCard'
import { useData } from '@/hooks/useData'
import { errorMessage } from '@/api/client'
import { useI18n } from '@/hooks/useI18n'
import { useToast } from '@/hooks/useToast'
import { uid } from '@/utils/misc'
import { PopulationChart, PopulationLegend } from '../villages/components/PopulationChart'

function RecordDialog({ open, onClose, villageId, record, existingYears }: { open: boolean; onClose: () => void; villageId: string; record: PopulationRecord | null; existingYears: number[] }) {
  const { t, pick } = useI18n()
  const { sources, savePopulation } = useData()
  const toast = useToast()

  const schema = z.object({
    year: z
      .string()
      .regex(/^\d{4}$/, t('Enter a four-digit year', 'أدخل سنة من أربعة أرقام'))
      .refine((y) => Number(y) >= 1500 && Number(y) <= 2035, t('Year must be between 1500 and 2035', 'يجب أن تكون السنة بين 1500 و2035'))
      .refine((y) => !existingYears.includes(Number(y)) || Number(y) === record?.year, t('A record for this year already exists', 'يوجد سجل لهذه السنة بالفعل')),
    population: z
      .string()
      .regex(/^\d+$/, t('Enter a whole number', 'أدخل رقمًا صحيحًا'))
      .refine((p) => Number(p) <= 5_000_000, t('That number looks too large', 'يبدو هذا الرقم كبيرًا جدًا')),
    kind: z.enum(['census', 'estimate', 'survey']),
    sourceId: z.string().min(1, t('Every figure needs a source', 'يحتاج كل رقم إلى مصدر')),
    note: z.string().max(200),
  })
  type Values = z.infer<typeof schema>

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (open)
      reset(
        record
          ? { year: String(record.year), population: String(record.population), kind: record.kind, sourceId: record.sourceId, note: record.note ?? '' }
          : { year: '', population: '', kind: 'census', sourceId: '', note: '' },
      )
  }, [open, record, reset])

  const onSubmit = async (v: Values) => {
    try {
      await savePopulation({ id: record?.id ?? uid('pop'), villageId, year: Number(v.year), population: Number(v.population), kind: v.kind, sourceId: v.sourceId, note: v.note || undefined })
    } catch (error) {
      toast.error(t('The record was not saved', 'لم يُحفظ السجل'), errorMessage(error))
      return
    }
    toast.success(record ? t('Record updated', 'تم تحديث السجل') : t('Record added', 'تمت إضافة السجل'))
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={record ? t('Edit population record', 'تعديل سجل سكاني') : t('Add population record', 'إضافة سجل سكاني')}
      description={t('Census counts, surveys and estimates are shown differently on the public profile.', 'تُعرض أرقام التعداد والمسوح والتقديرات بشكل مختلف في الملف العام.')}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            {t('Cancel', 'إلغاء')}
          </Button>
          <Button type="submit" form="pop-form" loading={isSubmitting}>
            {record ? t('Save changes', 'حفظ التغييرات') : t('Add record', 'إضافة السجل')}
          </Button>
        </>
      }
    >
      <form id="pop-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4 pb-2">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('Year', 'السنة')} required error={errors.year?.message}>
            {(id, d) => <Input id={id} dir="ltr" inputMode="numeric" aria-describedby={d} invalid={!!errors.year} {...register('year')} />}
          </Field>
          <Field label={t('Population', 'عدد السكان')} required error={errors.population?.message}>
            {(id, d) => <Input id={id} dir="ltr" inputMode="numeric" aria-describedby={d} invalid={!!errors.population} {...register('population')} />}
          </Field>
        </div>
        <Field label={t('Type of figure', 'نوع الرقم')}>
          {(id) => (
            <Select id={id} {...register('kind')}>
              {(['census', 'estimate', 'survey'] as const).map((k) => (
                <option key={k} value={k}>
                  {pick(populationKindLabels[k])}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label={t('Source', 'المصدر')} required error={errors.sourceId?.message}>
          {(id, d) => (
            <Select id={id} aria-describedby={d} invalid={!!errors.sourceId} {...register('sourceId')}>
              <option value="">{t('Select a source…', 'اختر مصدرًا…')}</option>
              {sources.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title.length > 70 ? `${s.title.slice(0, 70)}…` : s.title}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label={t('Note (optional)', 'ملاحظة (اختياري)')} error={errors.note?.message}>
          {(id) => <Textarea id={id} rows={2} {...register('note')} />}
        </Field>
      </form>
    </Dialog>
  )
}

export function PopulationPage() {
  const { t, pick, formatNumber } = useI18n()
  const { villages, population, sources, deletePopulation } = useData()
  const toast = useToast()
  const [params, setParams] = useSearchParams()
  const villageId = params.get('village') ?? villages[0]?.id ?? ''
  const village = villages.find((v) => v.id === villageId)
  const [dialog, setDialog] = useState<{ open: boolean; record: PopulationRecord | null }>({ open: false, record: null })
  const [toDelete, setToDelete] = useState<PopulationRecord | null>(null)

  const records = useMemo(() => population.filter((p) => p.villageId === villageId).sort((a, b) => a.year - b.year), [population, villageId])
  const censuses = records.filter((r) => r.kind !== 'estimate')
  const latest = censuses[censuses.length - 1]
  const first = records[0]
  const change = latest && first && first.population > 0 && latest.id !== first.id ? Math.round(((latest.population - first.population) / first.population) * 100) : null

  const sourceTitle = (id: string) => sources.find((s) => s.id === id)?.title ?? '—'

  const columns: Column<PopulationRecord>[] = [
    { key: 'year', header: t('Year', 'السنة'), sortValue: (r) => r.year, cell: (r) => <span className="font-semibold">{r.year}</span> },
    { key: 'population', header: t('Population', 'السكان'), sortValue: (r) => r.population, cell: (r) => formatNumber(r.population) },
    { key: 'kind', header: t('Type', 'النوع'), sortValue: (r) => r.kind, cell: (r) => <Badge tone={r.kind === 'estimate' ? 'gold' : 'olive'}>{pick(populationKindLabels[r.kind])}</Badge> },
    {
      key: 'source',
      header: t('Source', 'المصدر'),
      sortValue: (r) => sourceTitle(r.sourceId),
      cell: (r) => (
        <div className="max-w-md">
          <span className="line-clamp-2 text-muted" dir="auto">
            {sourceTitle(r.sourceId)}
          </span>
          {r.note && (
            <p className="mt-1 line-clamp-2 text-xs text-ink/70" dir="auto" title={r.note}>
              <span className="font-medium">{t('Note', 'ملاحظة')}:</span> {r.note}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: <span className="sr-only">{t('Actions', 'الإجراءات')}</span>,
      className: 'w-0',
      cell: (r) => (
        <div className="flex justify-end gap-0.5">
          <IconAction label={t(`Edit ${r.year}`, `تعديل ${r.year}`)} onClick={() => setDialog({ open: true, record: r })}>
            <Pencil className="size-4" />
          </IconAction>
          <IconAction label={t(`Delete ${r.year}`, `حذف ${r.year}`)} onClick={() => setToDelete(r)} tone="danger">
            <Trash2 className="size-4" />
          </IconAction>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title={t('Population management', 'إدارة السكان')}
        description={t('Maintain each village’s population series, with a source for every figure.', 'أدِر السلسلة السكانية لكل قرية، مع مصدر لكل رقم.')}
        actions={
          <Button icon={<Plus className="size-4" />} onClick={() => setDialog({ open: true, record: null })} disabled={!village}>
            {t('Add record', 'إضافة سجل')}
          </Button>
        }
      />

      <div className="card mb-6 flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <label htmlFor="village-select" className="text-sm font-medium whitespace-nowrap text-ink">
          {t('Village', 'القرية')}
        </label>
        <div className="sm:w-80">
          <Select id="village-select" value={villageId} onChange={(e) => setParams({ village: e.target.value }, { replace: true })}>
            {[...villages]
              .sort((a, b) => pick(a.name).localeCompare(pick(b.name)))
              .map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name.ar} — {v.name.en}
                </option>
              ))}
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label={t('Records', 'السجلات')} value={formatNumber(records.length)} icon={<CalendarRange className="size-5" />} />
        <StatCard
          label={t('Latest census', 'آخر تعداد')}
          value={latest ? formatNumber(latest.population) : '—'}
          icon={<UsersRound className="size-5" />}
          tone="forest"
          hint={latest ? t(`Year ${latest.year}`, `سنة ${latest.year}`) : undefined}
        />
        <StatCard
          label={t('Change since first record', 'التغير منذ أول سجل')}
          value={change !== null ? `${change > 0 ? '+' : ''}${formatNumber(change)}%` : '—'}
          icon={<TrendingUp className="size-5" />}
          tone="gold"
          hint={first ? t(`Since ${first.year}`, `منذ ${first.year}`) : undefined}
        />
      </div>

      <div className="mt-6 grid gap-6">
        <ChartCard title={t('Historical population', 'السكان عبر التاريخ')} subtitle={village ? `${village.name.ar} · ${village.name.en}` : undefined} action={<PopulationLegend />}>
          <PopulationChart records={records} height={300} />
        </ChartCard>
        <div className="card overflow-hidden">
          <DataTable
            caption={t('Population records', 'السجلات السكانية')}
            rows={records}
            columns={columns}
            rowKey={(r) => r.id}
            pageSize={8}
            resetPageKey={villageId}
            emptyTitle={village ? t('No records for this village', 'لا توجد سجلات لهذه القرية') : t('Select a village', 'اختر قرية')}
            emptyDescription={village ? t('Add census counts, surveys or estimates — each with a source.', 'أضف أرقام التعداد أو المسوح أو التقديرات — مع مصدر لكل منها.') : undefined}
            emptyAction={
              <Button variant="outline" icon={<Plus className="size-4" />} onClick={() => setDialog({ open: true, record: null })}>
                {t('Add the first record', 'أضف أول سجل')}
              </Button>
            }
          />
        </div>
      </div>

      <RecordDialog open={dialog.open} record={dialog.record} villageId={villageId} existingYears={records.map((r) => r.year)} onClose={() => setDialog({ open: false, record: null })} />
      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title={t('Delete this record?', 'حذف هذا السجل؟')}
        description={toDelete ? t(`The ${toDelete.year} figure will be removed.`, `سيُحذف رقم عام ${toDelete.year}.`) : undefined}
        confirmLabel={t('Delete', 'حذف')}
        onConfirm={async () => {
          if (!toDelete) return
          try {
            await deletePopulation(toDelete.id)
            toast.success(t('Record deleted', 'تم حذف السجل'))
          } catch (error) {
            toast.error(t('The record was not deleted', 'لم يُحذف السجل'), errorMessage(error))
          }
        }}
      />
    </div>
  )
}
