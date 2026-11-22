/*
 * API shapes → UI types (src/types), and back.
 *
 * The UI was designed around one nested `Village` document; the API stores the same facts as separate
 * records (village row, names, population, events, landmarks, facilities, crops, economy, relations).
 * These functions translate between the two without inventing data: a field the API does not have is
 * empty, or derived from real data (the summary is the start of the description, the illustration is
 * picked deterministically from the id).
 *
 * Ids: villages, population records, sources and users keep the API's numeric id as a string ("3").
 * Records nested in a village get a prefix so their kind is clear: ev-12 (event), lm-2 (landmark),
 * fa-3 (facility), ea-2 (economic activity), vn-5 (village name), ap-1-4 (village 1, product 4).
 */
import { governorates as knownGovernorates } from '@/data/governorates'
import type {
  AuditAction,
  AuditLog,
  Bilingual,
  CulturalCategory,
  FacilityKind,
  Governorate,
  HeritageEntry,
  HeritageKind,
  PopulationKind,
  PopulationRecord,
  RecordStatus,
  Role,
  SceneKind,
  Source,
  SourceType,
  Submission,
  SubmissionKind,
  User,
  VerificationStatus,
  Village,
} from '@/types'
import { hashString } from '@/utils/misc'
import type {
  ApiAuditLog,
  ApiGovernorate,
  ApiPopulationRecord,
  ApiRelation,
  ApiRole,
  ApiSource,
  ApiUser,
  ApiVerification,
  ApiVerificationSummary,
  ApiVillage,
  ApiVillageProfile,
} from './types'

const bi = (ar: string | null | undefined, en: string | null | undefined): Bilingual => ({
  ar: ar ?? en ?? '',
  en: en ?? ar ?? '',
})
const num = (v: string | number | null | undefined): number | undefined =>
  v === null || v === undefined || v === '' || Number.isNaN(Number(v)) ? undefined : Number(v)

/** Trailing number of an id such as "ev-12" or "12"; undefined for an id made in the browser ("ev-x8k2"). */
export const serverId = (id: string): number | undefined => {
  const m = id.match(/^(?:[a-z]+-)?(\d+)$/)
  return m ? Number(m[1]) : undefined
}

// Governorates --------------------------------------------------------------------------------------

/**
 * The UI's governorate list (src/data/governorates.ts) carries slugs, regions and map centres; the API's
 * has numeric ids. They are matched by Arabic name. An API governorate the UI does not know gets a slug
 * of its own and a central map position.
 */
export interface GovernorateIndex {
  slugById: Map<number, string>
  idBySlug: Map<string, number>
  extra: Governorate[]
}

