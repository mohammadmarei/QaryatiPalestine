/*
 * Firestore documents ⇄ the UI types of src/types.
 *
 * A village is one document holding every section (names, population, events, landmarks, culture, crops,
 * economy, facilities, nearby villages), so a village page is one read. The UI's `Village` is stored almost
 * as it is; the document adds the population series and the fields the security rules need
 * (`lastAuditId`, `lastSubmissionId`, see firestore.rules). Nothing is invented: an empty field stays empty.
 */
import type {
  AuditAction,
  AuditLog,
  Bilingual,
  HeritageEntry,
  PopulationKind,
  PopulationRecord,
  ReviewHistoryEntry,
  ReviewStatus,
  Source,
  Submission,
  SubmissionKind,
  User,
  Village,
} from '@/types'

/** One figure of the population series, stored inside its village. */
export interface PopulationItem {
  id: string
  year: number
  population: number
  kind: PopulationKind
  sourceId: string
  note?: string
}

export interface VillageDoc extends Omit<Village, 'id'> {
  population: PopulationItem[]
  reviewHistory?: ReviewHistoryEntry[]
  lastAuditId: string
  lastSubmissionId?: string
  updatedBy?: string
}

export interface SourceDoc extends Omit<Source, 'id'> {
  lastAuditId: string
  lastSubmissionId?: string
  updatedAt?: string
}

export interface UserDoc {
  name: string
  email: string
  role: User['role']
  active: boolean
  createdAt: string
  lastActiveAt: string
  organization?: string
  lastAuditId?: string
}

/** What a contributor proposes: the whole record as it should be after the change. */
export type SubmissionPayload = { village: VillageDoc } | { source: SourceDoc }

export interface SubmissionDoc {
  /** `villages/<id>` or `sources/<id>`: the record the submission is about. */
  target: string
  villageId: string
  kind: SubmissionKind
  submittedBy: string
  submittedByName: string
  submittedAt: string
  status: ReviewStatus
  summary: Bilingual
  changes: Submission['changes']
  history: ReviewHistoryEntry[]
  /** null for the review entry of a direct edit by an editor: the change is already applied. */
  payload: SubmissionPayload | null
  reviewedBy?: string
  reviewedAt?: string
  lastAuditId?: string
}

export interface AuditDoc {
  userId: string
  userName: string
  action: AuditAction
  entityType: AuditLog['entityType']
  entityLabel: string
  /** `villages/<id>`, `sources/<id>` or `users/<uid>`; firestore.rules matches it to the changed record. */
  target: string
  submissionId?: string
  /** ISO time for display; `createdAt` is the server time the rules check. */
  at: string
  details: string
  ip: string
}

// Villages --------------------------------------------------------------------------------------------

const EMPTY_BI: Bilingual = { ar: '', en: '' }

/** The UI village of a document, with safe defaults for documents written by hand in the console. */
export function villageFromDoc(id: string, d: Partial<VillageDoc>): Village {
  return {
    id,
    name: d.name ?? EMPTY_BI,
    altSpellings: d.altSpellings ?? [],
    historicalNames: d.historicalNames ?? [],
    governorateId: d.governorateId ?? '',
    adminArea: d.adminArea ?? EMPTY_BI,
    summary: d.summary ?? EMPTY_BI,
    description: d.description ?? EMPTY_BI,
    coordinates: d.coordinates ?? { lat: 0, lng: 0 },
    elevationM: d.elevationM,
    areaDunums: d.areaDunums,
    nearby: d.nearby ?? [],
    history: {
      overview: d.history?.overview ?? EMPTY_BI,
      nameOrigin: d.history?.nameOrigin ?? EMPTY_BI,
      events: d.history?.events ?? [],
    },
    heritage: d.heritage ?? [],
    culture: d.culture ?? [],
    agriculture: { crops: d.agriculture?.crops ?? [], practices: d.agriculture?.practices, economy: d.agriculture?.economy ?? [] },
    facilities: d.facilities ?? [],
    sourceIds: d.sourceIds ?? [],
    coverImage: d.coverImage,
    coverCaption: d.coverCaption,
    art: d.art ?? { scene: 'terraces', palette: 0 },
    featured: d.featured,
    depopulated: d.depopulated,
    status: d.status ?? 'draft',
    verification: d.verification ?? 'unverified',
    createdAt: d.createdAt ?? '',
    updatedAt: d.updatedAt ?? '',
    createdBy: d.createdBy ?? '',
  }
}

export const populationOf = (villageId: string, d: Partial<VillageDoc>): PopulationRecord[] =>
  (d.population ?? []).map((p) => ({ ...p, villageId }))

const sameText = (a: Bilingual, b: Bilingual) => (a.ar.trim() || a.en.trim()) === (b.ar.trim() || b.en.trim())

