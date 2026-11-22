import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  collection,
  deleteField,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
  writeBatch,
  type DocumentData,
  type Query,
  type WriteBatch,
} from 'firebase/firestore'
import type { AuditLog, HeritageEntry, PopulationRecord, ReviewStatus, Role, Source, Submission, SubmissionKind, User, Village, AuditAction, Bilingual, CulturalCategory, FacilityKind, HeritageKind } from '@/types'
import { db } from '@/config/firebase'
import { AppError, errorMessage } from '@/firebase/errors'
import {
  auditFromDoc,
  describeChanges,
  heritageEntriesOf,
  populationOf,
  sourceDocOf,
  sourceFromDoc,
  submissionFromDoc,
  userFromDoc,
  villageDocOf,
  villageFromDoc,
  type AuditDoc,
  type SourceDoc,
  type SubmissionDoc,
  type UserDoc,
  type VillageDoc,
} from '@/firebase/model'
import { ErrorState } from '@/components/feedback/States'
import { PageLoader } from '@/components/feedback/PageLoader'
import { useAuth } from '@/hooks/useAuth'

/*
 * The app's data, live from Firestore.
 *
 * Pages read plain lists (villages, population, sources, …) through useData(). Each list is a Firestore
 * listener, so a saved change shows up everywhere without reloading. What is read depends on the role, as
 * firestore.rules allow it: visitors read published villages and the sources; every signed-in role also
 * drafts and the review queue; reviewers and admins the whole audit log (others their own entries); admins
 * every account.
 *
 * Writes: editors and admins change a record directly, in one batch with its audit entry and a review entry
 * (the record goes back to "pending" until a reviewer verifies it). A contributor's change is a proposal in
 * `submissions` carrying the whole record; a reviewer's approval applies it.
 */

export interface DataApi {
  villages: Village[]
  population: PopulationRecord[]
  sources: Source[]
  users: User[]
  submissions: Submission[]
  auditLogs: AuditLog[]
  heritage: HeritageEntry[]
  loading: boolean
  /** Saves the village with its sections (and its population series when given); resolves with its id. */
  saveVillage: (v: Village, mode: 'create' | 'update', population?: PopulationRecord[]) => Promise<string>
  /** Deletes the village document (all its sections are inside it). Admins only. */
  deleteVillage: (id: string) => Promise<void>
  savePopulation: (r: PopulationRecord) => Promise<void>
  deletePopulation: (id: string) => Promise<void>
  /** Replaces the population series of one village with `records`. */
  setVillagePopulation: (villageId: string, records: PopulationRecord[]) => Promise<void>
  /** Every save already files its review entry; kept so callers need not change. */
  addSubmission: (s: Omit<Submission, 'id' | 'submittedAt' | 'submittedBy' | 'history' | 'status'>) => Promise<void>
  saveSource: (s: Source) => Promise<void>
  deleteSource: (id: string) => Promise<void>
  saveHeritage: (h: HeritageEntry) => Promise<void>
  deleteHeritage: (id: string) => Promise<void>
  reviewSubmission: (id: string, status: ReviewStatus, note?: string) => Promise<void>
  updateUser: (id: string, patch: Partial<User>) => Promise<void>
  /** Opens the listeners again (e.g. after a connection problem). */
  reload: () => Promise<void>
  reloadData: () => Promise<void>
}

// eslint-disable-next-line react-refresh/only-export-components
export const DataContext = createContext<DataApi | null>(null)

const isEditor = (role?: Role) => role === 'admin' || role === 'editor'
const isReviewer = (role?: Role) => role === 'admin' || role === 'reviewer'
const now = () => new Date().toISOString()
const label = (b: Bilingual) => b.en || b.ar

type Docs<T> = Map<string, T>
type ListKey = 'villages' | 'sources' | 'submissions' | 'auditLogs' | 'users'

interface AuditInput {
  action: AuditAction
  entityType: AuditDoc['entityType']
  entityLabel: string
  target: string
  details: string
  submissionId?: string
}