const arabicKey = (s: string) => s.replace(/[ً-ْـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/\s+/g, ' ').trim()

export function indexGovernorates(list: ApiGovernorate[]): GovernorateIndex {
  const slugById = new Map<number, string>()
  const idBySlug = new Map<string, number>()
  const extra: Governorate[] = []
  for (const g of [...list].sort((a, b) => a.id - b.id)) {
    const known = knownGovernorates.find((k) => arabicKey(k.name.ar) === arabicKey(g.name))
    const slug = known?.id ?? `gov-${g.id}`
    slugById.set(g.id, slug)
    if (!idBySlug.has(slug)) idBySlug.set(slug, g.id)
    if (!known && !extra.some((e) => e.id === slug)) {
      extra.push({ id: slug, name: bi(g.name, g.name_eng), region: 'west-bank', center: { lat: 31.9, lng: 35.2 } })
    }
  }
  return { slugById, idBySlug, extra }
}

// Review status ----------------------------------------------------------------------------------------

export function toVerification(v: ApiVerificationSummary | null | undefined): VerificationStatus {
  if (!v) return 'unverified'
  if (v.status === 'verified') return 'verified'
  if (v.status === 'rejected') return 'needs-review'
  return 'pending'
}

const toRecordStatus = (s: string | null): RecordStatus => (s === 'published' ? 'published' : 'draft')

// Kinds ----------------------------------------------------------------------------------------------

const LANDMARK_KINDS: [HeritageKind, string][] = [
  ['religious', 'religious_site'],
  ['archaeological', 'archaeological_site'],
  ['architecture', 'historic_building'],
  ['natural', 'natural_heritage'],
  ['cultural', 'cultural_site'],
]
export const heritageKindFromType = (type: string | null): HeritageKind =>
  LANDMARK_KINDS.find(([, t]) => t === type)?.[0] ?? 'cultural'
export const landmarkTypeFromKind = (kind: HeritageKind): string =>
  LANDMARK_KINDS.find(([k]) => k === kind)?.[1] ?? 'cultural_site'

const FACILITY_KINDS: FacilityKind[] = ['school', 'clinic', 'library', 'community', 'mosque', 'church', 'council', 'other']
export function facilityKindFromType(type: string | null): FacilityKind {
  if (!type) return 'other'
  if ((FACILITY_KINDS as string[]).includes(type)) return type as FacilityKind
  if (type.includes('clinic') || type.includes('health')) return 'clinic'
  if (type.includes('school')) return 'school'
  if (type.includes('community') || type.includes('centre') || type.includes('center')) return 'community'
  return 'other'
}

const POPULATION_KINDS: PopulationKind[] = ['census', 'estimate', 'survey']
const toPopulationKind = (t: string | null): PopulationKind =>
  (POPULATION_KINDS as (string | null)[]).includes(t) ? (t as PopulationKind) : 'estimate'

const SCENES: SceneKind[] = ['terraces', 'grove', 'ruins', 'hilltop', 'valley', 'plain']

/** Images that can be shown: absolute URLs and data URLs. Server paths of the seed (/uploads/…) have no file. */
const displayableImage = (url: string | null | undefined) =>
  url && /^(https?:|data:image\/)/.test(url) ? url : undefined

/** The first sentence or two of the description, used where the UI shows a short summary. */
function summaryOf(text: string): string {
  const t = text.trim()
  if (t.length <= 220) return t
  const cut = t.slice(0, 220)
  const end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('، '), cut.lastIndexOf('؛ '))
  return `${end > 80 ? cut.slice(0, end + 1) : cut.trimEnd()}…`
}

// Villages ---------------------------------------------------------------------------------------------

/**
 * One village with every section, from its profile (and its nearby villages, which live in the geography
 * module).
 */