/**
 * The form rebuilds every item from its fields, so the source of each item would be lost on save. It is
 * carried over from the stored version: by id for items that have one, by name for the others.
 */
function keepSources(next: Village, prev: Partial<VillageDoc> | undefined): Village {
  if (!prev) return next
  const byId = <T extends { id: string; sourceId?: string }>(items: T[], old: T[] | undefined) =>
    items.map((i) => (i.sourceId ? i : { ...i, sourceId: old?.find((o) => o.id === i.id)?.sourceId }))
  const byName = <T extends Bilingual & { sourceId?: string }>(items: T[], old: T[] | undefined) =>
    items.map((i) => (i.sourceId ? i : { ...i, ...pickKept(old?.find((o) => sameText(o, i))) }))
  const pickKept = (o: (Bilingual & { sourceId?: string; productId?: string }) | undefined) =>
    o ? { sourceId: o.sourceId, ...(o.productId ? { productId: o.productId } : {}) } : {}
  return {
    ...next,
    historicalNames: next.historicalNames.map((n) => {
      const old = prev.historicalNames?.find((o) => sameText(o.name, n.name))
      return old ? { ...old, ...n, sourceId: n.sourceId ?? old.sourceId } : n
    }),
    nearby: next.nearby.map((n) => {
      const old = prev.nearby?.find((o) => (o.villageId && o.villageId === n.villageId) || sameText(o.name, n.name))
      return old ? { ...old, ...n, sourceId: n.sourceId ?? old.sourceId } : n
    }),
    history: {
      ...next.history,
      events: byId(next.history.events, prev.history?.events).map((e) => {
        const old = prev.history?.events.find((o) => o.id === e.id)
        // A stored full day stays while the year is unchanged.
        return old?.date && old.year === e.year ? { ...e, date: old.date } : e
      }),
    },
    heritage: byId(next.heritage, prev.heritage),
    culture: byId(next.culture, prev.culture),
    facilities: byId(next.facilities, prev.facilities),
    agriculture: {
      ...next.agriculture,
      crops: byName(next.agriculture.crops, prev.agriculture?.crops),
      economy: byName(next.agriculture.economy, prev.agriculture?.economy),
    },
  }
}

/** Every source the village's items cite, plus the ones picked in the form. */
function citedSources(v: Village, population: PopulationItem[]): string[] {
  const ids = new Set(v.sourceIds)
  const add = (id?: string) => id && ids.add(id)
  population.forEach((p) => add(p.sourceId))
  v.historicalNames.forEach((n) => add(n.sourceId))
  v.nearby.forEach((n) => add(n.sourceId))
  v.history.events.forEach((e) => add(e.sourceId))
  v.heritage.forEach((h) => add(h.sourceId))
  v.culture.forEach((c) => add(c.sourceId))
  v.facilities.forEach((f) => add(f.sourceId))
  v.agriculture.crops.forEach((c) => add(c.sourceId))
  v.agriculture.economy.forEach((e) => add(e.sourceId))
  return [...ids]
}

/** The document to store for `v` (without the rule fields, which the write adds). */
export function villageDocOf(v: Village, population: PopulationRecord[], prev: Partial<VillageDoc> | undefined): Omit<VillageDoc, 'lastAuditId'> {
  const kept = keepSources(v, prev)
  const items: PopulationItem[] = population.map((p) => ({ id: p.id, year: p.year, population: p.population, kind: p.kind, sourceId: p.sourceId, note: p.note }))
  const lat = Number.isFinite(kept.coordinates.lat) ? kept.coordinates.lat : 0
  const lng = Number.isFinite(kept.coordinates.lng) ? kept.coordinates.lng : 0
  const { id: _id, ...rest } = kept
  void _id
  return {
    ...rest,
    coordinates: { lat, lng },
    sourceIds: citedSources(kept, items),
    population: items,
    reviewHistory: prev?.reviewHistory ?? [],
  }
}

// Sources ------------------------------------------------------------------------------------------------

export function sourceFromDoc(id: string, d: Partial<SourceDoc>, citedBy: string[]): Source {
  return {
    id,
    title: d.title ?? '',
    type: d.type ?? 'archive',
    author: d.author,
    organization: d.organization,
    reference: d.reference ?? '',
    url: d.url,
    publishedAt: d.publishedAt ?? '',
    villageIds: [...new Set([...(d.villageIds ?? []), ...citedBy])],
    note: d.note,
    accessedAt: d.accessedAt,
    verification: d.verification ?? 'unverified',
  }
}

export function sourceDocOf(s: Source): Omit<SourceDoc, 'lastAuditId'> {
  const { id: _id, ...rest } = s
  void _id
  return { ...rest, verification: 'pending', updatedAt: new Date().toISOString() }
}

