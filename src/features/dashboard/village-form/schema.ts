import { z } from 'zod'
import type { FacilityKind, HeritageKind, PopulationKind, PopulationRecord, RecordStatus, SceneKind, Village } from '@/types'
import { placeIdOf } from '@/data/places'
import { slugify, uid } from '@/utils/misc'

type T = (en: string, ar: string) => string

const intString = (t: T, opts: { required?: boolean; min?: number; max?: number } = {}) =>
  z
    .string()
    .trim()
    .refine((v) => (opts.required ? v !== '' : true), t('Required', 'حقل مطلوب'))
    .refine((v) => v === '' || /^-?\d+$/.test(v), t('Enter a whole number', 'أدخل رقمًا صحيحًا'))
    .refine((v) => v === '' || opts.min === undefined || Number(v) >= opts.min, t(`Must be at least ${opts.min}`, `يجب ألا يقل عن ${opts.min}`))
    .refine((v) => v === '' || opts.max === undefined || Number(v) <= opts.max, t(`Must be at most ${opts.max}`, `يجب ألا يزيد عن ${opts.max}`))

const decimalInRange = (t: T, min: number, max: number, label: { en: string; ar: string }) =>
  z
    .string()
    .trim()
    .min(1, t(`${label.en} is required`, `${label.ar} مطلوب`))
    .refine((v) => !Number.isNaN(Number(v)), t('Enter a number', 'أدخل رقمًا'))
    .refine((v) => Number(v) >= min && Number(v) <= max, t(`${label.en} must be between ${min} and ${max}`, `يجب أن يكون ${label.ar} بين ${min} و${max}`))

export function buildVillageSchema(t: T) {
  const req = (en: string, ar: string, min = 1) => z.string().trim().min(min, t(en, ar))
  return z.object({
    // 1. Basic information
    nameAr: req('Arabic name is required', 'الاسم العربي مطلوب', 2),
    nameEn: req('English name is required', 'الاسم الإنجليزي مطلوب', 2),
    summaryAr: req('Write a short summary (20+ characters)', 'اكتب ملخصًا قصيرًا (20 حرفًا على الأقل)', 20),
    summaryEn: req('Write a short summary (20+ characters)', 'اكتب ملخصًا قصيرًا (20 حرفًا على الأقل)', 20),
    descriptionAr: z.string().trim(),
    descriptionEn: z.string().trim(),
    coverImage: z.string(),
    scene: z.enum(['terraces', 'grove', 'ruins', 'hilltop', 'valley', 'plain']),
    palette: z.number().int().min(0).max(5),
    featured: z.boolean(),
    // 2. Names
    altSpellings: z.array(z.object({ value: req('Spelling required', 'طريقة الكتابة مطلوبة') })),
    historicalNames: z.array(
      z.object({
        nameAr: req('Name required', 'الاسم مطلوب'),
        nameEn: req('Name required', 'الاسم مطلوب'),
        /** Date the name first appeared. */
        period: z.string().trim(),
      }),
    ),
    // 3. Administrative location
    governorateId: req('Select a governorate', 'اختر المحافظة'),
    adminAreaAr: z.string().trim(),
    adminAreaEn: z.string().trim(),
    status: z.enum(['draft', 'pending', 'published', 'archived']),
    // 4. Geography
    lat: decimalInRange(t, 31.2, 33.4, { en: 'Latitude', ar: 'خط العرض' }),
    lng: decimalInRange(t, 34.2, 35.7, { en: 'Longitude', ar: 'خط الطول' }),
    elevation: intString(t, { min: -430, max: 1100 }),
    area: intString(t, { min: 0 }),
    nearby: z.array(
      z.object({
        /** Key of the chosen place in the picker list (see `data/places`). */
        placeId: req('Select a place', 'اختر مكانًا'),
        nameAr: z.string(),
        nameEn: z.string(),
        villageId: z.string(),
        distanceKm: decimalInRange(t, 0, 200, { en: 'Distance', ar: 'المسافة' }),
      }),
    ),
    // 5. Population
    population: z.array(
      z.object({
        id: z.string(),
        year: intString(t, { required: true, min: 1500, max: 2035 }),
        population: intString(t, { required: true, min: 0 }),
        kind: z.enum(['census', 'estimate', 'survey']),
        sourceId: req('Select a source', 'اختر مصدرًا'),
      }),
    ),
    // 6. History
    historyAr: z.string().trim(),
    historyEn: z.string().trim(),
    nameOriginAr: z.string().trim(),
    nameOriginEn: z.string().trim(),
    events: z.array(z.object({ id: z.string(), year: req('Year required', 'السنة مطلوبة'), titleAr: req('Title required', 'العنوان مطلوب'), titleEn: req('Title required', 'العنوان مطلوب'), descAr: z.string(), descEn: z.string() })),
    // 7. Heritage
    heritage: z.array(
      z.object({
        id: z.string(),
        kind: z.enum(['religious', 'archaeological', 'architecture', 'natural', 'cultural']),
        nameAr: req('Name required', 'الاسم مطلوب'),
        nameEn: req('Name required', 'الاسم مطلوب'),
        descAr: z.string(),
        descEn: z.string(),
        image: z.string(),
      }),
    ),
    // 8. Agriculture
    crops: z.array(
      z.object({
        ar: req('Name required', 'الاسم مطلوب'),
        en: req('Name required', 'الاسم مطلوب'),
        practicesAr: z.string(),
        practicesEn: z.string(),
      }),
    ),
    economyAr: z.string(),
    economyEn: z.string(),
    // 9. Facilities
    facilities: z.array(z.object({ id: z.string(), kind: z.enum(['school', 'clinic', 'library', 'community', 'mosque', 'church', 'council', 'other']), nameAr: req('Name required', 'الاسم مطلوب'), nameEn: req('Name required', 'الاسم مطلوب'), count: intString(t, { min: 0 }) })),
    // 10. Sources
    sourceIds: z.array(z.string()).min(1, t('Link at least one source before submitting', 'اربط مصدرًا واحدًا على الأقل قبل الإرسال')),
  })
}