export function villageFromProfile(profile: ApiVillageProfile, relations: ApiRelation[], gov: GovernorateIndex): Village {
  const v = profile.village
  const id = String(v.id)
  const description = bi(v.arabic_description, v.eng_description)
  const names = v.names ?? []
  const sourceIds = new Set<string>()
  const cite = (sourceId: number | null) => sourceId !== null && sourceIds.add(String(sourceId))
  for (const list of [
    profile.population.data,
    profile.historicalEvents.data,
    profile.landmarks.data,
    profile.facilities.data,
    profile.economicActivities.data,
    profile.agriculturalProducts.data,
    profile.culturalPractices.data,
  ]) {
    for (const item of list as { sourceId: number | null }[]) cite(item.sourceId)
  }
  names.forEach((n) => cite(n.source_id))

  const hash = hashString(id)
  return {
    id,
    name: bi(v.current_name, v.english_name),
    // Spellings and transliterations of today's name, then the names the village had before.
    altSpellings: names
      .filter((n) => (n.name_type === 'alternative' || n.name_type === 'transliteration') && n.eng_name)
      .map((n) => n.eng_name as string),
    historicalNames: names
      .filter((n) => n.name_type === 'historical' || n.name_type === 'former')
      .map((n) => ({ name: bi(n.ar_name, n.eng_name), period: '' })),
    governorateId: (v.governorate_id !== null && gov.slugById.get(v.governorate_id)) || '',
    adminArea: bi(v.administrative_area, v.administrative_area),
    summary: { ar: summaryOf(description.ar), en: summaryOf(description.en) },
    description,
    coordinates: { lat: num(v.latitude) ?? 0, lng: num(v.longitude) ?? 0 },
    elevationM: num(v.elevation_meters),
    areaDunums: num(v.land_area_dunums),
    // A link can be stored in either direction, so the other village is `nearbyVillage`, never
    // `relatedVillageId` (which is this village for a link stored the other way). A pair may have several
    // links (sources that disagree on the distance, ADR-0008): one chip per village.
    nearby: relations
      .filter((r, i) => relations.findIndex((x) => x.nearbyVillage.id === r.nearbyVillage.id) === i)
      .map((r) => ({
        name: bi(r.nearbyVillage.currentName, r.nearbyVillage.englishName),
        distanceKm: r.distanceKm ?? 0,
        villageId: String(r.nearbyVillage.id),
      })),
    history: {
      overview: bi(v.historical_overview_ar, v.historical_overview_eng),
      nameOrigin: bi(v.name_origin_ar, v.name_origin_eng),
      events: profile.historicalEvents.data.map((e) => ({
        id: `ev-${e.id}`,
        year: e.eventDate ? e.eventDate.slice(0, 4) : '',
        title: bi(e.titleAr, e.titleEng),
        description: bi(e.descriptionAr, e.descriptionEng),
      })),
    },
    heritage: profile.landmarks.data.map((l) => ({
      id: `lm-${l.id}`,
      kind: heritageKindFromType(l.type),
      name: bi(l.nameAr, l.nameEng),
      description: bi(l.descriptionAr, l.descriptionEng),
      image: displayableImage(l.imageUrl),
    })),
    culture: profile.culturalPractices.data.map((c) => ({
      id: `cp-${c.id}`,
      category: c.category as CulturalCategory,
      title: bi(c.nameAr, c.nameEng),
      description: bi(c.descriptionAr, c.descriptionEng),
    })),
    agriculture: {
      crops: profile.agriculturalProducts.data.map((p) => {
        const practices = bi(p.descriptionAr, p.descriptionEng)
        return { ...bi(p.nameAr, p.nameEng), practices: practices.ar || practices.en ? practices : undefined }
      }),
      economy: profile.economicActivities.data.map((a) => bi(a.nameAr, a.nameEng)),
    },
    facilities: profile.facilities.data.map((f) => ({
      id: `fa-${f.id}`,
      kind: facilityKindFromType(f.type),
      name: bi(f.nameAr, f.nameEng),
      count: f.count ?? undefined,
    })),
    sourceIds: [...sourceIds],
    coverImage: displayableImage(v.image),
    coverCaption: v.alt_image ?? undefined,
    art: { scene: SCENES[hash % SCENES.length], palette: (hash >>> 8) % 6 },
    featured: ['1', 'yes', 'true'].includes(String(v.feature_to_homepage ?? '').toLowerCase()),
    status: toRecordStatus(v.record_status),
    verification: toVerification(profile.verification),
    createdAt: v.created_at,
    updatedAt: v.updated_at,
    createdBy: '',
  }
}

/** The body of `POST /villages` / `PATCH /villages/:id` for the fields stored on the village row. */
export function villageBody(v: Village, gov: GovernorateIndex) {
  const text = (s: string) => (s.trim() === '' ? null : s.trim())
  const lat = Number.isFinite(v.coordinates.lat) && v.coordinates.lat !== 0 ? v.coordinates.lat : null
  const lng = Number.isFinite(v.coordinates.lng) && v.coordinates.lng !== 0 ? v.coordinates.lng : null
  return {
    currentName: v.name.ar.trim() || v.name.en.trim(),
    englishName: text(v.name.en),
    arabicDescription: text(v.description.ar),
    engDescription: text(v.description.en),
    historicalOverviewAr: text(v.history.overview.ar),
    historicalOverviewEng: text(v.history.overview.en),
    nameOriginAr: text(v.history.nameOrigin.ar),
    nameOriginEng: text(v.history.nameOrigin.en),
    latitude: lat,
    longitude: lng,
    governorateId: gov.idBySlug.get(v.governorateId) ?? null,
    administrativeArea: text(v.adminArea.en || v.adminArea.ar),
    elevationMeters: v.elevationM ?? null,
    landAreaDunums: v.areaDunums ?? null,
    // Only an image URL the user gave is sent. The stored image may be a server path the browser cannot
    // show (the form then has none); leaving the field out keeps it instead of erasing it.
    image: v.coverImage && /^https?:\/\//.test(v.coverImage) ? v.coverImage : undefined,
  }
}

// Population ---------------------------------------------------------------------------------------------

