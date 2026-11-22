import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { BookMarked, Building2, History, Landmark, Pencil, Plus, Sparkles, Sprout, Trash2 } from 'lucide-react'
import type { HeritageEntry, HeritageSection } from '@/types'
import { culturalCategoryLabels, facilityKindLabels, heritageKindLabels, heritageSectionLabels } from '@/i18n/labels'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/feedback/States'
import { Field, Input, Select, Textarea } from '@/components/forms/Fields'
import { IconAction } from '@/components/tables/IconAction'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog, Dialog } from '@/components/ui/Dialog'
import { SearchBar } from '@/components/ui/Misc'
import { Pagination } from '@/components/ui/Pagination'
import { TabPanel, Tabs } from '@/components/ui/Tabs'
import { useData } from '@/hooks/useData'
import { errorMessage } from '@/firebase/errors'
import { useI18n } from '@/hooks/useI18n'
import { useToast } from '@/hooks/useToast'
import { normalizeSearch, paginate, uid } from '@/utils/misc'

const sectionIcons: Record<HeritageSection, typeof History> = {
  background: History,
  names: BookMarked,
  landmarks: Landmark,
  culture: Sparkles,
  agriculture: Sprout,
  facilities: Building2,
}

const sections: HeritageSection[] = ['background', 'names', 'landmarks', 'culture', 'agriculture', 'facilities']