export type VillageFormValues = z.infer<ReturnType<typeof buildVillageSchema>>

/** Fields validated when leaving each step. */
export const stepFields: (keyof VillageFormValues)[][] = [
  ['nameAr', 'nameEn', 'summaryAr', 'summaryEn', 'descriptionAr', 'descriptionEn'],
  ['altSpellings', 'historicalNames'],
  ['governorateId', 'adminAreaAr', 'adminAreaEn', 'status'],
  ['lat', 'lng', 'elevation', 'area', 'nearby'],
  ['population'],
  ['historyAr', 'historyEn', 'nameOriginAr', 'nameOriginEn', 'events'],
  ['heritage'],
  ['crops', 'economyAr', 'economyEn'],
  ['facilities'],
  ['sourceIds'],
]

export const emptyValues = (): VillageFormValues => ({
  nameAr: '',
  nameEn: '',
  summaryAr: '',
  summaryEn: '',
  descriptionAr: '',
  descriptionEn: '',
  coverImage: '',
  scene: 'terraces',
  palette: 0,
  featured: false,
  altSpellings: [],
  historicalNames: [],
  governorateId: '',
  adminAreaAr: '',
  adminAreaEn: '',
  status: 'draft',
  lat: '',
  lng: '',
  elevation: '',
  area: '',
  nearby: [],
  population: [],
  historyAr: '',
  historyEn: '',
  nameOriginAr: '',
  nameOriginEn: '',
  events: [],
  heritage: [],
  crops: [],
  economyAr: '',
  economyEn: '',
  facilities: [],
  sourceIds: [],
})

const splitList = (s: string, sep = /[,،]/) =>
  s
    .split(sep)
    .map((x) => x.trim())
    .filter(Boolean)

/**
 * Crops for the form, each with its own practices. Records saved before
 * practices were per crop have one village-wide text: it is placed in the
 * first crop so nothing is lost and the editor can redistribute it.
 */
function cropsWithPractices(v: Village): VillageFormValues['crops'] {
  const legacy = v.agriculture.practices
  const anyPerCrop = v.agriculture.crops.some((c) => c.practices?.ar || c.practices?.en)
  return v.agriculture.crops.map((c, i) => {
    const p = c.practices ?? (!anyPerCrop && i === 0 ? legacy : undefined)
    return { ar: c.ar, en: c.en, practicesAr: p?.ar ?? '', practicesEn: p?.en ?? '' }
  })
}

export function valuesFromVillage(v: Village, records: PopulationRecord[], villages: Village[] = []): VillageFormValues {
  /** Older entries may name a profiled village without linking it; link them by English name. */
  const linkedId = (en: string) => villages.find((x) => x.name.en.toLowerCase() === en.toLowerCase())?.id
  return {
    nameAr: v.name.ar,
    nameEn: v.name.en,
    summaryAr: v.summary.ar,
    summaryEn: v.summary.en,
    descriptionAr: v.description.ar,
    descriptionEn: v.description.en,
    coverImage: v.coverImage ?? '',
    scene: v.art.scene,
    palette: v.art.palette,
    featured: Boolean(v.featured),
    altSpellings: v.altSpellings.map((value) => ({ value })),
    historicalNames: v.historicalNames.map((h) => ({ nameAr: h.name.ar, nameEn: h.name.en, period: h.period })),
    governorateId: v.governorateId,
    adminAreaAr: v.adminArea.ar,
    adminAreaEn: v.adminArea.en,
    status: v.status,
    lat: String(v.coordinates.lat),
    lng: String(v.coordinates.lng),
    elevation: v.elevationM !== undefined ? String(v.elevationM) : '',
    area: v.areaDunums !== undefined ? String(v.areaDunums) : '',
    nearby: v.nearby.map((n) => {
      const villageId = n.villageId ?? linkedId(n.name.en) ?? ''
      return { placeId: placeIdOf({ name: n.name, villageId }), nameAr: n.name.ar, nameEn: n.name.en, villageId, distanceKm: String(n.distanceKm) }
    }),
    population: records
      .filter((r) => r.villageId === v.id)
      .sort((a, b) => a.year - b.year)
      .map((r) => ({ id: r.id, year: String(r.year), population: String(r.population), kind: r.kind, sourceId: r.sourceId })),
    historyAr: v.history.overview.ar,
    historyEn: v.history.overview.en,
    nameOriginAr: v.history.nameOrigin.ar,
    nameOriginEn: v.history.nameOrigin.en,
    events: v.history.events.map((e) => ({ id: e.id, year: e.year, titleAr: e.title.ar, titleEn: e.title.en, descAr: e.description.ar, descEn: e.description.en })),
    heritage: v.heritage.map((h) => ({ id: h.id, kind: h.kind, nameAr: h.name.ar, nameEn: h.name.en, descAr: h.description.ar, descEn: h.description.en, image: h.image ?? '' })),
    crops: cropsWithPractices(v),
    economyAr: v.agriculture.economy.map((c) => c.ar).join('، '),
    economyEn: v.agriculture.economy.map((c) => c.en).join(', '),
    facilities: v.facilities.map((f) => ({ id: f.id, kind: f.kind, nameAr: f.name.ar, nameEn: f.name.en, count: f.count !== undefined ? String(f.count) : '' })),
    sourceIds: v.sourceIds,
  }
}

