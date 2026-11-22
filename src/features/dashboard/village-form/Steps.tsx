import { useMemo, useState } from 'react'
import { useParams } from 'react-router'
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form'
import { Check, MapPin, Trash2 } from 'lucide-react'
import type { SceneKind } from '@/types'
import { governorates, governorateById } from '@/data/governorates'
import { buildPlaceOptions, type PlaceOption } from '@/data/places'
import { facilityKindLabels, heritageKindLabels, populationKindLabels, recordStatusLabels, sourceTypeLabels } from '@/i18n/labels'
import { VillageArt } from '@/components/brand/VillageArt'
import { Checkbox, Field, Select } from '@/components/forms/Fields'
import { ImageDrop } from '@/components/forms/ImageDrop'
import { Badge } from '@/components/ui/Badge'
import { SearchBar } from '@/components/ui/Misc'
import { useData } from '@/hooks/useData'
import { useI18n } from '@/hooks/useI18n'
import { cn } from '@/utils/cn'
import { uid } from '@/utils/misc'
import type { VillageFormValues } from './schema'
import { AddButton, BilingualField, RepeatItem, StepIntro, TextField, useFieldError } from './FormBits'

const scenes: SceneKind[] = ['terraces', 'grove', 'ruins', 'hilltop', 'valley', 'plain']

export function BasicStep() {
  const { t } = useI18n()
  const { setValue, register } = useFormContext<VillageFormValues>()
  const scene = useWatch<VillageFormValues, 'scene'>({ name: 'scene' })
  const palette = useWatch<VillageFormValues, 'palette'>({ name: 'palette' })
  const nameAr = useWatch<VillageFormValues, 'nameAr'>({ name: 'nameAr' })
  const nameEn = useWatch<VillageFormValues, 'nameEn'>({ name: 'nameEn' })
  const coverImage = useWatch<VillageFormValues, 'coverImage'>({ name: 'coverImage' })
  const sceneLabels: Record<SceneKind, string> = {
    terraces: t('Terraces', 'مدرّجات'),
    grove: t('Olive grove', 'بستان زيتون'),
    ruins: t('Ruins', 'آثار'),
    hilltop: t('Hilltop', 'قمة تلّة'),
    valley: t('Valley', 'وادٍ'),
    plain: t('Plain', 'سهل'),
  }

  return (
    <div className="space-y-6">
      <StepIntro title={t('Basic information', 'المعلومات الأساسية')} description={t('The village name in both languages and a short introduction.', 'اسم القرية باللغتين ومقدمة قصيرة عنها.')} />
      <BilingualField label={t('Village name', 'اسم القرية')} ar="nameAr" en="nameEn" required />
      <BilingualField label={t('Short summary', 'ملخص قصير')} ar="summaryAr" en="summaryEn" required multiline rows={2} hint={t('One or two sentences shown on cards and search results.', 'جملة أو جملتان تظهران في البطاقات ونتائج البحث.')} />
      <BilingualField label={t('Full description', 'الوصف الكامل')} ar="descriptionAr" en="descriptionEn" multiline rows={5} />

      <ImageDrop
        label={t('Main image', 'الصورة الرئيسية')}
        hint={t('Shown on the village card and at the top of its profile. JPG, PNG or WebP.', 'تظهر على بطاقة القرية وفي أعلى صفحتها. JPG أو PNG أو WebP.')}
        value={coverImage}
        onChange={(v) => setValue('coverImage', v, { shouldDirty: true })}
        className="max-w-2xl"
      />

      <fieldset>
        <legend className="text-sm font-medium text-ink">{t('Fallback illustration', 'الرسم البديل للغلاف')}</legend>
        <p className="mt-0.5 text-xs text-muted">{t('Shown when the cover photo cannot be loaded.', 'يظهر عندما يتعذّر تحميل صورة الغلاف.')}</p>
        <div className="mt-3 grid gap-4 lg:grid-cols-[1fr_16rem]">
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {scenes.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setValue('scene', s, { shouldDirty: true })}
                  aria-pressed={scene === s}
                  className={cn('overflow-hidden rounded-xl border-2 text-xs transition', scene === s ? 'border-accent' : 'border-transparent hover:border-stone-line')}
                >
                  <span className="block aspect-square">
                    <VillageArt seed={`picker-${s}`} scene={s} palette={palette} detail={0.5} />
                  </span>
                  <span className="block bg-white py-1">{sceneLabels[s]}</span>
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted">{t('Light', 'الإضاءة')}:</span>
              {[0, 1, 2, 3, 4, 5].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setValue('palette', p, { shouldDirty: true })}
                  aria-pressed={palette === p}
                  aria-label={t(`Palette ${p + 1}`, `لوحة ${p + 1}`)}
                  className={cn('size-8 overflow-hidden rounded-full ring-2 ring-offset-2 transition', palette === p ? 'ring-accent' : 'ring-transparent hover:ring-stone-line')}
                >
                  <VillageArt seed="swatch" scene="plain" palette={p} detail={0.3} />
                </button>
              ))}
            </div>
            <Checkbox label={t('Feature this village on the home page', 'إبراز هذه القرية في الصفحة الرئيسية')} {...register('featured')} />
          </div>
          <div className="overflow-hidden rounded-2xl border border-stone-line bg-white">
            <div className="aspect-[4/3]">
              {coverImage ? <img src={coverImage} alt="" className="h-full w-full object-cover" /> : <VillageArt seed={nameEn || 'preview'} scene={scene} palette={palette} />}
            </div>
            <div className="p-3">
              <p className="ar-display text-xl font-bold text-forest">{nameAr || 'اسم القرية'}</p>
              <p className="text-xs tracking-wider text-muted uppercase">{nameEn || 'Village name'}</p>
            </div>
          </div>
        </div>
      </fieldset>
    </div>
  )
}