function EntryDialog({ open, onClose, section, entry }: { open: boolean; onClose: () => void; section: HeritageSection; entry: HeritageEntry | null }) {
  const { t, pick } = useI18n()
  const { villages, saveHeritage } = useData()
  const toast = useToast()
  const hasCategory = section === 'landmarks' || section === 'facilities' || section === 'culture'
  const hasPeriod = section === 'background' || section === 'names'
  // For historical names the period is the whole body, so the text boxes are hidden.
  const hasBody = section !== 'names'

  const schema = z.object({
    villageId: z.string().min(1, t('Select a village', 'اختر القرية')),
    titleAr: z.string().trim().min(2, t('Arabic title is required', 'العنوان العربي مطلوب')),
    titleEn: z.string().trim().min(2, t('English title is required', 'العنوان الإنجليزي مطلوب')),
    bodyAr: z.string().trim().min(section === 'names' ? 0 : 10, t('Add a short text (10+ characters)', 'أضف نصًا قصيرًا (10 أحرف على الأقل)')),
    bodyEn: z.string().trim().min(section === 'names' ? 0 : 10, t('Add a short text (10+ characters)', 'أضف نصًا قصيرًا (10 أحرف على الأقل)')),
    category: z.string(),
    period: z.string().trim(),
  })
  type Values = z.infer<typeof schema>
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (open)
      reset({
        villageId: entry?.villageId ?? '',
        titleAr: entry?.title.ar ?? '',
        titleEn: entry?.title.en ?? '',
        bodyAr: entry?.body.ar ?? '',
        bodyEn: entry?.body.en ?? '',
        category: entry?.category ?? (section === 'landmarks' ? 'architecture' : section === 'facilities' ? 'school' : section === 'culture' ? 'custom' : ''),
        period: entry?.period ?? '',
      })
  }, [open, entry, reset, section])

  const onSubmit = async (v: Values) => {
    try {
      await saveHeritage({
      id: entry?.id ?? uid('he'),
      section,
      villageId: v.villageId,
      title: { ar: v.titleAr, en: v.titleEn },
      body: hasBody ? { ar: v.bodyAr, en: v.bodyEn } : { ar: '', en: '' },
      category: hasCategory ? v.category : undefined,
      period: hasPeriod && v.period ? v.period : undefined,
      updatedAt: new Date().toISOString(),
      })
    } catch (error) {
      toast.error(t('The entry was not saved', 'لم يُحفظ المدخل'), errorMessage(error))
      return
    }
    toast.success(entry ? t('Entry updated', 'تم تحديث المدخل') : t('Entry added', 'تمت إضافة المدخل'))
    onClose()
  }

  const titleLabel = section === 'names' ? t('Historical name', 'الاسم التاريخي') : t('Title', 'العنوان')
  const bodyLabel = section === 'agriculture' ? t('Practices', 'الممارسات') : t('Description', 'الوصف')

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      title={entry ? t('Edit entry', 'تعديل المدخل') : t(`Add to ${heritageSectionLabels[section].en}`, `إضافة إلى ${heritageSectionLabels[section].ar}`)}
      description={entry ? t(`Section: ${heritageSectionLabels[section].en}`, `القسم: ${heritageSectionLabels[section].ar}`) : undefined}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            {t('Cancel', 'إلغاء')}
          </Button>
          <Button type="submit" form="heritage-form">
            {entry ? t('Save changes', 'حفظ التغييرات') : t('Add entry', 'إضافة')}
          </Button>
        </>
      }
    >
      <form id="heritage-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4 pb-2">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('Village', 'القرية')} required error={errors.villageId?.message}>
            {(id, d) => (
              <Select id={id} aria-describedby={d} invalid={!!errors.villageId} {...register('villageId')}>
                <option value="">{t('Select…', 'اختر…')}</option>
                {villages.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name.ar} — {v.name.en}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          {hasCategory && (
            <Field label={t('Category', 'التصنيف')}>
              {(id) => (
                <Select id={id} {...register('category')}>
                  {section === 'culture'
                    ? (Object.keys(culturalCategoryLabels) as (keyof typeof culturalCategoryLabels)[]).map((k) => (
                        <option key={k} value={k}>
                          {pick(culturalCategoryLabels[k])}
                        </option>
                      ))
                    : section === 'landmarks'
                    ? (Object.keys(heritageKindLabels) as (keyof typeof heritageKindLabels)[]).map((k) => (
                        <option key={k} value={k}>
                          {pick(heritageKindLabels[k])}
                        </option>
                      ))
                    : (Object.keys(facilityKindLabels) as (keyof typeof facilityKindLabels)[]).map((k) => (
                        <option key={k} value={k}>
                          {pick(facilityKindLabels[k])}
                        </option>
                      ))}
                </Select>
              )}
            </Field>
          )}
          {hasPeriod && (
            <Field label={t('Period', 'الحقبة')} hint={section === 'names' ? t('The date the name first appeared.', 'تاريخ أول ظهور لهذا الاسم.') : t('The date or era this background covers.', 'التاريخ أو الحقبة التي تغطيها هذه الخلفية.')}>
              {(id, d) => <Input id={id} dir="auto" aria-describedby={d} placeholder={section === 'names' ? '1596' : t('e.g. Ottoman period, 1517–1917', 'مثال: العهد العثماني، 1517–1917')} {...register('period')} />}
            </Field>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={`${titleLabel} — ${t('Arabic', 'العربية')}`} required error={errors.titleAr?.message}>
            {(id, d) => <Input id={id} dir="rtl" lang="ar" aria-describedby={d} invalid={!!errors.titleAr} {...register('titleAr')} />}
          </Field>
          <Field label={`${titleLabel} — English`} required error={errors.titleEn?.message}>
            {(id, d) => <Input id={id} dir="ltr" lang="en" aria-describedby={d} invalid={!!errors.titleEn} {...register('titleEn')} />}
          </Field>
          {hasBody && (
            <>
              <Field label={`${bodyLabel} — ${t('Arabic', 'العربية')}`} error={errors.bodyAr?.message}>
                {(id, d) => <Textarea id={id} rows={4} dir="rtl" lang="ar" aria-describedby={d} invalid={!!errors.bodyAr} {...register('bodyAr')} />}
              </Field>
              <Field label={`${bodyLabel} — English`} error={errors.bodyEn?.message}>
                {(id, d) => <Textarea id={id} rows={4} dir="ltr" lang="en" aria-describedby={d} invalid={!!errors.bodyEn} {...register('bodyEn')} />}
              </Field>
            </>
          )}
        </div>
      </form>
    </Dialog>
  )
}

export function HeritagePage() {
  const { t, pick, formatDate } = useI18n()
  const { heritage, villages, deleteHeritage } = useData()
  const toast = useToast()
  const [section, setSection] = useState<HeritageSection>('background')
  const [q, setQ] = useState('')
  const [villageId, setVillageId] = useState('')
  const [category, setCategory] = useState('')
  const [page, setPage] = useState(1)
  const [dialog, setDialog] = useState<{ open: boolean; entry: HeritageEntry | null }>({ open: false, entry: null })
  const [toDelete, setToDelete] = useState<HeritageEntry | null>(null)

  // Reset paging (and the category filter on tab change) when filters change.
  const filterKey = `${section}|${q}|${villageId}|${category}`
  const [lastFilterKey, setLastFilterKey] = useState(filterKey)
  const [lastSection, setLastSection] = useState(section)
  if (filterKey !== lastFilterKey) {
    setLastFilterKey(filterKey)
    setPage(1)
  }
  if (section !== lastSection) {
    setLastSection(section)
    setCategory('')
  }

  const villageName = (id: string) => {
    const v = villages.find((x) => x.id === id)
    return v ? pick(v.name) : id
  }

  const filtered = useMemo(() => {
    const needle = normalizeSearch(q)
    return heritage
      .filter((h) => h.section === section)
      .filter((h) => !villageId || h.villageId === villageId)
      .filter((h) => !category || h.category === category)
      .filter((h) => !needle || [h.title.ar, h.title.en, h.body.ar, h.body.en, h.period ?? ''].some((s) => normalizeSearch(s).includes(needle)))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }, [heritage, section, villageId, category, q])

  const { items, totalPages, page: current } = paginate(filtered, page, 8)
  const categoryLabel = (c?: string) => {
    if (!c) return null
    if (section === 'landmarks' && c in heritageKindLabels) return pick(heritageKindLabels[c as keyof typeof heritageKindLabels])
    if (section === 'facilities' && c in facilityKindLabels) return pick(facilityKindLabels[c as keyof typeof facilityKindLabels])
    if (section === 'culture' && c in culturalCategoryLabels) return pick(culturalCategoryLabels[c as keyof typeof culturalCategoryLabels])
    return c
  }

  const Icon = sectionIcons[section]

  return (
    <div>
      <PageHeader
        title={t('History & heritage', 'التاريخ والتراث')}
        description={t('Manage the narrative layers of each profile: history, names, landmarks, culture, land and services.', 'أدِر الطبقات السردية لكل ملف: التاريخ والأسماء والمعالم والثقافة والأرض والخدمات.')}
        actions={
          <Button icon={<Plus className="size-4" />} onClick={() => setDialog({ open: true, entry: null })}>
            {t('Add entry', 'إضافة مدخل')}
          </Button>
        }
      />

      <div className="card overflow-hidden">
        <div className="px-2 pt-1 sm:px-4">
          <Tabs
            idPrefix="heritage"
            value={section}
            onChange={setSection}
            items={sections.map((s) => {
              const I = sectionIcons[s]
              return { key: s, label: pick(heritageSectionLabels[s]), icon: <I className="size-4" />, count: heritage.filter((h) => h.section === s).length }
            })}
          />
        </div>

        <TabPanel id={section} idPrefix="heritage">
          <div className="flex flex-col gap-3 border-b border-stone-line p-4 md:flex-row md:items-center">
            <SearchBar value={q} onChange={setQ} placeholder={t('Search entries…', 'ابحث في المدخلات…')} className="md:w-72" />
            <Select value={villageId} onChange={(e) => setVillageId(e.target.value)} aria-label={t('Filter by village', 'التصفية حسب القرية')} className="h-10 md:w-56">
              <option value="">{t('All villages', 'جميع القرى')}</option>
              {villages.map((v) => (
                <option key={v.id} value={v.id}>
                  {pick(v.name)}
                </option>
              ))}
            </Select>
            {(section === 'landmarks' || section === 'facilities' || section === 'culture') && (
              <Select value={category} onChange={(e) => setCategory(e.target.value)} aria-label={t('Filter by category', 'التصفية حسب التصنيف')} className="h-10 md:w-48">
                <option value="">{t('All categories', 'جميع التصنيفات')}</option>
                {Object.entries(section === 'landmarks' ? heritageKindLabels : section === 'culture' ? culturalCategoryLabels : facilityKindLabels).map(([k, v]) => (
                  <option key={k} value={k}>
                    {pick(v)}
                  </option>
                ))}
              </Select>
            )}
            <p className="text-sm text-muted md:ms-auto">{t(`${filtered.length} entries`, `${filtered.length} مدخل`)}</p>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={<Icon className="size-7" />}
              title={t('Nothing here yet', 'لا يوجد شيء هنا بعد')}
              description={t('No entries match this section and filter.', 'لا توجد مدخلات تطابق هذا القسم والتصفية.')}
              action={
                <Button variant="outline" icon={<Plus className="size-4" />} onClick={() => setDialog({ open: true, entry: null })}>
                  {t('Add entry', 'إضافة مدخل')}
                </Button>
              }
            />
          ) : (
            <ul className="divide-y divide-stone-line">
              {items.map((h) => (
                <li key={h.id} className="group flex gap-4 px-4 py-4 transition hover:bg-beige/40 sm:px-6">
                  <span className="mt-0.5 hidden size-10 shrink-0 items-center justify-center rounded-xl bg-olive-50 text-olive sm:flex">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-ink">{pick(h.title)}</p>
                      {categoryLabel(h.category) && <Badge tone="neutral">{categoryLabel(h.category)}</Badge>}
                    </div>
                    <p className="mt-0.5 text-xs text-muted">
                      {villageName(h.villageId)}
                      {h.period && (
                        <>
                          {' · '}
                          <bdi>{h.period}</bdi>
                        </>
                      )}{' '}
                      · {t('Updated', 'تحديث')} {formatDate(h.updatedAt)}
                    </p>
                    {pick(h.body) && <p className="mt-1.5 line-clamp-2 text-sm text-ink/70">{pick(h.body)}</p>}
                  </div>
                  <div className="flex shrink-0 items-start gap-0.5">
                    <IconAction label={t('Edit', 'تعديل')} onClick={() => setDialog({ open: true, entry: h })}>
                      <Pencil className="size-4" />
                    </IconAction>
                    <IconAction label={t('Delete', 'حذف')} onClick={() => setToDelete(h)} tone="danger">
                      <Trash2 className="size-4" />
                    </IconAction>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {filtered.length > 0 && (
            <div className="border-t border-stone-line px-4 py-3">
              <Pagination page={current} totalPages={totalPages} onChange={setPage} totalItems={filtered.length} pageSize={8} />
            </div>
          )}
        </TabPanel>
      </div>

      <EntryDialog open={dialog.open} entry={dialog.entry} section={section} onClose={() => setDialog({ open: false, entry: null })} />
      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title={t('Delete this entry?', 'حذف هذا المدخل؟')}
        description={toDelete ? `“${pick(toDelete.title)}”` : undefined}
        confirmLabel={t('Delete', 'حذف')}
        onConfirm={async () => {
          if (!toDelete) return
          try {
            await deleteHeritage(toDelete.id)
            toast.success(t('Entry deleted', 'تم حذف المدخل'))
          } catch (error) {
            toast.error(t('The entry was not deleted', 'لم يُحذف المدخل'), errorMessage(error))
          }
        }}
      />
    </div>
  )
}