/** Zip two comma-separated lists into bilingual pairs. */
const pairLists = (ar: string, en: string) => {
  const a = splitList(ar)
  const e = splitList(en)
  return Array.from({ length: Math.max(a.length, e.length) }, (_, i) => ({ ar: a[i] ?? e[i] ?? '', en: e[i] ?? a[i] ?? '' }))
}

export function villageFromValues(values: VillageFormValues, existing: Village | undefined, userId: string, taken: string[]): { village: Village; population: PopulationRecord[] } {
  const now = new Date().toISOString()
  let id = existing?.id ?? (slugify(values.nameEn) || uid('village'))
  if (!existing) {
    let n = 2
    const base = id
    while (taken.includes(id)) id = `${base}-${n++}`
  }
  const village: Village = {
    id,
    name: { ar: values.nameAr, en: values.nameEn },
    altSpellings: values.altSpellings.map((s) => s.value.trim()).filter(Boolean),
    historicalNames: values.historicalNames.map((h) => ({ name: { ar: h.nameAr, en: h.nameEn }, period: h.period.trim() })),
    governorateId: values.governorateId,
    adminArea: { ar: values.adminAreaAr, en: values.adminAreaEn },
    summary: { ar: values.summaryAr, en: values.summaryEn },
    description: { ar: values.descriptionAr || values.summaryAr, en: values.descriptionEn || values.summaryEn },
    coordinates: { lat: Number(values.lat), lng: Number(values.lng) },
    elevationM: values.elevation ? Number(values.elevation) : undefined,
    areaDunums: values.area ? Number(values.area) : undefined,
    nearby: values.nearby.map((n) => ({ name: { ar: n.nameAr, en: n.nameEn }, distanceKm: Number(n.distanceKm), villageId: n.villageId || undefined })),
    history: {
      overview: { ar: values.historyAr, en: values.historyEn },
      nameOrigin: { ar: values.nameOriginAr, en: values.nameOriginEn },
      events: values.events.map((e) => ({ id: e.id, year: e.year, title: { ar: e.titleAr, en: e.titleEn }, description: { ar: e.descAr, en: e.descEn } })),
    },
    heritage: values.heritage.map((h) => ({
      id: h.id,
      kind: h.kind as HeritageKind,
      name: { ar: h.nameAr, en: h.nameEn },
      description: { ar: h.descAr, en: h.descEn },
      period: existing?.heritage.find((x) => x.id === h.id)?.period,
      image: h.image || undefined,
    })),
    culture: existing?.culture ?? [],
    agriculture: {
      crops: values.crops
        .map((c) => {
          const practices = { ar: c.practicesAr.trim(), en: c.practicesEn.trim() }
          return { ar: c.ar.trim(), en: c.en.trim(), practices: practices.ar || practices.en ? practices : undefined }
        })
        .filter((c) => c.ar || c.en),
      economy: pairLists(values.economyAr, values.economyEn),
    },
    facilities: values.facilities.map((f) => ({ id: f.id, kind: f.kind as FacilityKind, name: { ar: f.nameAr, en: f.nameEn }, count: f.count ? Number(f.count) : undefined })),
    sourceIds: values.sourceIds,
    coverImage: values.coverImage || undefined,
    art: { scene: values.scene as SceneKind, palette: values.palette },
    featured: values.featured,
    depopulated: existing?.depopulated,
    status: values.status as RecordStatus,
    verification: existing?.verification ?? 'unverified',
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    createdBy: existing?.createdBy ?? userId,
  }
  const population: PopulationRecord[] = values.population.map((p) => ({
    id: p.id,
    villageId: id,
    year: Number(p.year),
    population: Number(p.population),
    kind: p.kind as PopulationKind,
    sourceId: p.sourceId,
  }))
  return { village, population }
}
