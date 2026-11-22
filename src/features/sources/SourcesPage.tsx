import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react'
import type { Source, SourceType } from '@/types'
import { sourceTypeLabels } from '@/i18n/labels'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable, type Column } from '@/components/tables/DataTable'
import { IconAction } from '@/components/tables/IconAction'
import { DateInput, Field, Input, Select, Textarea } from '@/components/forms/Fields'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog, Dialog } from '@/components/ui/Dialog'
import { SearchBar } from '@/components/ui/Misc'
import { useData } from '@/hooks/useData'
import { errorMessage } from '@/firebase/errors'
import { useI18n } from '@/hooks/useI18n'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/utils/cn'
import { normalizeSearch, uid } from '@/utils/misc'

const types = Object.keys(sourceTypeLabels) as SourceType[]

function SourceDialog({ open, onClose, source }: { open: boolean; onClose: () => void; source: Source | null }) {
  const { t, pick } = useI18n()
  const { villages, saveSource } = useData()
  const toast = useToast()

  const schema = z.object({
    title: z.string().trim().min(3, t('Title is required', 'العنوان مطلوب')),
    type: z.enum(['book', 'article', 'archive', 'census', 'website', 'oral-history', 'map']),
    author: z.string().trim(),
    organization: z.string().trim(),
    reference: z.string().trim().min(3, t('Add a reference (publisher, archive, collection…)', 'أضف مرجعًا (الناشر، الأرشيف، المجموعة…)')),
    url: z
      .string()
      .trim()
      .refine((u) => u === '' || /^https?:\/\/\S+\.\S+/.test(u), t('Enter a full URL starting with http(s)://', 'أدخل رابطًا كاملًا يبدأ بـ http(s)://')),
    publishedAt: z.string().min(1, t('Publication date is required', 'تاريخ النشر مطلوب')),
    villageIds: z.array(z.string()),
    noteAr: z.string().trim().max(300, t('Keep the note under 300 characters', 'اجعل الملاحظة أقل من 300 حرف')),
    noteEn: z.string().trim().max(300, t('Keep the note under 300 characters', 'اجعل الملاحظة أقل من 300 حرف')),
  })
  type Values = z.infer<typeof schema>
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (open)
      reset({
        title: source?.title ?? '',
        type: source?.type ?? 'book',
        author: source?.author ?? '',
        organization: source?.organization ?? '',
        reference: source?.reference ?? '',
        url: source?.url ?? '',
        publishedAt: source?.publishedAt.slice(0, 10) ?? '',
        villageIds: source?.villageIds ?? [],
        noteAr: source?.note?.ar ?? '',
        noteEn: source?.note?.en ?? '',
      })
  }, [open, source, reset])

  const onSubmit = async (v: Values) => {
    const note = v.noteAr || v.noteEn ? { ar: v.noteAr, en: v.noteEn } : undefined
    try {
      await saveSource({ id: source?.id ?? uid('src'), title: v.title, type: v.type, author: v.author || undefined, organization: v.organization || undefined, reference: v.reference, url: v.url || undefined, publishedAt: v.publishedAt, villageIds: v.villageIds, note })
    } catch (error) {
      toast.error(t('The source was not saved', 'لم يُحفظ المصدر'), errorMessage(error))
      return
    }
    toast.success(source ? t('Source updated', 'تم تحديث المصدر') : t('Source added', 'تمت إضافة المصدر'))
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      title={source ? t('Edit source', 'تعديل المصدر') : t('Add source', 'إضافة مصدر')}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            {t('Cancel', 'إلغاء')}
          </Button>
          <Button type="submit" form="source-form">
            {source ? t('Save changes', 'حفظ التغييرات') : t('Add source', 'إضافة المصدر')}
          </Button>
        </>
      }
    >
      <form id="source-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4 pb-2">
        <Field label={t('Title', 'العنوان')} required error={errors.title?.message}>
          {(id, d) => <Input id={id} dir="auto" aria-describedby={d} invalid={!!errors.title} {...register('title')} />}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('Source type', 'نوع المصدر')}>
            {(id) => (
              <Select id={id} {...register('type')}>
                {types.map((k) => (
                  <option key={k} value={k}>
                    {pick(sourceTypeLabels[k])}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label={t('Publication date', 'تاريخ النشر')} required error={errors.publishedAt?.message}>
            {(id, d) => <DateInput id={id} aria-describedby={d} invalid={!!errors.publishedAt} {...register('publishedAt')} />}
          </Field>
          <Field label={t('Author', 'المؤلف')}>
            {(id) => <Input id={id} dir="auto" {...register('author')} />}
          </Field>
          <Field label={t('Organization', 'الجهة')}>
            {(id) => <Input id={id} dir="auto" {...register('organization')} />}
          </Field>
        </div>
        <Field label={t('URL (optional)', 'الرابط (اختياري)')} error={errors.url?.message}>
          {(id, d) => <Input id={id} dir="ltr" type="url" placeholder="https://" aria-describedby={d} invalid={!!errors.url} {...register('url')} />}
        </Field>
        <Field label={t('Reference', 'المرجع')} required error={errors.reference?.message} hint={t('Publisher, archive, volume and page — enough to find it again.', 'الناشر أو الأرشيف أو المجلد والصفحة — ما يكفي للعثور عليه مجددًا.')}>
          {(id, d) => <Input id={id} dir="auto" aria-describedby={d} invalid={!!errors.reference} {...register('reference')} />}
        </Field>
        <Controller
          control={control}
          name="villageIds"
          render={({ field }) => (
            <fieldset>
              <legend className="text-sm font-medium text-ink">{t('Related villages', 'القرى المرتبطة')}</legend>
              <div className="scrollbar-thin mt-2 flex max-h-40 flex-wrap gap-1.5 overflow-y-auto rounded-xl border border-stone-line p-2">
                {villages.map((v) => {
                  const on = field.value?.includes(v.id)
                  return (
                    <button
                      key={v.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => field.onChange(on ? field.value.filter((x) => x !== v.id) : [...(field.value ?? []), v.id])}
                      className={cn('rounded-full border px-3 py-1 text-xs transition', on ? 'border-olive bg-olive text-white' : 'border-stone-line bg-white text-ink/80 hover:border-olive-300')}
                    >
                      {pick(v.name)}
                    </button>
                  )
                })}
              </div>
            </fieldset>
          )}
        />
        <fieldset>
          <legend className="text-sm font-medium text-ink">{t('Notes (optional)', 'ملاحظات (اختياري)')}</legend>
          <div className="mt-2 grid gap-4 sm:grid-cols-2">
            <Field label={<span className="text-xs font-normal text-muted">{t('Arabic', 'العربية')}</span>} error={errors.noteAr?.message}>
              {(id, d) => <Textarea id={id} rows={2} dir="rtl" lang="ar" aria-describedby={d} invalid={!!errors.noteAr} {...register('noteAr')} />}
            </Field>
            <Field label={<span className="text-xs font-normal text-muted">English</span>} error={errors.noteEn?.message}>
              {(id, d) => <Textarea id={id} rows={2} dir="ltr" lang="en" aria-describedby={d} invalid={!!errors.noteEn} {...register('noteEn')} />}
            </Field>
          </div>
        </fieldset>
      </form>
    </Dialog>
  )
}

export function SourcesPage() {
  const { t, pick, formatDate } = useI18n()
  const { sources, villages, population, deleteSource } = useData()
  const toast = useToast()
  const [q, setQ] = useState('')
  const [type, setType] = useState<SourceType | ''>('')
  const [villageId, setVillageId] = useState('')
  const [dialog, setDialog] = useState<{ open: boolean; source: Source | null }>({ open: false, source: null })
  const [toDelete, setToDelete] = useState<Source | null>(null)

  const rows = useMemo(() => {
    const needle = normalizeSearch(q)
    return sources.filter(
      (s) =>
        (!type || s.type === type) &&
        (!villageId || s.villageIds.includes(villageId)) &&
        (!needle || normalizeSearch(`${s.title} ${s.author ?? ''} ${s.organization ?? ''} ${s.reference}`).includes(needle)),
    )
  }, [sources, q, type, villageId])

  const villageName = (id: string) => {
    const v = villages.find((x) => x.id === id)
    return v ? pick(v.name) : id
  }
  const usage = (id: string) => population.filter((p) => p.sourceId === id).length

  const columns: Column<Source>[] = [
    {
      key: 'title',
      header: t('Source', 'المصدر'),
      sortValue: (s) => s.title,
      cell: (s) => (
        <div className="max-w-md">
          <p className="font-medium text-ink" dir="auto">
            {s.title}
          </p>
          <p className="mt-0.5 text-xs text-muted" dir="auto">
            {[s.author, s.organization, s.reference].filter(Boolean).join(' — ')}
          </p>
          {pick(s.note) && <p className="mt-1 line-clamp-2 text-xs text-ink/70">{pick(s.note)}</p>}
        </div>
      ),
    },
    { key: 'type', header: t('Type', 'النوع'), sortValue: (s) => s.type, cell: (s) => <Badge tone="neutral">{pick(sourceTypeLabels[s.type])}</Badge> },
    {
      key: 'url',
      header: t('Link', 'الرابط'),
      cell: (s) =>
        s.url ? (
          <a href={s.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-olive hover:text-accent-dark" title={s.url}>
            <ExternalLink className="size-4" />
            <span className="max-w-[10rem] truncate text-xs">{s.url.replace(/^https?:\/\/(www\.)?/, '')}</span>
          </a>
        ) : (
          <span className="text-xs text-muted">—</span>
        ),
    },
    { key: 'date', header: t('Published', 'النشر'), sortValue: (s) => s.publishedAt, cell: (s) => <span className="whitespace-nowrap text-muted">{formatDate(s.publishedAt, { year: 'numeric', month: 'short' })}</span> },
    {
      key: 'villages',
      header: t('Related villages', 'القرى المرتبطة'),
      sortValue: (s) => s.villageIds.length,
      cell: (s) => (
        <div className="flex max-w-xs flex-wrap gap-1">
          {s.villageIds.slice(0, 3).map((id) => (
            <span key={id} className="rounded-full bg-beige px-2 py-0.5 text-xs">
              {villageName(id)}
            </span>
          ))}
          {s.villageIds.length > 3 && <span className="rounded-full bg-olive-50 px-2 py-0.5 text-xs text-olive">+{s.villageIds.length - 3}</span>}
        </div>
      ),
    },
    {
      key: 'actions',
      header: <span className="sr-only">{t('Actions', 'الإجراءات')}</span>,
      className: 'w-0',
      cell: (s) => (
        <div className="flex justify-end gap-0.5">
          <IconAction label={t('Edit source', 'تعديل المصدر')} onClick={() => setDialog({ open: true, source: s })}>
            <Pencil className="size-4" />
          </IconAction>
          <IconAction label={t('Delete source', 'حذف المصدر')} onClick={() => setToDelete(s)} tone="danger">
            <Trash2 className="size-4" />
          </IconAction>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title={t('Sources & references', 'المصادر والمراجع')}
        description={t('The bibliography behind every profile: books, archives, censuses, maps and testimonies.', 'المراجع التي يقوم عليها كل ملف: كتب وأرشيفات وتعدادات وخرائط وشهادات.')}
        actions={
          <Button icon={<Plus className="size-4" />} onClick={() => setDialog({ open: true, source: null })}>
            {t('Add source', 'إضافة مصدر')}
          </Button>
        }
      />
      <div className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-stone-line p-4 md:flex-row md:items-center">
          <SearchBar value={q} onChange={setQ} placeholder={t('Search title, author, organization or reference…', 'ابحث بالعنوان أو المؤلف أو الجهة أو المرجع…')} className="md:w-80" />
          <Select value={type} onChange={(e) => setType(e.target.value as SourceType | '')} aria-label={t('Type', 'النوع')} className="h-10 md:w-48">
            <option value="">{t('All types', 'جميع الأنواع')}</option>
            {types.map((k) => (
              <option key={k} value={k}>
                {pick(sourceTypeLabels[k])}
              </option>
            ))}
          </Select>
          <Select value={villageId} onChange={(e) => setVillageId(e.target.value)} aria-label={t('Village', 'القرية')} className="h-10 md:w-52">
            <option value="">{t('All villages', 'جميع القرى')}</option>
            {villages.map((v) => (
              <option key={v.id} value={v.id}>
                {pick(v.name)}
              </option>
            ))}
          </Select>
        </div>
        <DataTable
          caption={t('Sources', 'المصادر')}
          rows={rows}
          columns={columns}
          rowKey={(s) => s.id}
          initialSort={{ key: 'date', dir: 'desc' }}
          resetPageKey={`${q}|${type}|${villageId}`}
          emptyTitle={t('No sources match', 'لا توجد مصادر مطابقة')}
          emptyDescription={t('Try another search or clear a filter.', 'جرّب بحثًا آخر أو أزل أحد عوامل التصفية.')}
          emptyAction={
            <Button variant="outline" icon={<Plus className="size-4" />} onClick={() => setDialog({ open: true, source: null })}>
              {t('Add source', 'إضافة مصدر')}
            </Button>
          }
        />
      </div>

      <SourceDialog open={dialog.open} source={dialog.source} onClose={() => setDialog({ open: false, source: null })} />
      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title={t('Delete this source?', 'حذف هذا المصدر؟')}
        description={toDelete ? `“${toDelete.title}”` : undefined}
        confirmLabel={t('Delete source', 'حذف المصدر')}
        onConfirm={async () => {
          if (!toDelete) return
          try {
            await deleteSource(toDelete.id)
            toast.success(t('Source deleted', 'تم حذف المصدر'))
          } catch (error) {
            toast.error(t('The source was not deleted', 'لم يُحذف المصدر'), errorMessage(error))
          }
        }}
      >
        {toDelete && usage(toDelete.id) > 0 && (
          <p className="rounded-xl bg-gold-50 px-3.5 py-2.5 text-sm text-[#7a5f2b]">
            {t(`${usage(toDelete.id)} population records cite this source and will show it as missing.`, `${usage(toDelete.id)} سجلات سكانية تستشهد بهذا المصدر وستظهره كمفقود.`)}
          </p>
        )}
      </ConfirmDialog>
    </div>
  )
}