export function NamesStep() {
  const { t } = useI18n()
  const { control } = useFormContext<VillageFormValues>()
  const { fields, append, remove } = useFieldArray({ control, name: 'historicalNames' })
  const spellings = useFieldArray({ control, name: 'altSpellings' })
  return (
    <div className="space-y-6">
      <StepIntro title={t('Alternative & historical names', 'الأسماء البديلة والتاريخية')} description={t('Spellings and earlier names help people find a village however they know it.', 'تساعد طرق الكتابة والأسماء السابقة الناس على إيجاد القرية بالاسم الذي يعرفونه.')} />
      <div className="space-y-3">
        <p className="text-sm font-medium text-ink">{t('Alternative spellings', 'طرق كتابة أخرى')}</p>
        {spellings.fields.map((f, i) => (
          <RepeatItem key={f.id} index={i} title={t('Alternative spelling', 'طريقة كتابة أخرى')} onRemove={() => spellings.remove(i)}>
            <div className="max-w-md">
              <TextField name={`altSpellings.${i}.value`} label={t('Spelling', 'طريقة الكتابة')} required dir="ltr" placeholder={i === 0 ? 'Bittir' : undefined} />
            </div>
          </RepeatItem>
        ))}
        <AddButton onClick={() => spellings.append({ value: '' })}>{t('Add alternative spelling', 'إضافة طريقة كتابة أخرى')}</AddButton>
      </div>
      <div className="space-y-3">
        <p className="text-sm font-medium text-ink">{t('Historical names', 'الأسماء التاريخية')}</p>
        {fields.map((f, i) => (
          <RepeatItem key={f.id} index={i} title={t('Historical name', 'اسم تاريخي')} onRemove={() => remove(i)}>
            <BilingualField label={t('Name', 'الاسم')} ar={`historicalNames.${i}.nameAr`} en={`historicalNames.${i}.nameEn`} required />
            <div className="max-w-xs">
              <TextField name={`historicalNames.${i}.period`} label={t('Period', 'الحقبة')} dir="auto" placeholder="1596" hint={t('The date the name first appeared.', 'تاريخ أول ظهور لهذا الاسم.')} />
            </div>
          </RepeatItem>
        ))}
        <AddButton onClick={() => append({ nameAr: '', nameEn: '', period: '' })}>{t('Add historical name', 'إضافة اسم تاريخي')}</AddButton>
      </div>
    </div>
  )
}