export const populationFromApi = (r: ApiPopulationRecord): PopulationRecord => ({
  id: String(r.id),
  villageId: String(r.villageId),
  year: r.referenceYear,
  population: r.population,
  kind: toPopulationKind(r.typeOfFigure),
  sourceId: r.sourceId === null ? '' : String(r.sourceId),
  note: r.notes ?? undefined,
})

export const populationBody = (r: PopulationRecord) => ({
  referenceYear: r.year,
  population: r.population,
  typeOfFigure: r.kind,
  sourceId: Number(r.sourceId),
  notes: r.note?.trim() || undefined,
})

// Sources ------------------------------------------------------------------------------------------------

const SOURCE_TYPES: SourceType[] = ['book', 'article', 'archive', 'census', 'website', 'oral-history', 'map']

export function sourceFromApi(s: ApiSource, villageIds: string[]): Source {
  const note = s.notes && (s.notes.ar || s.notes.en) ? bi(s.notes.ar, s.notes.en) : undefined
  return {
    id: String(s.id),
    title: s.title,
    type: (SOURCE_TYPES as string[]).includes(s.type) ? (s.type as SourceType) : 'archive',
    author: s.author ?? undefined,
    organization: s.organization ?? undefined,
    reference: s.reference ?? '',
    url: s.url ?? undefined,
    publishedAt: s.publicationDate ?? '',
    villageIds,
    note,
  }
}

export const sourceBody = (s: Source) => ({
  title: s.title,
  type: s.type,
  author: s.author || undefined,
  organization: s.organization || undefined,
  reference: s.reference || undefined,
  url: s.url || undefined,
  publicationDate: s.publishedAt || undefined,
  notesAr: s.note?.ar || undefined,
  notesEn: s.note?.en || undefined,
})

// Users --------------------------------------------------------------------------------------------------

const ROLE_ORDER: Role[] = ['admin', 'editor', 'reviewer', 'contributor']
export const primaryRole = (roles: ApiRole[]): Role => ROLE_ORDER.find((r) => roles.includes(r)) ?? 'contributor'

export const userFromApi = (u: ApiUser): User => ({
  id: String(u.id),
  name: u.fullName,
  email: u.email,
  role: primaryRole(u.roles),
  active: u.enabled,
  createdAt: u.createdAt,
  lastActiveAt: u.createdAt,
})

// Reviews --------------------------------------------------------------------------------------------------

/** Where a reviewed record lives and how to describe it, from the data already loaded. */
export interface RecordLookup {
  villageOf: (entityType: string, entityId: number) => string | undefined
  labelOf: (entityType: string, entityId: number) => Bilingual | undefined
}

const SUBMISSION_KINDS: Record<string, SubmissionKind> = {
  village: 'edit',
  'population-record': 'population',
  source: 'source',
}

const ENTITY_LABELS: Record<string, Bilingual> = {
  village: { en: 'Village profile', ar: 'ملف القرية' },
  'village-name': { en: 'Village name', ar: 'اسم القرية' },
  'village-relation': { en: 'Nearby village', ar: 'قرية مجاورة' },
  'population-record': { en: 'Population figure', ar: 'رقم سكاني' },
  'historical-event': { en: 'Historical event', ar: 'حدث تاريخي' },
  landmark: { en: 'Landmark', ar: 'معلم' },
  'cultural-practice': { en: 'Cultural practice', ar: 'ممارسة ثقافية' },
  'agricultural-product': { en: 'Crop', ar: 'محصول' },
  'economic-activity': { en: 'Economic activity', ar: 'نشاط اقتصادي' },
  facility: { en: 'Facility', ar: 'مرفق' },
  source: { en: 'Source', ar: 'مصدر' },
}

/**
 * A review entry of the API as the review queue of the UI shows it. The API keeps one entry per record
 * (pending, verified or rejected), so "approve" is verify and "reject" or "request changes" is reject
 * with a reason.
 */
