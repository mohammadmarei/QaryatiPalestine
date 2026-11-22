import { createContext, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { HeritageEntry, PopulationRecord, ReviewStatus, Source, Submission, User, Village, AuditLog, Bilingual } from '@/types'
import { api, ApiError, fetchAll, mapLimit } from '@/api/client'
import {
  auditFromApi,
  heritageEntriesOf,
  indexGovernorates,
  landmarkTypeFromKind,
  populationBody,
  populationFromApi,
  serverId,
  sourceBody,
  sourceFromApi,
  submissionFromVerification,
  userFromApi,
  villageBody,
  villageFromProfile,
  type GovernorateIndex,
  type RecordLookup,
} from '@/api/mappers'
import type {
  ApiAgriculturalProduct,
  ApiAuditLog,
  ApiGovernorate,
  ApiRelation,
  ApiSource,
  ApiUser,
  ApiVerification,
  ApiVillage,
  ApiVillageProfile,
} from '@/api/types'
import { ErrorState } from '@/components/feedback/States'
import { PageLoader } from '@/components/feedback/PageLoader'
import { useAuth } from '@/hooks/useAuth'
import type { HeritageKind } from '@/types'

/*
 * The app's data, loaded from the Qaryati API.
 *
 * Pages read plain lists (villages, population, sources, …) through useData(), as they did with the earlier
 * store, and every change goes to the API first: the store only reflects what the server saved. After a
 * write, the village concerned is read again with `Cache-Control: no-cache`, so the 30-second profile
 * cache (ADR-0011) never shows an editor stale data. Errors are thrown as ApiError for the page to show.
 *
 * Which lists load depends on the role, as the API's permission policy does: everyone reads villages and
 * sources; every signed-in role sees the review queue; reviewers and admins the audit log; admins users.
 */

interface DataState {
  villages: Village[]
  population: PopulationRecord[]
  sources: Source[]
  users: User[]
  submissions: Submission[]
  auditLogs: AuditLog[]
  heritage: HeritageEntry[]
}

export interface DataApi extends DataState {
  loading: boolean
  /** Saves the village row and its sections; resolves with the village id the API gave it. */
  saveVillage: (v: Village, mode: 'create' | 'update') => Promise<string>
  /** Removes the village's records one by one (each is audited), then the village. Admins only. */
  deleteVillage: (id: string) => Promise<void>
  savePopulation: (r: PopulationRecord) => Promise<void>
  deletePopulation: (id: string) => Promise<void>
  /** Brings the population series of one village in line with `records` (create, update, delete). */
  setVillagePopulation: (villageId: string, records: PopulationRecord[]) => Promise<void>
  /** The API queues every saved record for review by itself; kept so callers need not change. */
  addSubmission: (s: Omit<Submission, 'id' | 'submittedAt' | 'submittedBy' | 'history' | 'status'>) => Promise<void>
  saveSource: (s: Source) => Promise<void>
  deleteSource: (id: string) => Promise<void>
  saveHeritage: (h: HeritageEntry) => Promise<void>
  deleteHeritage: (id: string) => Promise<void>
  reviewSubmission: (id: string, status: ReviewStatus, note?: string) => Promise<void>
  updateUser: (id: string, patch: Partial<User>) => Promise<void>
  /** Loads everything from the API again. */
  reload: () => Promise<void>
  /** Kept for the settings page: the data lives on the server, so this reloads it. */
  /** Fetches every list again from the API. */
  reloadData: () => Promise<void>
}

// eslint-disable-next-line react-refresh/only-export-components
export const DataContext = createContext<DataApi | null>(null)

const EMPTY: DataState = { villages: [], population: [], sources: [], users: [], submissions: [], auditLogs: [], heritage: [] }

/** An action the API has no endpoint for, reported like an API refusal. */
const unsupported = (what: string) => new ApiError(400, 'NOT_SUPPORTED', `${what} cannot be edited here: the API has no endpoint for it yet.`)

interface LoadedVillage {
  profile: ApiVillageProfile
  relations: ApiRelation[]
}

/** One request per village: the profile carries every section, nearby villages included (ADR-0011). */
async function loadVillage(id: number, fresh = false): Promise<LoadedVillage> {
  const profile = await api<ApiVillageProfile>(`/villages/${id}/profile`, { fresh })
  return { profile, relations: profile.relations.data }
}

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const role = user?.role
  const [state, setState] = useState<DataState>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<ApiError | null>(null)
  const [firstLoadDone, setFirstLoadDone] = useState(false)

  // Raw API data the mappers and lookups need; kept in refs because the UI never renders them directly.
  const gov = useRef<GovernorateIndex>({ slugById: new Map(), idBySlug: new Map(), extra: [] })
  const villageData = useRef(new Map<string, LoadedVillage>())
  const verifications = useRef<ApiVerification[]>([])
  // Render-time copies of the refs above, so derived lists re-render when they change.
  const [villageSnapshot, setVillageSnapshot] = useState(() => new Map<string, LoadedVillage>())
  const [verificationList, setVerificationList] = useState<ApiVerification[]>([])
  const [auditRaw, setAuditRaw] = useState<ApiAuditLog[]>([])

  const lookup = useMemo<RecordLookup>(() => {
    const find = (entityType: string, entityId: number): { village: string; label?: Bilingual } | undefined => {
      for (const [villageId, { profile, relations }] of villageSnapshot) {
        const name = (ar: string | null, en: string | null): Bilingual => ({ ar: ar ?? en ?? '', en: en ?? ar ?? '' })
        if (entityType === 'village' && profile.village.id === entityId) return { village: villageId, label: name(profile.village.current_name, profile.village.english_name) }
        const lists: Record<string, () => Bilingual | undefined> = {
          'population-record': () => {
            const r = profile.population.data.find((x) => x.id === entityId)
            return r && { ar: `${profile.village.current_name} ${r.referenceYear}`, en: `${profile.village.english_name ?? profile.village.current_name} ${r.referenceYear}` }
          },
          'historical-event': () => {
            const r = profile.historicalEvents.data.find((x) => x.id === entityId)
            return r && name(r.titleAr, r.titleEng)
          },
          landmark: () => {
            const r = profile.landmarks.data.find((x) => x.id === entityId)
            return r && name(r.nameAr, r.nameEng)
          },
          'cultural-practice': () => {
            const r = profile.culturalPractices.data.find((x) => x.id === entityId)
            return r && name(r.nameAr, r.nameEng)
          },
          facility: () => {
            const r = profile.facilities.data.find((x) => x.id === entityId)
            return r && name(r.nameAr, r.nameEng)
          },
          'economic-activity': () => {
            const r = profile.economicActivities.data.find((x) => x.id === entityId)
            return r && name(r.nameAr, r.nameEng)
          },
          'village-name': () => {
            const r = profile.village.names?.find((x) => x.id === entityId)
            return r && name(r.ar_name, r.eng_name)
          },
          'village-relation': () => {
            const r = relations.find((x) => x.id === entityId)
            return r && name(`${profile.village.current_name} ↔ ${r.nearbyVillage.currentName}`, `${profile.village.english_name ?? ''} ↔ ${r.nearbyVillage.englishName ?? ''}`)
          },
        }
        const label = lists[entityType]?.()
        if (label) return { village: villageId, label }
      }
      return undefined
    }
    return {
      villageOf: (t, id) => find(t, id)?.village,
      labelOf: (t, id) => {
        if (t === 'source') {
          const s = state.sources.find((x) => x.id === String(id))
          return s && { ar: s.title, en: s.title }
        }
        return find(t, id)?.label
      },
    }
  }, [state.sources, villageSnapshot])

  /** Rebuilds the village-derived lists (villages, population, heritage) from the loaded profiles. */
  const villageLists = useCallback(() => {
    const villages: Village[] = []
    const population: PopulationRecord[] = []
    const heritage: HeritageEntry[] = []
    for (const { profile, relations } of villageData.current.values()) {
      const v = villageFromProfile(profile, relations, gov.current)
      villages.push(v)
      population.push(...profile.population.data.map(populationFromApi))
      heritage.push(...heritageEntriesOf(v, profile))
    }
    villages.sort((a, b) => a.name.en.localeCompare(b.name.en))
    setVillageSnapshot(new Map(villageData.current))
    return { villages, population, heritage }
  }, [])

  const sourcesWithVillages = useCallback((list: ApiSource[], villages: Village[]) =>
    list.map((s) => sourceFromApi(s, villages.filter((v) => v.sourceIds.includes(String(s.id))).map((v) => v.id))), [])

  const loadReviews = useCallback(async () => {
    if (!role) {
      verifications.current = []
    } else {
      verifications.current = await fetchAll<ApiVerification>('/verifications')
    }
    setVerificationList(verifications.current)
  }, [role])

  const rawSources = useRef<ApiSource[]>([])

  const loadAll = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      gov.current = indexGovernorates(await api<ApiGovernorate[]>('/governorates'))
      const list = await fetchAll<ApiVillage>('/villages')
      const loaded = await mapLimit(list, 6, (v) => loadVillage(v.id))
      villageData.current = new Map(list.map((v, i) => [String(v.id), loaded[i]]))
      rawSources.current = await fetchAll<ApiSource>('/sources')
      await loadReviews()
      const isAdmin = role === 'admin'
      const readsAudit = role === 'admin' || role === 'reviewer'
      const [apiUsers, audit] = await Promise.all([
        isAdmin ? fetchAll<ApiUser>('/users') : Promise.resolve([]),
        readsAudit ? fetchAll<ApiAuditLog>('/audit-logs', { sort: '-createdAt' }, 500) : Promise.resolve([]),
      ])
      const lists = villageLists()
      const users = apiUsers.map(userFromApi)
      if (user && !users.some((u) => u.id === user.id)) users.push(user)
      setState({
        ...lists,
        sources: sourcesWithVillages(rawSources.current, lists.villages),
        users,
        submissions: [],
        auditLogs: [],
        // Reviews and the audit log need the lookup, which needs the sources: filled just below.
      })
      setAuditRaw(audit)
    } catch (error) {
      setLoadError(error instanceof ApiError ? error : new ApiError(0, 'LOAD_FAILED', String(error)))
    } finally {
      setLoading(false)
      setFirstLoadDone(true)
    }
  }, [loadReviews, role, user, villageLists, sourcesWithVillages])

  // Reviews and audit entries are described with the loaded records, so they are derived from them.
  const submissions = useMemo(() => verificationList.map((v) => submissionFromVerification(v, lookup)), [lookup, verificationList])
  const auditLogs = useMemo(() => auditRaw.map((a) => auditFromApi(a, lookup)), [lookup, auditRaw])

  // Load on start, and again when the signed-in role changes (it decides which lists are readable).
  useEffect(() => {
    // Fetching on mount and on sign-in is what this effect is for; loadAll sets its loading flag first.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role])

  /** Reads one village again, bypassing every cache, and updates the lists that come from it. */
  const refreshVillage = useCallback(
    async (id: string) => {
      try {
        villageData.current.set(id, await loadVillage(Number(id), true))
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) villageData.current.delete(id)
        else throw error
      }
      await loadReviews()
      const lists = villageLists()
      setState((s) => ({ ...s, ...lists, sources: sourcesWithVillages(rawSources.current, lists.villages) }))
    },
    [loadReviews, villageLists, sourcesWithVillages],
  )

  const refreshSources = useCallback(async () => {
    rawSources.current = await fetchAll<ApiSource>('/sources')
    await loadReviews()
    setState((s) => ({ ...s, sources: sourcesWithVillages(rawSources.current, s.villages) }))
  }, [loadReviews, sourcesWithVillages])

  // --- Sections of a village ------------------------------------------------------------------------

  /** Finds a crop in the catalogue by name, or adds it, and returns its id. */
  const productIdFor = useCallback(async (crop: Bilingual & { practices?: Bilingual }) => {
    const name = crop.ar.trim() || crop.en.trim()
    const found = (await api<{ data: ApiAgriculturalProduct[] }>('/agricultural-products', { query: { q: name, limit: 100 } })).data.find(
      (p) => p.nameAr === crop.ar.trim() || (crop.en.trim() && p.nameEng === crop.en.trim()),
    )
    if (found) return found.id
    const created = await api<ApiAgriculturalProduct>('/agricultural-products', {
      method: 'POST',
      body: { nameAr: name, nameEng: crop.en.trim() || undefined, descriptionAr: crop.practices?.ar || undefined, descriptionEng: crop.practices?.en || undefined },
    })
    return created.id
  }, [])

  /** Creates, updates and deletes the village's events, landmarks, facilities, economy and crops to match `next`. */
  const syncSections = useCallback(
    async (villageId: number, next: Village, prev: Village | undefined) => {
      const vid = villageId
      const firstSource = next.sourceIds.map(Number).find((n) => Number.isInteger(n) && n > 0)

      // Historical events
      const prevEvents = prev?.history.events ?? []
      for (const e of next.history.events) {
        const body = {
          titleAr: e.title.ar.trim() || e.title.en.trim(),
          titleEng: e.title.en.trim() || null,
          descriptionAr: e.description.ar.trim() || null,
          descriptionEng: e.description.en.trim() || null,
          // The API stores a day; a bare year is kept as its first day, other forms stay undated.
          eventDate: /^\d{4}$/.test(e.year.trim()) ? `${e.year.trim()}-01-01` : null,
        }
        const id = e.id.startsWith('ev-') ? serverId(e.id) : undefined
        if (id === undefined) await api(`/villages/${vid}/historical-events`, { method: 'POST', body: { ...body, titleEng: body.titleEng ?? undefined, descriptionAr: body.descriptionAr ?? undefined, descriptionEng: body.descriptionEng ?? undefined, eventDate: body.eventDate ?? undefined } })
        else if (JSON.stringify(prevEvents.find((p) => p.id === e.id)) !== JSON.stringify(e)) await api(`/historical-events/${id}`, { method: 'PATCH', body })
      }
      for (const p of prevEvents) {
        const id = serverId(p.id)
        if (id !== undefined && !next.history.events.some((e) => e.id === p.id)) await api(`/historical-events/${id}`, { method: 'DELETE' })
      }

      // Landmarks
      const prevSites = prev?.heritage ?? []
      for (const h of next.heritage) {
        const body = {
          nameAr: h.name.ar.trim() || h.name.en.trim(),
          nameEng: h.name.en.trim() || null,
          type: landmarkTypeFromKind(h.kind as HeritageKind),
          descriptionAr: h.description.ar.trim() || null,
          descriptionEng: h.description.en.trim() || null,
          // Only a URL the user gave; a stored server path is left as it is, never erased by an edit.
          imageUrl: h.image && /^https?:\/\//.test(h.image) && h.image.length <= 255 ? h.image : undefined,
        }
        const id = h.id.startsWith('lm-') ? serverId(h.id) : undefined
        if (id === undefined) await api(`/villages/${vid}/landmarks`, { method: 'POST', body: Object.fromEntries(Object.entries(body).filter(([, v]) => v !== null)) })
        else if (JSON.stringify(prevSites.find((p) => p.id === h.id)) !== JSON.stringify(h)) await api(`/landmarks/${id}`, { method: 'PATCH', body })
      }
      for (const p of prevSites) {
        const id = serverId(p.id)
        if (id !== undefined && !next.heritage.some((h) => h.id === p.id)) await api(`/landmarks/${id}`, { method: 'DELETE' })
      }

      // Facilities (a count needs a source, ADR-0008: the village's first source is cited)
      const prevFacilities = prev?.facilities ?? []
      for (const f of next.facilities) {
        const count = f.count && firstSource ? f.count : null
        const body = { nameAr: f.name.ar.trim() || f.name.en.trim(), nameEng: f.name.en.trim() || null, type: f.kind, count, sourceId: count ? firstSource : null }
        const id = f.id.startsWith('fa-') ? serverId(f.id) : undefined
        if (id === undefined) await api(`/villages/${vid}/facilities`, { method: 'POST', body: Object.fromEntries(Object.entries(body).filter(([, v]) => v !== null)) })
        else if (JSON.stringify(prevFacilities.find((p) => p.id === f.id)) !== JSON.stringify(f)) await api(`/facilities/${id}`, { method: 'PATCH', body })
      }
      for (const p of prevFacilities) {
        const id = serverId(p.id)
        if (id !== undefined && !next.facilities.some((f) => f.id === p.id)) await api(`/facilities/${id}`, { method: 'DELETE' })
      }

      // Economic activities and crops are lists of names: matched by name.
      const loaded = villageData.current.get(String(vid))?.profile
      const activities = loaded?.economicActivities.data ?? []
      for (const e of next.agriculture.economy) {
        const nameAr = e.ar.trim() || e.en.trim()
        if (nameAr && !activities.some((a) => a.nameAr === nameAr)) await api(`/villages/${vid}/economic-activities`, { method: 'POST', body: { nameAr, nameEng: e.en.trim() || undefined } })
      }
      for (const a of activities) {
        if (!next.agriculture.economy.some((e) => (e.ar.trim() || e.en.trim()) === a.nameAr)) await api(`/economic-activities/${a.id}`, { method: 'DELETE' })
      }
      const linked = loaded?.agriculturalProducts.data ?? []
      for (const crop of next.agriculture.crops) {
        if (!(crop.ar.trim() || crop.en.trim())) continue
        if (linked.some((p) => p.nameAr === crop.ar.trim() || (crop.en.trim() && p.nameEng === crop.en.trim()))) continue
        const productId = await productIdFor(crop)
        await api(`/villages/${vid}/agricultural-products`, { method: 'POST', body: { productId } })
      }
      for (const p of linked) {
        if (!next.agriculture.crops.some((c) => c.ar.trim() === p.nameAr || (c.en.trim() && c.en.trim() === p.nameEng))) {
          await api(`/villages/${vid}/agricultural-products/${p.productId}`, { method: 'DELETE' })
        }
      }
    },
    [productIdFor],
  )

  // --- Actions ---------------------------------------------------------------------------------------

  const saveVillage = useCallback<DataApi['saveVillage']>(
    async (v, mode) => {
      const prev = state.villages.find((x) => x.id === v.id)
      const body = villageBody(v, gov.current)
      let id = mode === 'update' ? serverId(v.id) : undefined
      if (id === undefined) {
        const created = await api<ApiVillage>('/villages', { method: 'POST', body: Object.fromEntries(Object.entries(body).filter(([, x]) => x !== null)) })
        id = created.id
        // A new village is always a draft; publishing is an edit, which needs an editor or admin.
        if (v.status === 'published') {
          await api(`/villages/${id}`, { method: 'PATCH', body: { recordStatus: 'published' } }).catch((error) => {
            if (!(error instanceof ApiError && error.status === 403)) throw error
          })
        }
      } else {
        await api(`/villages/${id}`, { method: 'PATCH', body: { ...body, recordStatus: v.status === 'published' ? 'published' : 'draft' } })
      }
      // Load the saved village first, so the sections compare against what the server holds.
      villageData.current.set(String(id), await loadVillage(id, true))
      try {
        await syncSections(id, v, mode === 'update' ? prev : undefined)
      } finally {
        await refreshVillage(String(id))
      }
      return String(id)
    },
    [state.villages, syncSections, refreshVillage],
  )

  const deleteVillage = useCallback<DataApi['deleteVillage']>(
    async (id) => {
      const loaded = villageData.current.get(id)
      if (loaded) {
        const { profile, relations } = loaded
        const del = (path: string) => api(path, { method: 'DELETE' })
        for (const r of profile.population.data) await del(`/population-records/${r.id}`)
        for (const e of profile.historicalEvents.data) await del(`/historical-events/${e.id}`)
        for (const l of profile.landmarks.data) await del(`/landmarks/${l.id}`)
        for (const f of profile.facilities.data) await del(`/facilities/${f.id}`)
        for (const a of profile.economicActivities.data) await del(`/economic-activities/${a.id}`)
        for (const p of profile.agriculturalProducts.data) await del(`/villages/${id}/agricultural-products/${p.productId}`)
        for (const r of relations) await del(`/village-relations/${r.id}`)
        for (const c of profile.culturalPractices.data) await del(`/cultural-practices/${c.id}`)
      }
      await api(`/villages/${id}`, { method: 'DELETE' })
      villageData.current.delete(id)
      await loadReviews()
      const lists = villageLists()
      setState((s) => ({ ...s, ...lists, sources: sourcesWithVillages(rawSources.current, lists.villages) }))
    },
    [loadReviews, villageLists, sourcesWithVillages],
  )

  const savePopulation = useCallback<DataApi['savePopulation']>(
    async (r) => {
      const id = serverId(r.id)
      if (id !== undefined && state.population.some((p) => p.id === r.id)) await api(`/population-records/${id}`, { method: 'PATCH', body: populationBody(r) })
      else await api(`/villages/${r.villageId}/population-records`, { method: 'POST', body: populationBody(r) })
      await refreshVillage(r.villageId)
    },
    [state.population, refreshVillage],
  )

  const deletePopulation = useCallback<DataApi['deletePopulation']>(
    async (id) => {
      const record = state.population.find((p) => p.id === id)
      await api(`/population-records/${id}`, { method: 'DELETE' })
      if (record) await refreshVillage(record.villageId)
    },
    [state.population, refreshVillage],
  )

  const setVillagePopulation = useCallback<DataApi['setVillagePopulation']>(
    async (villageId, records) => {
      const current = (villageData.current.get(villageId)?.profile.population.data ?? []).map(populationFromApi)
      for (const r of records) {
        const existing = current.find((c) => c.id === r.id)
        if (!existing) await api(`/villages/${villageId}/population-records`, { method: 'POST', body: populationBody(r) })
        else if (existing.year !== r.year || existing.population !== r.population || existing.kind !== r.kind || existing.sourceId !== r.sourceId) {
          await api(`/population-records/${r.id}`, { method: 'PATCH', body: populationBody(r) })
        }
      }
      for (const c of current) if (!records.some((r) => r.id === c.id)) await api(`/population-records/${c.id}`, { method: 'DELETE' })
      await refreshVillage(villageId)
    },
    [refreshVillage],
  )

  const saveSource = useCallback<DataApi['saveSource']>(
    async (s) => {
      const id = serverId(s.id)
      if (id !== undefined && state.sources.some((x) => x.id === s.id)) await api(`/sources/${id}`, { method: 'PATCH', body: sourceBody(s) })
      else await api('/sources', { method: 'POST', body: sourceBody(s) })
      await refreshSources()
    },
    [state.sources, refreshSources],
  )

  const deleteSource = useCallback<DataApi['deleteSource']>(
    async (id) => {
      await api(`/sources/${id}`, { method: 'DELETE' })
      await refreshSources()
    },
    [refreshSources],
  )

  const saveHeritage = useCallback<DataApi['saveHeritage']>(
    async (h) => {
      const vid = h.villageId
      const isNew = !state.heritage.some((x) => x.id === h.id)
      switch (h.section) {
        case 'background':
          await api(`/villages/${vid}`, { method: 'PATCH', body: { historicalOverviewAr: h.body.ar.trim() || null, historicalOverviewEng: h.body.en.trim() || null } })
          break
        case 'landmarks': {
          const body = { nameAr: h.title.ar.trim() || h.title.en.trim(), nameEng: h.title.en.trim() || null, type: landmarkTypeFromKind((h.category ?? 'cultural') as HeritageKind), descriptionAr: h.body.ar.trim() || null, descriptionEng: h.body.en.trim() || null }
          if (isNew) await api(`/villages/${vid}/landmarks`, { method: 'POST', body: Object.fromEntries(Object.entries(body).filter(([, v]) => v !== null)) })
          else await api(`/landmarks/${serverId(h.id)}`, { method: 'PATCH', body })
          break
        }
        case 'facilities': {
          const body = { nameAr: h.title.ar.trim() || h.title.en.trim(), nameEng: h.title.en.trim() || null, type: h.category || 'other' }
          if (isNew) await api(`/villages/${vid}/facilities`, { method: 'POST', body: Object.fromEntries(Object.entries(body).filter(([, v]) => v !== null)) })
          else await api(`/facilities/${serverId(h.id)}`, { method: 'PATCH', body })
          break
        }
        case 'agriculture': {
          const crop = { ...h.title, practices: h.body }
          if (!isNew) {
            const old = h.id.match(/^ap-\d+-(\d+)$/)?.[1]
            if (old) await api(`/villages/${vid}/agricultural-products/${old}`, { method: 'DELETE' })
          }
          const productId = await productIdFor(crop)
          await api(`/villages/${vid}/agricultural-products`, { method: 'POST', body: { productId } })
          break
        }
        case 'names': {
          // The page has no type or source field: a name added here is an alternative spelling, which needs
          // no source. Former and historical names (which do) are added through the API with their source.
          const body = { arName: h.title.ar.trim() || h.title.en.trim(), engName: h.title.en.trim() || null, meaning: h.body.ar.trim() || h.body.en.trim() || null }
          if (isNew) await api(`/villages/${vid}/names`, { method: 'POST', body: { ...body, engName: body.engName ?? undefined, meaning: body.meaning ?? undefined, nameType: 'alternative' } })
          else await api(`/village-names/${serverId(h.id)}`, { method: 'PATCH', body })
          break
        }
        case 'culture': {
          const body = { category: h.category || 'custom', nameAr: h.title.ar.trim() || h.title.en.trim(), nameEng: h.title.en.trim() || null, descriptionAr: h.body.ar.trim() || null, descriptionEng: h.body.en.trim() || null }
          if (isNew) await api(`/villages/${vid}/cultural-practices`, { method: 'POST', body: Object.fromEntries(Object.entries(body).filter(([, v]) => v !== null)) })
          else await api(`/cultural-practices/${serverId(h.id)}`, { method: 'PATCH', body })
          break
        }
      }
      await refreshVillage(vid)
    },
    [state.heritage, productIdFor, refreshVillage],
  )

  const deleteHeritage = useCallback<DataApi['deleteHeritage']>(
    async (id) => {
      const entry = state.heritage.find((x) => x.id === id)
      if (!entry) return
      const [prefix] = id.split('-')
      if (prefix === 'bg') await api(`/villages/${entry.villageId}`, { method: 'PATCH', body: { historicalOverviewAr: null, historicalOverviewEng: null } })
      else if (prefix === 'lm') await api(`/landmarks/${serverId(id)}`, { method: 'DELETE' })
      else if (prefix === 'fa') await api(`/facilities/${serverId(id)}`, { method: 'DELETE' })
      else if (prefix === 'ap') await api(`/villages/${entry.villageId}/agricultural-products/${id.split('-')[2]}`, { method: 'DELETE' })
      else if (prefix === 'vn') await api(`/village-names/${serverId(id)}`, { method: 'DELETE' })
      else if (prefix === 'cp') await api(`/cultural-practices/${serverId(id)}`, { method: 'DELETE' })
      else throw unsupported('This entry')
      await refreshVillage(entry.villageId)
    },
    [state.heritage, refreshVillage],
  )

  const reviewSubmission = useCallback<DataApi['reviewSubmission']>(
    async (id, status, note) => {
      const body =
        status === 'approved'
          ? { status: 'verified', notes: note || undefined }
          : status === 'changes-requested'
            ? { status: 'rejected', notes: `Changes requested: ${note ?? ''}`.trim() }
            : { status: status === 'rejected' ? 'rejected' : 'pending', notes: note || undefined }
      await api(`/verifications/${id}`, { method: 'PATCH', body })
      const v = verifications.current.find((x) => String(x.id) === id)
      const villageId = v && lookup.villageOf(v.entityType, v.entityId)
      if (villageId) await refreshVillage(villageId)
      else await loadReviews()
    },
    [lookup, refreshVillage, loadReviews],
  )

  const updateUser = useCallback<DataApi['updateUser']>(
    async (id, patch) => {
      const current = state.users.find((u) => u.id === id)
      if (patch.role && patch.role !== current?.role) await api(`/users/${id}/roles`, { method: 'PATCH', body: { roles: [patch.role] } })
      if (patch.active !== undefined && patch.active !== current?.active) await api(`/users/${id}/status`, { method: 'PATCH', body: { enabled: patch.active } })
      if (role === 'admin') {
        const users = (await fetchAll<ApiUser>('/users')).map(userFromApi)
        setState((s) => ({ ...s, users }))
      }
    },
    [state.users, role],
  )

  const addSubmission = useCallback<DataApi['addSubmission']>(async () => undefined, [])

  const value = useMemo<DataApi>(
    () => ({
      ...state,
      submissions,
      auditLogs,
      loading,
      saveVillage,
      deleteVillage,
      savePopulation,
      deletePopulation,
      setVillagePopulation,
      addSubmission,
      saveSource,
      deleteSource,
      saveHeritage,
      deleteHeritage,
      reviewSubmission,
      updateUser,
      reload: loadAll,
      reloadData: loadAll,
    }),
    [state, submissions, auditLogs, loading, saveVillage, deleteVillage, savePopulation, deletePopulation, setVillagePopulation, addSubmission, saveSource, deleteSource, saveHeritage, deleteHeritage, reviewSubmission, updateUser, loadAll],
  )

  if (!firstLoadDone) return <PageLoader />
  if (loadError && state.villages.length === 0) {
    return (
      <div className="grid min-h-screen place-items-center p-6">
        <ErrorState
          title="Qaryati could not load its data · تعذّر تحميل البيانات"
          description={loadError.userMessage}
          onRetry={() => void loadAll()}
        />
      </div>
    )
  }
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}