export function AdminStep() {
  const { t, pick } = useI18n()
  const { register } = useFormContext<VillageFormValues>()
  const err = useFieldError()
  return (
    <div className="space-y-6">
      <StepIntro title={t('Administrative location', 'الموقع الإداري')} description={t('Where the village sits administratively today.', 'الموقع الإداري للقرية حاليًا.')} />
      <div className="grid gap-5 md:grid-cols-2">
        <Field label={t('Governorate', 'المحافظة')} required error={err('governorateId')}>
          {(id, d) => (
            <Select id={id} aria-describedby={d} invalid={!!err('governorateId')} {...register('governorateId')}>
              <option value="">{t('Select a governorate…', 'اختر المحافظة…')}</option>
              {governorates.map((g) => (
                <option key={g.id} value={g.id}>
                  {pick(g.name)}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label={t('Record status', 'حالة السجل')} hint={t('Drafts stay private; published profiles appear on the public site.', 'تبقى المسودات خاصة، وتظهر الملفات المنشورة في الموقع العام.')}>
          {(id, d) => (
            <Select id={id} aria-describedby={d} {...register('status')}>
              {(['draft', 'pending', 'published', 'archived'] as const).map((s) => (
                <option key={s} value={s}>
                  {pick(recordStatusLabels[s])}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>
      <BilingualField label={t('Administrative area / description', 'المنطقة الإدارية / الوصف')} ar="adminAreaAr" en="adminAreaEn" hint={t('e.g. “Bethlehem Governorate · West of Bethlehem”', 'مثال: «محافظة بيت لحم · غرب مدينة بيت لحم»')} />
    </div>
  )
}

/** Select for one nearby place; fills the stored name/link from the chosen option. */
function NearbyPlaceSelect({ index, options }: { index: number; options: PlaceOption[] }) {
  const { t } = useI18n()
  const { register, setValue } = useFormContext<VillageFormValues>()
  const nearby = useWatch<VillageFormValues, 'nearby'>({ name: 'nearby' })
  const err = useFieldError()(`nearby.${index}.placeId`)
  const usedElsewhere = new Set(nearby.filter((_, j) => j !== index).map((n) => n.placeId))
  const label = (o: PlaceOption) => `${o.name.ar} — ${o.name.en}`
  const groups: { key: string; label: string; items: PlaceOption[] }[] = [
    { key: 'village', label: t('Villages', 'القرى'), items: options.filter((o) => o.kind === 'village') },
    { key: 'city', label: t('Cities', 'المدن'), items: options.filter((o) => o.kind === 'city') },
  ]
  return (
    <Field label={t('Village or city', 'القرية أو المدينة')} required error={err}>
      {(id, d) => (
        <Select
          id={id}
          aria-describedby={d}
          invalid={!!err}
          {...register(`nearby.${index}.placeId`, {
            onChange: (e: { target: { value: string } }) => {
              const o = options.find((x) => x.id === e.target.value)
              setValue(`nearby.${index}.nameAr`, o?.name.ar ?? '')
              setValue(`nearby.${index}.nameEn`, o?.name.en ?? '')
              setValue(`nearby.${index}.villageId`, o?.villageId ?? '')
            },
          })}
        >
          <option value="">{t('Select a village or city…', 'اختر قرية أو مدينة…')}</option>
          {groups.map(
            (g) =>
              g.items.length > 0 && (
                <optgroup key={g.key} label={g.label}>
                  {g.items.map((o) => (
                    <option key={o.id} value={o.id} disabled={usedElsewhere.has(o.id)}>
                      {label(o)}
                    </option>
                  ))}
                </optgroup>
              ),
          )}
        </Select>
      )}
    </Field>
  )
}

export function GeoStep() {
  const { t, lang } = useI18n()
  const { id: currentId } = useParams()
  const { control, setValue, getValues } = useFormContext<VillageFormValues>()
  const { fields, append, remove } = useFieldArray({ control, name: 'nearby' })
  const { villages } = useData()
  const gov = useWatch<VillageFormValues, 'governorateId'>({ name: 'governorateId' })
  const center = governorateById(gov)?.center

  // Ready-made list of villages and cities. Places saved earlier that are not
  // in the list (e.g. a landmark) are kept as extra options so nothing is lost.
  const options = useMemo(() => {
    const base = buildPlaceOptions(villages.filter((v) => v.id !== currentId))
    const known = new Set(base.map((o) => o.id))
    const extra: PlaceOption[] = getValues('nearby')
      .filter((n) => n.placeId && !known.has(n.placeId))
      .map((n) => ({ id: n.placeId, kind: 'village', name: { ar: n.nameAr, en: n.nameEn }, villageId: n.villageId || undefined }))
    const collator = new Intl.Collator(lang)
    return [...base, ...extra].sort((a, b) => collator.compare(a.name[lang], b.name[lang]))
  }, [villages, currentId, getValues, lang])
  return (
    <div className="space-y-6">
      <StepIntro title={t('Geographic information', 'المعلومات الجغرافية')} description={t('Coordinates in decimal degrees (WGS84), elevation and neighbouring places.', 'الإحداثيات بالدرجات العشرية (WGS84) والارتفاع والأماكن المجاورة.')} />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField name="lat" label={t('Latitude', 'خط العرض')} required dir="ltr" inputMode="decimal" placeholder="31.7253" />
        <TextField name="lng" label={t('Longitude', 'خط الطول')} required dir="ltr" inputMode="decimal" placeholder="35.1356" />
        <TextField name="elevation" label={t('Elevation (m)', 'الارتفاع (م)')} dir="ltr" inputMode="numeric" />
        <TextField name="area" label={t('Land area (dunums)', 'المساحة (دونم)')} dir="ltr" inputMode="numeric" />
      </div>
      {center && (
        <button
          type="button"
          onClick={() => {
            setValue('lat', String(center.lat), { shouldValidate: true, shouldDirty: true })
            setValue('lng', String(center.lng), { shouldValidate: true, shouldDirty: true })
          }}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-olive hover:text-accent-dark"
        >
          <MapPin className="size-4" /> {t('Use governorate centre as a starting point', 'استخدم مركز المحافظة كنقطة بداية')}
        </button>
      )}
      <div className="space-y-3">
        <p className="text-sm font-medium text-ink">{t('Nearby villages & cities', 'قرى ومدن مجاورة')}</p>
        {fields.map((f, i) => (
          <RepeatItem key={f.id} index={i} title={t('Nearby place', 'مكان مجاور')} onRemove={() => remove(i)}>
            <div className="grid gap-4 sm:grid-cols-[1fr_12rem]">
              <NearbyPlaceSelect index={i} options={options} />
              <TextField name={`nearby.${i}.distanceKm`} label={t('Distance (km)', 'المسافة (كم)')} required dir="ltr" inputMode="decimal" placeholder="3.5" />
            </div>
          </RepeatItem>
        ))}
        <AddButton onClick={() => append({ placeId: '', nameAr: '', nameEn: '', villageId: '', distanceKm: '' })}>{t('Add nearby place', 'إضافة مكان مجاور')}</AddButton>
      </div>
    </div>
  )
}

export function PopulationStep() {
  const { t, pick } = useI18n()
  const { control, register } = useFormContext<VillageFormValues>()
  const { sources } = useData()
  const { fields, append, remove } = useFieldArray({ control, name: 'population' })
  const err = useFieldError()
  return (
    <div className="space-y-6">
      <StepIntro title={t('Population records', 'السجلات السكانية')} description={t('Add one row per year. Mark projections as estimates so readers can tell them apart.', 'أضف سطرًا لكل سنة، وصنّف الإسقاطات كتقديرات ليميّزها القرّاء.')} />
      {fields.length === 0 && <p className="rounded-2xl border border-dashed border-stone-line p-6 text-center text-sm text-muted">{t('No population records yet.', 'لا توجد سجلات سكانية بعد.')}</p>}
      <div className="space-y-3">
        {fields.map((f, i) => (
          <div key={f.id} className="grid animate-scale-in items-start gap-3 rounded-2xl border border-stone-line bg-beige/40 p-4 sm:grid-cols-[6rem_8rem_9rem_1fr_auto]">
            <TextField name={`population.${i}.year`} label={t('Year', 'السنة')} dir="ltr" inputMode="numeric" required />
            <TextField name={`population.${i}.population`} label={t('Population', 'السكان')} dir="ltr" inputMode="numeric" required />
            <Field label={t('Type', 'النوع')}>
              {(id) => (
                <Select id={id} {...register(`population.${i}.kind`)}>
                  {(['census', 'estimate', 'survey'] as const).map((k) => (
                    <option key={k} value={k}>
                      {pick(populationKindLabels[k])}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label={t('Source', 'المصدر')} required error={err(`population.${i}.sourceId`)}>
              {(id, d) => (
                <Select id={id} aria-describedby={d} invalid={!!err(`population.${i}.sourceId`)} {...register(`population.${i}.sourceId`)}>
                  <option value="">{t('Select…', 'اختر…')}</option>
                  {sources.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title.length > 60 ? `${s.title.slice(0, 60)}…` : s.title}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <button type="button" onClick={() => remove(i)} className="mt-7 rounded-lg p-2 text-muted hover:bg-accent-50 hover:text-accent-dark" aria-label={t('Remove row', 'إزالة السطر')}>
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
      </div>
      <AddButton onClick={() => append({ id: uid('pop'), year: '', population: '', kind: 'census', sourceId: '' })}>{t('Add population record', 'إضافة سجل سكاني')}</AddButton>
    </div>
  )
}

export function HistoryStep() {
  const { t } = useI18n()
  const { control } = useFormContext<VillageFormValues>()
  const { fields, append, remove } = useFieldArray({ control, name: 'events' })
  return (
    <div className="space-y-6">
      <StepIntro title={t('Historical background', 'الخلفية التاريخية')} description={t('An overview, the origin of the name, and key events for the timeline.', 'لمحة عامة وأصل التسمية وأهم الأحداث للخط الزمني.')} />
      <BilingualField label={t('Historical overview', 'لمحة تاريخية')} ar="historyAr" en="historyEn" multiline rows={5} />
      <BilingualField label={t('Origin of the name', 'أصل التسمية')} ar="nameOriginAr" en="nameOriginEn" multiline rows={2} />
      <div className="space-y-3">
        <p className="text-sm font-medium text-ink">{t('Important events', 'أحداث مهمة')}</p>
        {fields.map((f, i) => (
          <RepeatItem key={f.id} index={i} title={t('Event', 'حدث')} onRemove={() => remove(i)}>
            <div className="max-w-xs">
              <TextField name={`events.${i}.year`} label={t('Year or period', 'السنة أو الحقبة')} required dir="ltr" placeholder="1596" />
            </div>
            <BilingualField label={t('Title', 'العنوان')} ar={`events.${i}.titleAr`} en={`events.${i}.titleEn`} required />
            <BilingualField label={t('Description', 'الوصف')} ar={`events.${i}.descAr`} en={`events.${i}.descEn`} multiline rows={2} />
          </RepeatItem>
        ))}
        <AddButton onClick={() => append({ id: uid('ev'), year: '', titleAr: '', titleEn: '', descAr: '', descEn: '' })}>{t('Add event', 'إضافة حدث')}</AddButton>
      </div>
    </div>
  )
}

function LandmarkImage({ index }: { index: number }) {
  const { t } = useI18n()
  const { setValue } = useFormContext<VillageFormValues>()
  const image = useWatch<VillageFormValues, `heritage.${number}.image`>({ name: `heritage.${index}.image` })
  return (
    <ImageDrop
      label={t('Image', 'الصورة')}
      hint={t('One photo of this landmark.', 'صورة واحدة لهذا المعلم.')}
      value={image}
      onChange={(v) => setValue(`heritage.${index}.image`, v, { shouldDirty: true })}
      maxSize={900}
      aspect="aspect-[4/3]"
      className="max-w-md"
    />
  )
}

export function HeritageStep() {
  const { t, pick } = useI18n()
  const { control, register } = useFormContext<VillageFormValues>()
  const { fields, append, remove } = useFieldArray({ control, name: 'heritage' })
  return (
    <div className="space-y-6">
      <StepIntro title={t('Heritage & landmarks', 'التراث والمعالم')} description={t('Historic buildings, religious sites, natural heritage and cultural practices.', 'المباني التاريخية والمواقع الدينية والتراث الطبيعي والممارسات الثقافية.')} />
      <div className="space-y-3">
        {fields.map((f, i) => (
          <RepeatItem key={f.id} index={i} title={t('Landmark', 'معلم')} onRemove={() => remove(i)}>
            <div className="max-w-xs">
              <Field label={t('Type', 'النوع')}>
                {(id) => (
                  <Select id={id} {...register(`heritage.${i}.kind`)}>
                    {(Object.keys(heritageKindLabels) as (keyof typeof heritageKindLabels)[]).map((k) => (
                      <option key={k} value={k}>
                        {pick(heritageKindLabels[k])}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
            </div>
            <BilingualField label={t('Name', 'الاسم')} ar={`heritage.${i}.nameAr`} en={`heritage.${i}.nameEn`} required />
            <BilingualField label={t('Description', 'الوصف')} ar={`heritage.${i}.descAr`} en={`heritage.${i}.descEn`} multiline rows={2} />
            <LandmarkImage index={i} />
          </RepeatItem>
        ))}
        <AddButton onClick={() => append({ id: uid('her'), kind: 'architecture', nameAr: '', nameEn: '', descAr: '', descEn: '', image: '' })}>{t('Add landmark', 'إضافة معلم')}</AddButton>
      </div>
    </div>
  )
}

export function AgricultureStep() {
  const { t } = useI18n()
  const { control } = useFormContext<VillageFormValues>()
  const { fields, append, remove } = useFieldArray({ control, name: 'crops' })
  return (
    <div className="space-y-6">
      <StepIntro title={t('Agriculture & economy', 'الزراعة والاقتصاد')} description={t('What grows here, how the land is worked and how people make a living.', 'ما يُزرع هنا، وكيف تُفلح الأرض، وكيف يكسب الناس عيشهم.')} />
      <div className="space-y-3">
        <p className="text-sm font-medium text-ink">{t('Major crops', 'المحاصيل الرئيسية')}</p>
        {fields.map((f, i) => (
          <RepeatItem key={f.id} index={i} title={t('Crop', 'محصول')} onRemove={() => remove(i)}>
            <BilingualField label={t('Name', 'الاسم')} ar={`crops.${i}.ar`} en={`crops.${i}.en`} required />
            <BilingualField label={t('Agricultural practices', 'الممارسات الزراعية')} ar={`crops.${i}.practicesAr`} en={`crops.${i}.practicesEn`} multiline rows={2} hint={t('How this crop is grown: irrigation, terraces, seasons…', 'كيف يُزرع هذا المحصول: الري، المدرّجات، المواسم…')} />
          </RepeatItem>
        ))}
        <AddButton onClick={() => append({ ar: '', en: '', practicesAr: '', practicesEn: '' })}>{t('Add crop', 'إضافة محصول')}</AddButton>
      </div>
      <BilingualField label={t('Local economic activities', 'الأنشطة الاقتصادية المحلية')} ar="economyAr" en="economyEn" hint={t('Separate with commas.', 'افصل بينها بفواصل.')} />
    </div>
  )
}

export function FacilitiesStep() {
  const { t, pick } = useI18n()
  const { control, register } = useFormContext<VillageFormValues>()
  const { fields, append, remove } = useFieldArray({ control, name: 'facilities' })
  return (
    <div className="space-y-6">
      <StepIntro title={t('Public facilities', 'المرافق العامة')} description={t('Schools, clinics, libraries, community centres and other services.', 'المدارس والعيادات والمكتبات والمراكز المجتمعية وغيرها من الخدمات.')} />
      <div className="space-y-3">
        {fields.map((f, i) => (
          <RepeatItem key={f.id} index={i} title={t('Facility', 'مرفق')} onRemove={() => remove(i)}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('Type', 'النوع')}>
                {(id) => (
                  <Select id={id} {...register(`facilities.${i}.kind`)}>
                    {(Object.keys(facilityKindLabels) as (keyof typeof facilityKindLabels)[]).map((k) => (
                      <option key={k} value={k}>
                        {pick(facilityKindLabels[k])}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
              <TextField name={`facilities.${i}.count`} label={t('Count (optional)', 'العدد (اختياري)')} dir="ltr" inputMode="numeric" />
            </div>
            <BilingualField label={t('Name', 'الاسم')} ar={`facilities.${i}.nameAr`} en={`facilities.${i}.nameEn`} required />
          </RepeatItem>
        ))}
        <AddButton onClick={() => append({ id: uid('fac'), kind: 'school', nameAr: '', nameEn: '', count: '' })}>{t('Add facility', 'إضافة مرفق')}</AddButton>
      </div>
    </div>
  )
}

export function SourcesStep() {
  const { t, pick, formatDate } = useI18n()
  const { setValue } = useFormContext<VillageFormValues>()
  const selected = useWatch<VillageFormValues, 'sourceIds'>({ name: 'sourceIds' })
  const { sources } = useData()
  const [q, setQ] = useState('')
  const err = useFieldError()('sourceIds')
  const list = sources.filter((s) => !q || `${s.title} ${s.author ?? ''} ${s.organization ?? ''}`.toLowerCase().includes(q.toLowerCase()))

  const toggle = (id: string) => {
    const next = selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]
    setValue('sourceIds', next, { shouldValidate: true, shouldDirty: true })
  }

  return (
    <div className="space-y-6">
      <StepIntro title={t('Sources & references', 'المصادر والمراجع')} description={t('Link the works this profile relies on. At least one source is required to submit.', 'اربط المراجع التي يعتمد عليها هذا الملف. يلزم مصدر واحد على الأقل للإرسال.')} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SearchBar value={q} onChange={setQ} placeholder={t('Search sources…', 'ابحث في المصادر…')} className="w-full sm:w-72" />
        <Badge tone={selected.length ? 'olive' : 'neutral'}>{t(`${selected.length} selected`, `${selected.length} محدد`)}</Badge>
      </div>
      {err && (
        <p role="alert" className="rounded-xl bg-accent-50 px-4 py-2.5 text-sm font-medium text-accent-dark">
          {err}
        </p>
      )}
      <ul className="scrollbar-thin max-h-[26rem] space-y-2 overflow-y-auto pe-1">
        {list.map((s) => {
          const on = selected.includes(s.id)
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => toggle(s.id)}
                aria-pressed={on}
                className={cn('flex w-full items-start gap-3 rounded-2xl border p-4 text-start transition', on ? 'border-olive-300 bg-olive-50' : 'border-stone-line bg-white hover:border-olive-200')}
              >
                <span className={cn('mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border', on ? 'border-olive bg-olive text-white' : 'border-stone-line bg-white')}>{on && <Check className="size-3.5" />}</span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-ink" dir="auto">
                    {s.title}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted">
                    {pick(sourceTypeLabels[s.type])} · {s.author ?? s.organization ?? s.reference} · {formatDate(s.publishedAt, { year: 'numeric' })}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