export function submissionFromVerification(v: ApiVerification, lookup: RecordLookup): Submission {
  const kind = ENTITY_LABELS[v.entityType] ?? { en: v.entityType, ar: v.entityType }
  const label = lookup.labelOf(v.entityType, v.entityId)
  const status = v.status === 'verified' ? 'approved' : v.status === 'rejected' ? 'rejected' : 'pending'
  const history: Submission['history'] = [{ at: '', by: '', action: 'submitted' }]
  if (v.status !== 'pending') {
    history.push({ at: v.verifiedAt ?? '', by: v.verifiedBy === null ? '' : String(v.verifiedBy), action: status, note: v.notes ?? undefined })
  }
  return {
    id: String(v.id),
    villageId: lookup.villageOf(v.entityType, v.entityId) ?? '',
    kind: SUBMISSION_KINDS[v.entityType] ?? 'heritage',
    submittedBy: '',
    submittedAt: v.verifiedAt ?? '',
    status,
    summary: {
      en: label ? `${kind.en}: ${label.en}` : `${kind.en} #${v.entityId}`,
      ar: label ? `${kind.ar}: ${label.ar}` : `${kind.ar} #${v.entityId}`,
    },
    changes: [],
    history,
  }
}

// Audit log ------------------------------------------------------------------------------------------------

const AUDIT_ENTITIES: Record<string, AuditLog['entityType']> = {
  village: 'village',
  'population-record': 'population',
  source: 'source',
  user: 'user',
  verification: 'review',
}

const AUDIT_ACTIONS: Record<string, AuditAction> = {
  create: 'create',
  update: 'update',
  delete: 'delete',
  verify: 'approve',
  reject: 'reject',
}

export function auditFromApi(a: ApiAuditLog, lookup: RecordLookup): AuditLog {
  const label = lookup.labelOf(a.entityType, a.entityId)
  const fields = a.changedFields?.length ? a.changedFields.join(', ') : ''
  return {
    id: String(a.id),
    userId: a.userId === null ? '' : String(a.userId),
    action: AUDIT_ACTIONS[a.action] ?? 'update',
    entityType: AUDIT_ENTITIES[a.entityType] ?? 'heritage',
    entityLabel: label?.en ? `${label.en}` : `${a.entityType} #${a.entityId}`,
    at: a.createdAt,
    details: fields ? `${a.action}: ${fields}` : a.action,
    ip: '—',
  }
}

// History & heritage entries ----------------------------------------------------------------------------------

/**
 * The dashboard's "History & heritage" page edits content blocks by section. They come from the village
 * records: the historical overview, the alternative names, landmarks, cultural practices, crops and facilities.
 */
export function heritageEntriesOf(village: Village, profile: ApiVillageProfile): HeritageEntry[] {
  const at = village.updatedAt
  const entries: HeritageEntry[] = []
  const overview = village.history.overview
  if (overview.ar || overview.en) {
    entries.push({ id: `bg-${village.id}`, section: 'background', villageId: village.id, title: { en: 'Historical overview', ar: 'نبذة تاريخية' }, body: overview, updatedAt: at })
  }
  for (const n of profile.village.names ?? []) {
    if (n.name_type === 'current') continue
    entries.push({ id: `vn-${n.id}`, section: 'names', villageId: village.id, title: bi(n.ar_name, n.eng_name), body: bi(n.meaning, n.meaning), category: n.name_type ?? undefined, updatedAt: at })
  }
  for (const l of profile.landmarks.data) {
    entries.push({ id: `lm-${l.id}`, section: 'landmarks', villageId: village.id, title: bi(l.nameAr, l.nameEng), body: bi(l.descriptionAr, l.descriptionEng), category: heritageKindFromType(l.type), updatedAt: at })
  }
  for (const c of profile.culturalPractices.data) {
    entries.push({ id: `cp-${c.id}`, section: 'culture', villageId: village.id, title: bi(c.nameAr, c.nameEng), body: bi(c.descriptionAr, c.descriptionEng), category: c.category, updatedAt: at })
  }
  for (const p of profile.agriculturalProducts.data) {
    entries.push({ id: `ap-${village.id}-${p.productId}`, section: 'agriculture', villageId: village.id, title: bi(p.nameAr, p.nameEng), body: bi(p.descriptionAr, p.descriptionEng), updatedAt: at })
  }
  for (const f of profile.facilities.data) {
    entries.push({ id: `fa-${f.id}`, section: 'facilities', villageId: village.id, title: bi(f.nameAr, f.nameEng), body: { ar: '', en: '' }, category: facilityKindFromType(f.type), updatedAt: at })
  }
  return entries
}

export type { ApiVillage }