export function DataProvider({ children }: { children: ReactNode }) {
  const { user, restoring } = useAuth()
  const role = user?.role
  const uid = user?.id

  const [villageDocs, setVillageDocs] = useState<Docs<VillageDoc>>(new Map())
  const [sourceDocs, setSourceDocs] = useState<Docs<SourceDoc>>(new Map())
  const [submissionDocs, setSubmissionDocs] = useState<Docs<SubmissionDoc>>(new Map())
  const [auditDocs, setAuditDocs] = useState<Docs<AuditDoc>>(new Map())
  const [userDocs, setUserDocs] = useState<Docs<UserDoc>>(new Map())
  const [pending, setPending] = useState<Set<ListKey>>(new Set(['villages', 'sources']))
  const [loadError, setLoadError] = useState<string | null>(null)
  const [generation, setGeneration] = useState(0)

  // Opens one listener per list the role may read; they are opened again when the account changes.
  useEffect(() => {
    if (restoring) return
    const lists: [ListKey, Query<DocumentData> | null, (m: Docs<never>) => void][] = [
      ['villages', role ? collection(db, 'villages') : query(collection(db, 'villages'), where('status', '==', 'published')), setVillageDocs],
      ['sources', collection(db, 'sources'), setSourceDocs],
      ['submissions', role ? collection(db, 'submissions') : null, setSubmissionDocs],
      [
        'auditLogs',
        isReviewer(role)
          ? query(collection(db, 'auditLogs'), orderBy('at', 'desc'), limit(500))
          : uid
            ? query(collection(db, 'auditLogs'), where('userId', '==', uid), limit(200))
            : null,
        setAuditDocs,
      ],
      // Only admins list accounts; everyone else knows their own from sign-in.
      ['users', role === 'admin' ? collection(db, 'users') : null, setUserDocs],
    ]
    // Opening the listeners starts a new load: the flags are reset before the first snapshots arrive.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadError(null)
    setPending(new Set(lists.filter(([, q]) => q).map(([key]) => key)))
    const unsubscribe = lists.map(([key, q, set]) => {
      set(new Map<string, never>())
      if (!q) return () => undefined
      return onSnapshot(
        q,
        (snap) => {
          set(new Map(snap.docs.map((d) => [d.id, d.data() as never])))
          setPending((p) => {
            if (!p.has(key)) return p
            const next = new Set(p)
            next.delete(key)
            return next
          })
        },
        (error) => {
          setLoadError(errorMessage(error))
          setPending(new Set())
        },
      )
    })
    return () => unsubscribe.forEach((u) => u())
  }, [restoring, role, uid, generation])

  // --- Lists the pages read ----------------------------------------------------------------------------

  const villages = useMemo(
    () => [...villageDocs].map(([id, d]) => villageFromDoc(id, d)).sort((a, b) => a.name.en.localeCompare(b.name.en)),
    [villageDocs],
  )
  const population = useMemo(() => [...villageDocs].flatMap(([id, d]) => populationOf(id, d)), [villageDocs])
  const heritage = useMemo(() => villages.flatMap(heritageEntriesOf), [villages])
  const sources = useMemo(
    () => [...sourceDocs].map(([id, d]) => sourceFromDoc(id, d, villages.filter((v) => v.sourceIds.includes(id)).map((v) => v.id))),
    [sourceDocs, villages],
  )
  const submissions = useMemo(() => [...submissionDocs].map(([id, d]) => submissionFromDoc(id, d)), [submissionDocs])
  const auditLogs = useMemo(() => [...auditDocs].map(([id, d]) => auditFromDoc(id, d)).sort((a, b) => b.at.localeCompare(a.at)), [auditDocs])
  const users = useMemo(() => {
    const list = [...userDocs].map(([id, d]) => userFromDoc(id, d))
    if (role === 'admin') return list
    // Other roles cannot read accounts: names come from the entries that recorded them.
    const add = (id: string, name: string) => {
      if (id && !list.some((u) => u.id === id)) list.push({ id, name, email: '', role: 'contributor', active: true, createdAt: '', lastActiveAt: '' })
    }
    if (user) add(user.id, user.name)
    submissionDocs.forEach((s) => add(s.submittedBy, s.submittedByName))
    auditDocs.forEach((a) => add(a.userId, a.userName))
    return list
  }, [userDocs, submissionDocs, auditDocs, role, user])

  // --- Writing -------------------------------------------------------------------------------------------

  const actor = useCallback((): User => {
    if (!user) throw new AppError('unauthenticated', 'Please sign in first · يرجى تسجيل الدخول أولًا')
    return user
  }, [user])

  /** Adds the audit entry of a change to the batch and returns its id (`id` is given for deletes). */
  const audit = useCallback(
    (batch: WriteBatch, entry: AuditInput, id?: string) => {
      const u = actor()
      const ref = id ? doc(db, 'auditLogs', id) : doc(collection(db, 'auditLogs'))
      batch.set(ref, { ...entry, userId: u.id, userName: u.name, at: now(), ip: '—', createdAt: serverTimestamp() })
      return ref.id
    },
    [actor],
  )

  /** The review entry of a change: a proposal with the record (contributors), or a note of a direct edit. */
  const fileSubmission = useCallback(
    (batch: WriteBatch, s: Pick<SubmissionDoc, 'target' | 'villageId' | 'kind' | 'summary' | 'changes' | 'payload'>) => {
      const u = actor()
      // A direct edit needs one open review entry per record, not one per save.
      if (!s.payload) {
        const open = [...submissionDocs.values()].some((x) => x.target === s.target && !x.payload && (x.status === 'pending' || x.status === 'changes-requested'))
        if (open) return
      }
      const at = now()
      const note = s.payload ? undefined : 'Applied by an editor; waiting for verification.'
      batch.set(doc(collection(db, 'submissions')), {
        ...s,
        submittedBy: u.id,
        submittedByName: u.name,
        submittedAt: at,
        status: 'pending',
        history: [{ at, by: u.id, action: 'submitted', note }],
      } satisfies SubmissionDoc)
    },
    [actor, submissionDocs],
  )

  /** Saves a village: directly with its audit entry (editors, admins), or as a proposal (contributors). */
  const writeVillage = useCallback(
    async (id: string, next: Omit<VillageDoc, 'lastAuditId'>, meta: { action: AuditAction; entityType: AuditDoc['entityType']; entityLabel: string; kind: SubmissionKind; summary: Bilingual }) => {
      const u = actor()
      const prev = villageDocs.get(id)
      const target = `villages/${id}`
      const record = { ...next, verification: 'pending' as const, updatedAt: now(), updatedBy: u.id }
      const changes = describeChanges(prev, next)
      const batch = writeBatch(db)
      if (isEditor(u.role)) {
        const lastAuditId = audit(batch, { action: meta.action, entityType: meta.entityType, entityLabel: meta.entityLabel, target, details: changes.map((c) => c.field).join(', ') || meta.action })
        const { lastSubmissionId: _drop, ...data } = { ...record, lastAuditId } as VillageDoc
        void _drop
        batch.set(doc(db, 'villages', id), data)
        fileSubmission(batch, { target, villageId: id, kind: meta.kind, summary: meta.summary, changes, payload: null })
      } else {
        audit(batch, { action: 'create', entityType: 'review', entityLabel: meta.entityLabel, target, details: `Proposed: ${changes.map((c) => c.field).join(', ')}` })
        fileSubmission(batch, { target, villageId: id, kind: meta.kind, summary: meta.summary, changes, payload: { village: { ...record, lastAuditId: '' } } })
      }
      await batch.commit()
    },
    [actor, audit, fileSubmission, villageDocs],
  )

  const villageOrFail = useCallback(
    (id: string) => {
      const d = villageDocs.get(id)
      if (!d) throw new AppError('not-found', 'This village is not in the database · هذه القرية غير موجودة في قاعدة البيانات')
      return d
    },
    [villageDocs],
  )

  /** Applies `edit` to a stored village and saves it, keeping its population series. */
  const editVillage = useCallback(
    async (id: string, edit: (v: Village) => Village, population: PopulationRecord[] | undefined, meta: Parameters<typeof writeVillage>[2]) => {
      const prev = villageOrFail(id)
      const v = edit(villageFromDoc(id, prev))
      await writeVillage(id, villageDocOf(v, population ?? populationOf(id, prev), prev), meta)
    },
    [villageOrFail, writeVillage],
  )

  // --- Actions ---------------------------------------------------------------------------------------

  const saveVillage = useCallback<DataApi['saveVillage']>(
    async (v, mode, records) => {
      const prev = mode === 'update' ? villageDocs.get(v.id) : undefined
      const next = villageDocOf(v, records ?? (prev ? populationOf(v.id, prev) : []), prev)
      const action: AuditAction = !prev ? 'create' : prev.status !== 'published' && v.status === 'published' ? 'publish' : 'update'
      await writeVillage(v.id, next, {
        action,
        entityType: 'village',
        entityLabel: label(v.name),
        kind: prev ? 'edit' : 'new-village',
        summary: prev ? { en: `Village profile: ${v.name.en}`, ar: `ملف القرية: ${v.name.ar}` } : { en: `New village: ${v.name.en}`, ar: `قرية جديدة: ${v.name.ar}` },
      })
      return v.id
    },
    [villageDocs, writeVillage],
  )

  const deleteVillage = useCallback<DataApi['deleteVillage']>(
    async (id) => {
      const prev = villageOrFail(id)
      const batch = writeBatch(db)
      audit(batch, { action: 'delete', entityType: 'village', entityLabel: label(prev.name), target: `villages/${id}`, details: 'Village deleted with all its sections' }, `del-${prev.lastAuditId}`)
      batch.delete(doc(db, 'villages', id))
      await batch.commit()
    },
    [audit, villageOrFail],
  )

  const populationMeta = useCallback(
    (villageId: string, year?: number) => {
      const name = villageOrFail(villageId).name
      return {
        action: 'update' as const,
        entityType: 'population' as const,
        entityLabel: `${label(name)}${year ? ` ${year}` : ''}`,
        kind: 'population' as const,
        summary: { en: `Population figures: ${name.en}${year ? ` ${year}` : ''}`, ar: `أرقام السكان: ${name.ar}${year ? ` ${year}` : ''}` },
      }
    },
    [villageOrFail],
  )

  const setVillagePopulation = useCallback<DataApi['setVillagePopulation']>(
    (villageId, records) => editVillage(villageId, (v) => v, records, populationMeta(villageId)),
    [editVillage, populationMeta],
  )

  const savePopulation = useCallback<DataApi['savePopulation']>(
    async (r) => {
      const current = populationOf(r.villageId, villageOrFail(r.villageId))
      const records = current.some((p) => p.id === r.id) ? current.map((p) => (p.id === r.id ? r : p)) : [...current, r]
      await editVillage(r.villageId, (v) => v, records, populationMeta(r.villageId, r.year))
    },
    [editVillage, populationMeta, villageOrFail],
  )

  const deletePopulation = useCallback<DataApi['deletePopulation']>(
    async (id) => {
      const record = population.find((p) => p.id === id)
      if (!record) return
      const records = population.filter((p) => p.villageId === record.villageId && p.id !== id)
      await editVillage(record.villageId, (v) => v, records, populationMeta(record.villageId, record.year))
    },
    [editVillage, population, populationMeta],
  )

  const saveSource = useCallback<DataApi['saveSource']>(
    async (s) => {
      const u = actor()
      const prev = sourceDocs.get(s.id)
      const target = `sources/${s.id}`
      const data = sourceDocOf(s)
      const summary = prev ? { en: `Source: ${s.title}`, ar: `مصدر: ${s.title}` } : { en: `New source: ${s.title}`, ar: `مصدر جديد: ${s.title}` }
      const changes = prev ? [{ field: 'source', before: prev.title, after: s.title }] : [{ field: 'source', after: s.title }]
      const batch = writeBatch(db)
      if (isEditor(u.role)) {
        const lastAuditId = audit(batch, { action: prev ? 'update' : 'create', entityType: 'source', entityLabel: s.title, target, details: prev ? 'Source updated' : 'Source added' })
        batch.set(doc(db, 'sources', s.id), { ...data, lastAuditId })
        fileSubmission(batch, { target, villageId: s.villageIds[0] ?? '', kind: 'source', summary, changes, payload: null })
      } else {
        audit(batch, { action: 'create', entityType: 'review', entityLabel: s.title, target, details: 'Source proposed' })
        fileSubmission(batch, { target, villageId: s.villageIds[0] ?? '', kind: 'source', summary, changes, payload: { source: { ...data, lastAuditId: '' } } })
      }
      await batch.commit()
    },
    [actor, audit, fileSubmission, sourceDocs],
  )

  const deleteSource = useCallback<DataApi['deleteSource']>(
    async (id) => {
      const prev = sourceDocs.get(id)
      if (!prev) return
      if (villages.some((v) => v.sourceIds.includes(id))) {
        throw new AppError('failed-precondition', 'Villages still cite this source · ما زالت قرى تستشهد بهذا المصدر')
      }
      const batch = writeBatch(db)
      audit(batch, { action: 'delete', entityType: 'source', entityLabel: prev.title, target: `sources/${id}`, details: 'Source deleted' }, `del-${prev.lastAuditId}`)
      batch.delete(doc(db, 'sources', id))
      await batch.commit()
    },
    [audit, sourceDocs, villages],
  )

  const heritageMeta = useCallback(
    (villageId: string, title: Bilingual) => {
      const name = villageOrFail(villageId).name
      return {
        action: 'update' as const,
        entityType: 'heritage' as const,
        entityLabel: `${label(name)}: ${label(title)}`,
        kind: 'heritage' as const,
        summary: { en: `History & heritage: ${name.en} · ${title.en || title.ar}`, ar: `التاريخ والتراث: ${name.ar} · ${title.ar || title.en}` },
      }
    },
    [villageOrFail],
  )

  const saveHeritage = useCallback<DataApi['saveHeritage']>(
    async (h) => {
      const index = (prefix: string) => {
        const m = h.id.match(new RegExp(`^${prefix}-${h.villageId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-(\\d+)$`))
        return m ? Number(m[1]) : -1
      }
      const upsert = <T extends { id: string }>(list: T[], item: T) =>
        list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? { ...x, ...item } : x)) : [...list, item]
      const body = h.body.ar.trim() || h.body.en.trim() ? h.body : undefined

      await editVillage(
        h.villageId,
        (v) => {
          switch (h.section) {
            case 'background':
              return { ...v, history: { ...v.history, overview: h.body } }
            case 'names': {
              const i = index('vn')
              const meaning = h.body.ar.trim() || h.body.en.trim() || undefined
              const kind = h.category === 'former' ? ('former' as const) : ('historical' as const)
              const name = { ...(v.historicalNames[i] ?? {}), name: h.title, period: h.period ?? '', meaning, kind }
              const names = i >= 0 && v.historicalNames[i] ? v.historicalNames.map((n, j) => (j === i ? name : n)) : [...v.historicalNames, name]
              return { ...v, historicalNames: names }
            }
            case 'landmarks': {
              const old = v.heritage.find((x) => x.id === h.id)
              return { ...v, heritage: upsert(v.heritage, { ...old, id: h.id, name: h.title, description: h.body, kind: (h.category ?? 'cultural') as HeritageKind }) }
            }
            case 'culture': {
              const old = v.culture.find((x) => x.id === h.id)
              return { ...v, culture: upsert(v.culture, { ...old, id: h.id, title: h.title, description: h.body, category: (h.category || 'custom') as CulturalCategory }) }
            }
            case 'facilities': {
              const old = v.facilities.find((x) => x.id === h.id)
              return { ...v, facilities: upsert(v.facilities, { ...old, id: h.id, name: h.title, kind: (h.category || 'other') as FacilityKind }) }
            }
            case 'agriculture': {
              const i = index('ap')
              const crops = v.agriculture.crops
              const crop = { ...(crops[i] ?? {}), ar: h.title.ar, en: h.title.en, practices: body }
              return { ...v, agriculture: { ...v.agriculture, crops: i >= 0 && crops[i] ? crops.map((c, j) => (j === i ? crop : c)) : [...crops, crop] } }
            }
          }
          return v
        },
        undefined,
        heritageMeta(h.villageId, h.title),
      )
    },
    [editVillage, heritageMeta],
  )

  const deleteHeritage = useCallback<DataApi['deleteHeritage']>(
    async (id) => {
      const entry = heritage.find((x) => x.id === id)
      if (!entry) return
      const at = Number(id.match(/-(\d+)$/)?.[1] ?? -1)
      await editVillage(
        entry.villageId,
        (v) => {
          switch (entry.section) {
            case 'background':
              return { ...v, history: { ...v.history, overview: { ar: '', en: '' } } }
            case 'names':
              return { ...v, historicalNames: v.historicalNames.filter((_, j) => j !== at) }
            case 'landmarks':
              return { ...v, heritage: v.heritage.filter((x) => x.id !== id) }
            case 'culture':
              return { ...v, culture: v.culture.filter((x) => x.id !== id) }
            case 'facilities':
              return { ...v, facilities: v.facilities.filter((x) => x.id !== id) }
            case 'agriculture':
              return { ...v, agriculture: { ...v.agriculture, crops: v.agriculture.crops.filter((_, j) => j !== at) } }
          }
          return v
        },
        undefined,
        heritageMeta(entry.villageId, entry.title),
      )
    },
    [editVillage, heritage, heritageMeta],
  )

  const reviewSubmission = useCallback<DataApi['reviewSubmission']>(
    async (id, status, note) => {
      const u = actor()
      const sub = submissionDocs.get(id)
      if (!sub) throw new AppError('not-found', 'This review entry no longer exists · لم يعد هذا الطلب موجودًا')
      const at = now()
      const entry = { at, by: u.id, action: status, note }
      const approved = status === 'approved'
      const [collectionName, recordId] = sub.target.split('/')
      const batch = writeBatch(db)
      const lastAuditId = audit(batch, {
        action: approved ? 'approve' : 'reject',
        entityType: collectionName === 'sources' ? 'source' : 'review',
        entityLabel: label(sub.summary),
        target: sub.target,
        submissionId: id,
        details: [status, note].filter(Boolean).join(': '),
      })
      batch.update(doc(db, 'submissions', id), { status, history: [...sub.history, entry], reviewedBy: u.id, reviewedAt: at, lastAuditId })

      const ref = doc(db, collectionName, recordId)
      const stored = collectionName === 'villages' ? villageDocs.get(recordId) : sourceDocs.get(recordId)
      const reviewHistory = collectionName === 'villages' ? { reviewHistory: [...((stored as VillageDoc | undefined)?.reviewHistory ?? []), entry] } : {}
      const review = { verification: approved ? 'verified' : 'needs-review', lastAuditId, lastSubmissionId: id, updatedAt: at, ...reviewHistory }
      if (approved && sub.payload) {
        // The proposal carries the whole record as the contributor saved it.
        const data = 'village' in sub.payload ? sub.payload.village : sub.payload.source
        batch.set(ref, { ...data, ...review })
      } else if (stored && !sub.payload) {
        // A direct edit is already applied: the decision only marks the record.
        batch.update(ref, review)
      }
      await batch.commit()
    },
    [actor, audit, submissionDocs, villageDocs, sourceDocs],
  )

  const updateUser = useCallback<DataApi['updateUser']>(
    async (id, patch) => {
      const u = actor()
      const ref = doc(db, 'users', id)
      const own = { name: patch.name?.trim() || undefined, organization: patch.organization === undefined ? deleteField() : patch.organization.trim() || deleteField() }
      if (id === u.id && u.role !== 'admin') {
        await writeBatch(db).update(ref, own).commit()
        return
      }
      if (u.role !== 'admin') throw new AppError('permission-denied', 'Only an admin changes accounts · المسؤول وحده يعدّل الحسابات')
      const current = userDocs.get(id)
      const roleChanged = patch.role !== undefined && patch.role !== current?.role
      const changes = [
        roleChanged && `role: ${current?.role} → ${patch.role}`,
        patch.active !== undefined && patch.active !== current?.active && (patch.active ? 'account enabled' : 'account disabled'),
        patch.name && patch.name !== current?.name && 'name',
      ].filter(Boolean)
      const batch = writeBatch(db)
      const lastAuditId = audit(batch, { action: roleChanged ? 'role-change' : 'update', entityType: 'user', entityLabel: patch.name || current?.name || id, target: `users/${id}`, details: changes.join(', ') || 'profile updated' })
      batch.update(ref, {
        ...(patch.name !== undefined ? { name: own.name } : {}),
        ...(patch.organization !== undefined ? { organization: own.organization } : {}),
        ...(patch.role !== undefined ? { role: patch.role } : {}),
        ...(patch.active !== undefined ? { active: patch.active } : {}),
        lastAuditId,
      })
      await batch.commit()
    },
    [actor, audit, userDocs],
  )

  const addSubmission = useCallback<DataApi['addSubmission']>(async () => undefined, [])
  const reload = useCallback(async () => setGeneration((g) => g + 1), [])

  const loading = restoring || pending.size > 0
  const value = useMemo<DataApi>(
    () => ({
      villages,
      population,
      sources,
      users,
      submissions,
      auditLogs,
      heritage,
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
      reload,
      reloadData: reload,
    }),
    [villages, population, sources, users, submissions, auditLogs, heritage, loading, saveVillage, deleteVillage, savePopulation, deletePopulation, setVillagePopulation, addSubmission, saveSource, deleteSource, saveHeritage, deleteHeritage, reviewSubmission, updateUser, reload],
  )

  if (loadError && villages.length === 0) {
    return (
      <div className="grid min-h-screen place-items-center p-6">
        <ErrorState title="Qaryati could not load its data · تعذّر تحميل البيانات" description={loadError} onRetry={() => void reload()} />
      </div>
    )
  }
  if (loading && villages.length === 0) return <PageLoader />
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}