// Reviews and audit ----------------------------------------------------------------------------------------

export const submissionFromDoc = (id: string, d: SubmissionDoc): Submission => ({
  id,
  villageId: d.villageId,
  kind: d.kind,
  submittedBy: d.submittedBy,
  submittedAt: d.submittedAt,
  status: d.status,
  summary: d.summary,
  changes: d.changes ?? [],
  history: d.history ?? [],
})

export const auditFromDoc = (id: string, d: AuditDoc): AuditLog => ({
  id,
  userId: d.userId,
  action: d.action,
  entityType: d.entityType,
  entityLabel: d.entityLabel,
  at: d.at,
  details: d.details,
  ip: d.ip || '—',
})

export const userFromDoc = (id: string, d: Partial<UserDoc>): User => ({
  id,
  name: d.name || d.email || '—',
  email: d.email ?? '',
  role: d.role ?? 'contributor',
  active: d.active ?? false,
  createdAt: d.createdAt ?? '',
  lastActiveAt: d.lastActiveAt ?? d.createdAt ?? '',
  organization: d.organization,
})

/** Short, readable before/after lines for the review queue. */
export function describeChanges(prev: Partial<VillageDoc> | undefined, next: Omit<VillageDoc, 'lastAuditId'>): Submission['changes'] {
  const text = (b?: Bilingual) => (b ? b.ar || b.en : '')
  const count = (n?: number) => (n === undefined ? undefined : String(n))
  const fields: [string, string | undefined, string][] = [
    ['name', text(prev?.name), text(next.name)],
    ['status', prev?.status, next.status],
    ['governorate', prev?.governorateId, next.governorateId],
    ['coordinates', prev?.coordinates && `${prev.coordinates.lat}, ${prev.coordinates.lng}`, `${next.coordinates.lat}, ${next.coordinates.lng}`],
    ['description', text(prev?.description), text(next.description)],
    ['historical overview', text(prev?.history?.overview), text(next.history.overview)],
    ['population records', count(prev?.population?.length), String(next.population.length)],
    ['historical events', count(prev?.history?.events.length), String(next.history.events.length)],
    ['landmarks', count(prev?.heritage?.length), String(next.heritage.length)],
    ['cultural practices', count(prev?.culture?.length), String(next.culture.length)],
    ['facilities', count(prev?.facilities?.length), String(next.facilities.length)],
    ['crops', count(prev?.agriculture?.crops.length), String(next.agriculture.crops.length)],
    ['economy', count(prev?.agriculture?.economy.length), String(next.agriculture.economy.length)],
  ]
  const short = (s: string) => (s.length > 140 ? `${s.slice(0, 140)}…` : s)
  return fields
    .filter(([, before, after]) => (before ?? '') !== after)
    .map(([field, before, after]) => ({ field, before: before === undefined || before === '' ? undefined : short(before), after: short(after) }))
}

// History & heritage entries ----------------------------------------------------------------------------------

/**
 * The dashboard's "History & heritage" page edits content blocks by section; they are views of the village:
 * the historical overview, the earlier names, landmarks, cultural practices, crops and facilities. Names and
 * crops have no id of their own, so their entry id carries their position (`vn-<village>-<i>`).
 */
export function heritageEntriesOf(v: Village): HeritageEntry[] {
  const at = v.updatedAt
  const entries: HeritageEntry[] = []
  const overview = v.history.overview
  if (overview.ar || overview.en) {
    entries.push({ id: `bg-${v.id}`, section: 'background', villageId: v.id, title: { en: 'Historical overview', ar: 'نبذة تاريخية' }, body: overview, updatedAt: at })
  }
  v.historicalNames.forEach((n, i) => {
    entries.push({ id: `vn-${v.id}-${i}`, section: 'names', villageId: v.id, title: n.name, body: { ar: n.meaning ?? '', en: n.meaning ?? '' }, category: n.kind, period: n.period || undefined, updatedAt: at })
  })
  for (const h of v.heritage) {
    entries.push({ id: h.id, section: 'landmarks', villageId: v.id, title: h.name, body: h.description, category: h.kind, updatedAt: at })
  }
  for (const c of v.culture) {
    entries.push({ id: c.id, section: 'culture', villageId: v.id, title: c.title, body: c.description, category: c.category, updatedAt: at })
  }
  v.agriculture.crops.forEach((c, i) => {
    entries.push({ id: `ap-${v.id}-${i}`, section: 'agriculture', villageId: v.id, title: { ar: c.ar, en: c.en }, body: c.practices ?? EMPTY_BI, updatedAt: at })
  })
  for (const f of v.facilities) {
    entries.push({ id: f.id, section: 'facilities', villageId: v.id, title: f.name, body: EMPTY_BI, category: f.kind, updatedAt: at })
  }
  return entries
}
