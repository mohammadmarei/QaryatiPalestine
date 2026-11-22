/*
 * Imports the sourced seed data (data/qaryati_seed.mysql.sql, data/governorates.mysql.sql) into Firestore.
 *
 *   node scripts/import-seed.ts --dry-run   parse and convert only, print the counts, write nothing
 *   node scripts/import-seed.ts             write to Firestore (refuses if villages already exist)
 *   node scripts/import-seed.ts --force     write even if villages exist (seed documents are replaced)
 *
 * The MySQL dump is parsed as it is, not retyped. Writes use the Admin SDK with the service-account key at
 * Desktop\firebase-key.json (or the path in FIREBASE_KEY). The key is secret: it is never printed and never
 * committed. Every seeded record starts as `pending` review with an entry in the review queue. The demo
 * accounts of the seed are not imported: accounts are made by signing up.
 *
 * Runs on Node 23.6+ (TypeScript type stripping); it reuses the app's governorate list and helpers.
 */
import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { governorates as knownGovernorates } from '../src/data/governorates.ts'
import { hashString, slugify } from '../src/utils/misc.ts'

const PROJECT_ID = 'qaryati-36f85'
const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const args = new Set(process.argv.slice(2))
const dryRun = args.has('--dry-run')
const force = args.has('--force')

// --- MySQL INSERT parser -------------------------------------------------------------------------------

type Value = string | number | null
type Row = Record<string, Value>

/** Every row of every `INSERT INTO ... VALUES` statement, by table. `INSERT ... SELECT` is skipped. */
function parseInserts(sql: string, defaultColumns: Record<string, string[]> = {}): Map<string, Row[]> {
  const tables = new Map<string, Row[]>()
  const head = /INSERT INTO `(\w+)`\s*(?:\(([^)]*)\))?\s*VALUES\s*/g
  let m: RegExpExecArray | null
  while ((m = head.exec(sql))) {
    const table = m[1]
    const columns = m[2] ? m[2].split(',').map((c) => c.trim().replace(/`/g, '')) : defaultColumns[table]
    if (!columns) throw new Error(`No column list for ${table}`)
    let i = head.lastIndex
    const rows = tables.get(table) ?? []
    for (;;) {
      while (/[\s,]/.test(sql[i])) i++
      if (sql[i] !== '(') break
      i++
      const values: Value[] = []
      for (;;) {
        while (/\s/.test(sql[i])) i++
        if (sql[i] === "'") {
          let s = ''
          i++
          for (;;) {
            const c = sql[i]
            if (c === '\\') {
              const n = sql[i + 1]
              s += n === 'n' ? '\n' : n === 't' ? '\t' : n === 'r' ? '\r' : n === '0' ? '\0' : n
              i += 2
            } else if (c === "'" && sql[i + 1] === "'") {
              s += "'"
              i += 2
            } else if (c === "'") {
              i++
              break
            } else {
              s += c
              i++
            }
          }
          values.push(s)
        } else {
          const start = i
          while (!/[,)]/.test(sql[i])) i++
          const raw = sql.slice(start, i).trim()
          values.push(raw.toUpperCase() === 'NULL' ? null : Number(raw))
        }
        while (/\s/.test(sql[i])) i++
        if (sql[i] === ',') {
          i++
          continue
        }
        if (sql[i] === ')') {
          i++
          break
        }
        throw new Error(`Unexpected "${sql.slice(i, i + 20)}" in ${table}`)
      }
      if (values.length !== columns.length) throw new Error(`${table}: ${values.length} values for ${columns.length} columns`)
      rows.push(Object.fromEntries(columns.map((c, k) => [c, values[k]])))
    }
    tables.set(table, rows)
    head.lastIndex = i
  }
  // Rows inserted without an id get the next AUTO_INCREMENT value, as MySQL gives it.
  for (const rows of tables.values()) {
    let next = 1
    for (const r of rows) {
      if (typeof r.id === 'number') next = Math.max(next, r.id + 1)
      else if ('id' in r || !('village_id' in r && 'product_id' in r)) r.id = next++
    }
  }
  return tables
}

// --- Conversion ------------------------------------------------------------------------------------------

const str = (v: Value) => (v === null || v === undefined ? undefined : String(v))
const text = (v: Value) => (v === null || v === undefined ? '' : String(v).trim())
const num = (v: Value) => (v === null || v === undefined || v === '' || Number.isNaN(Number(v)) ? undefined : Number(v))
const bi = (ar: Value, en: Value) => ({ ar: text(ar) || text(en), en: text(en) || text(ar) })
const url = (v: Value) => (typeof v === 'string' && /^https?:\/\//.test(v) ? v : undefined)
const arabicKey = (s: string) => s.replace(/[ً-ْـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/\s+/g, ' ').trim()

function summaryOf(t: string): string {
  if (t.length <= 220) return t
  const cut = t.slice(0, 220)
  const end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('، '), cut.lastIndexOf('؛ '))
  return `${end > 80 ? cut.slice(0, end + 1) : cut.trimEnd()}…`
}

const LANDMARK_KINDS: Record<string, string> = {
  religious_site: 'religious',
  archaeological_site: 'archaeological',
  historic_building: 'architecture',
  natural_heritage: 'natural',
  cultural_site: 'cultural',
}
const FACILITY_KINDS = ['school', 'clinic', 'library', 'community', 'mosque', 'church', 'council', 'other']
const facilityKind = (t: Value) => {
  const s = text(t)
  if (FACILITY_KINDS.includes(s)) return s
  if (/clinic|health/.test(s)) return 'clinic'
  if (/school|kindergarten/.test(s)) return 'school'
  if (/community|cent(re|er)/.test(s)) return 'community'
  return 'other'
}
const SOURCE_TYPES = ['book', 'article', 'archive', 'census', 'website', 'oral-history', 'map']
const POPULATION_KINDS = ['census', 'estimate', 'survey']
const SCENES = ['terraces', 'grove', 'ruins', 'hilltop', 'valley', 'plain']

const seed = parseInserts(readFileSync(join(root, 'data/qaryati_seed.mysql.sql'), 'utf8'))
const govRows = parseInserts(readFileSync(join(root, 'data/governorates.mysql.sql'), 'utf8'), {
  governorate: ['id', 'name', 'name_eng', 'description'],
}).get('governorate')!
const rows = (t: string) => seed.get(t) ?? []

const importedAt = new Date().toISOString()
const SEED_NOTE = 'Loaded from the seed; not reviewed yet.'

// Governorates: matched to the app's list by Arabic name; a repeated name (row 17, Jenin) is dropped.
const governorateDocs = new Map<string, Record<string, unknown>>()
const governorateSlug = new Map<number, string>()
const droppedGovernorates: Row[] = []
for (const g of govRows) {
  const known = knownGovernorates.find((k) => arabicKey(k.name.ar) === arabicKey(text(g.name)))
  const slug = known?.id ?? (slugify(text(g.name_eng)) || `gov-${g.id}`)
  if (governorateDocs.has(slug)) {
    droppedGovernorates.push(g)
    governorateSlug.set(g.id as number, slug)
    continue
  }
  governorateSlug.set(g.id as number, slug)
  governorateDocs.set(slug, {
    name: { ar: text(g.name), en: known?.name.en ?? text(g.name_eng) },
    description: str(g.description),
    region: known?.region ?? 'west-bank',
    center: known?.center,
    legacyId: g.id,
  })
}

// Sources
const sourceDocs = new Map<string, Record<string, unknown>>()
for (const s of rows('sources')) {
  const id = String(s.id)
  const note = text(s.notes_ar) || text(s.notes_eng) ? bi(s.notes_ar, s.notes_eng) : undefined
  sourceDocs.set(id, {
    title: text(s.title),
    type: SOURCE_TYPES.includes(text(s.source_type)) ? text(s.source_type) : 'archive',
    author: str(s.author),
    organization: str(s.organization),
    reference: text(s.reference),
    url: url(s.url),
    publishedAt: text(s.publication_date),
    accessedAt: str(s.accessed_at)?.slice(0, 10),
    villageIds: [] as string[],
    note,
    verification: 'pending',
    updatedAt: importedAt,
    lastAuditId: `import-sources-${id}`,
  })
}

// Crop catalogue
const productDocs = new Map<string, Record<string, unknown>>()
for (const p of rows('agricultural_products')) {
  productDocs.set(String(p.id), { name: bi(p.name_ar, p.name_eng), description: bi(p.description_ar, p.description_eng) })
}

// Villages: one document each, with every section inside.
const villageSlug = new Map<number, string>()
for (const v of rows('village')) villageSlug.set(v.id as number, slugify(text(v.english_name)) || `village-${v.id}`)
const of = (table: string, villageId: number) => rows(table).filter((r) => r.village_id === villageId)
const sid = (v: Value) => (v === null ? undefined : String(v))

const villageDocs = new Map<string, Record<string, unknown> & { sourceIds: string[]; nearby: Record<string, unknown>[] }>()
for (const v of rows('village')) {
  const vid = v.id as number
  const id = villageSlug.get(vid)!
  const description = bi(v.arabic_description, v.eng_description)
  const names = of('village_name', vid)
  const hash = hashString(id)
  const doc = {
    name: bi(v.current_name, v.english_name),
    altSpellings: names.filter((n) => n.name_type === 'alternative' || n.name_type === 'transliteration').map((n) => text(n.eng_name) || text(n.ar_name)),
    historicalNames: names
      .filter((n) => n.name_type === 'historical' || n.name_type === 'former')
      .map((n) => ({ name: bi(n.ar_name, n.eng_name), period: '', kind: n.name_type, meaning: str(n.meaning), sourceId: sid(n.source_id) })),
    governorateId: (typeof v.governorate_id === 'number' && governorateSlug.get(v.governorate_id)) || '',
    adminArea: bi(v.administrative_area, v.administrative_area),
    summary: { ar: summaryOf(description.ar), en: summaryOf(description.en) },
    description,
    coordinates: { lat: num(v.latitude) ?? 0, lng: num(v.longitude) ?? 0 },
    elevationM: num(v.elevation_meters),
    areaDunums: num(v.land_area_dunums),
    nearby: [] as Record<string, unknown>[],
    history: {
      overview: bi(v.historical_overview_ar, v.historical_overview_eng),
      nameOrigin: bi(v.name_origin_ar, v.name_origin_eng),
      events: of('historical_events', vid).map((e) => {
        const date = text(e.event_date)
        return {
          id: `ev-${e.id}`,
          year: date.slice(0, 4),
          // A date stored as 1 January only records the year (the seed says so in the text).
          date: date && !date.endsWith('-01-01') ? date : undefined,
          title: bi(e.title_ar, e.title_eng),
          description: bi(e.description_ar, e.description_eng),
          sourceId: sid(e.source_id),
        }
      }),
    },
    heritage: of('landmarks', vid).map((l) => ({
      id: `lm-${l.id}`,
      kind: LANDMARK_KINDS[text(l.type)] ?? 'cultural',
      name: bi(l.name_ar, l.name_eng),
      description: bi(l.description_ar, l.description_eng),
      image: url(l.images),
      sourceId: sid(l.source_id),
    })),
    culture: of('cultural_practices', vid).map((c) => ({
      id: `cp-${c.id}`,
      category: text(c.category) || 'other',
      title: bi(c.name_ar, c.name_eng),
      description: bi(c.description_ar, c.description_eng),
      sourceId: sid(c.source_id),
    })),
    agriculture: {
      // The catalogue's general description of a crop is not a practice of this village: not copied.
      crops: of('village_agricultural_products', vid).map((vp) => {
        const p = rows('agricultural_products').find((x) => x.id === vp.product_id)
        return { ...bi(p?.name_ar ?? null, p?.name_eng ?? null), productId: String(vp.product_id), sourceId: sid(vp.source_id) }
      }),
      economy: of('economic_activities', vid).map((a) => ({ ...bi(a.name_ar, a.name_eng), sourceId: sid(a.source_id) })),
    },
    facilities: of('facilities', vid).map((f) => ({
      id: `fa-${f.id}`,
      kind: facilityKind(f.type),
      name: bi(f.name_ar, f.name_eng),
      count: num(f.count),
      sourceId: sid(f.source_id),
    })),
    population: of('population_records', vid).map((p) => ({
      id: `pop-${p.id}`,
      year: Number(p.reference_year),
      population: Number(p.population),
      kind: POPULATION_KINDS.includes(text(p.type_of_figure)) ? text(p.type_of_figure) : 'estimate',
      sourceId: sid(p.source_id) ?? '',
      note: str(p.notes),
    })),
    sourceIds: [] as string[],
    coverImage: url(v.image),
    coverCaption: str(v.alt_image),
    art: { scene: SCENES[hash % SCENES.length], palette: (hash >>> 8) % 6 },
    featured: ['1', 'yes', 'true'].includes(text(v.feature_to_homepage).toLowerCase()),
    status: v.record_status === 'published' ? 'published' : 'draft',
    verification: 'pending',
    reviewHistory: [],
    createdAt: importedAt,
    updatedAt: importedAt,
    createdBy: 'import',
    updatedBy: 'import',
    lastAuditId: `import-villages-${id}`,
  }
  villageDocs.set(id, doc)
}

// Nearby villages: one link in the dump, shown from both sides; one chip per pair.
for (const r of rows('village_relations')) {
  const a = villageSlug.get(r.village_id as number)
  const b = villageSlug.get(r.related_village_id as number)
  if (!a || !b) continue
  const link = (from: string, to: string) => {
    const d = villageDocs.get(from)!
    if (d.nearby.some((n) => n.villageId === to)) return
    d.nearby.push({ name: villageDocs.get(to)!.name, distanceKm: num(r.distance_km) ?? 0, villageId: to, sourceId: sid(r.source_id), note: str(r.description) })
  }
  link(a, b)
  link(b, a)
}

// Every source a village's items cite, and the villages citing each source.
for (const [id, d] of villageDocs) {
  const cited = new Set<string>()
  const walk = (x: unknown) => {
    if (Array.isArray(x)) x.forEach(walk)
    else if (x && typeof x === 'object') {
      for (const [k, val] of Object.entries(x)) {
        if (k === 'sourceId' && typeof val === 'string' && val) cited.add(val)
        else walk(val)
      }
    }
  }
  walk({ ...d, sourceIds: [] })
  d.sourceIds = [...cited].sort((x, y) => Number(x) - Number(y))
  for (const s of cited) (sourceDocs.get(s)?.villageIds as string[] | undefined)?.push(id)
}

// --- Counts ---------------------------------------------------------------------------------------------------

type Docs = Map<string, Record<string, any>> // eslint-disable-line @typescript-eslint/no-explicit-any
function newCounts(villages: Docs, sources: Docs, govs: Docs, products: Docs) {
  const sum = (f: (d: Record<string, any>) => number) => [...villages.values()].reduce((n, d) => n + f(d), 0) // eslint-disable-line @typescript-eslint/no-explicit-any
  return {
    governorates: govs.size,
    sources: sources.size,
    villages: villages.size,
    names: sum((d) => 1 + (d.historicalNames?.length ?? 0) + (d.altSpellings?.length ?? 0)),
    population: sum((d) => d.population?.length ?? 0),
    events: sum((d) => d.history?.events?.length ?? 0),
    landmarks: sum((d) => d.heritage?.length ?? 0),
    culturalPractices: sum((d) => d.culture?.length ?? 0),
    cropCatalogue: products.size,
    villageCrops: sum((d) => d.agriculture?.crops?.length ?? 0),
    economy: sum((d) => d.agriculture?.economy?.length ?? 0),
    facilities: sum((d) => d.facilities?.length ?? 0),
    relations: sum((d) => d.nearby?.length ?? 0) / 2,
  }
}
const oldCounts = {
  governorates: govRows.length,
  sources: rows('sources').length,
  villages: rows('village').length,
  names: rows('village_name').length,
  population: rows('population_records').length,
  events: rows('historical_events').length,
  landmarks: rows('landmarks').length,
  culturalPractices: rows('cultural_practices').length,
  cropCatalogue: rows('agricultural_products').length,
  villageCrops: rows('village_agricultural_products').length,
  economy: rows('economic_activities').length,
  facilities: rows('facilities').length,
  relations: rows('village_relations').length,
}

function printTable(after: ReturnType<typeof newCounts>, label: string) {
  console.log(`\n${label}`)
  console.table(
    Object.entries(oldCounts).map(([what, old]) => {
      const now = after[what as keyof typeof after]
      return { record: what, mysql: old, firestore: now, match: old === now ? 'yes' : 'NO' }
    }),
  )
  if (droppedGovernorates.length) {
    console.log(`Governorates: ${droppedGovernorates.map((g) => `row ${g.id} (${g.name})`).join(', ')} repeats an earlier name and was dropped, so 1 fewer is expected.`)
  }
}

if (dryRun) {
  printTable(newCounts(villageDocs, sourceDocs, governorateDocs, productDocs), 'Dry run: nothing was written.')
  console.log('Villages:', [...villageDocs.keys()].join(', '))
  process.exit(0)
}

// --- Writing ------------------------------------------------------------------------------------------------------

const keyPath = process.env.FIREBASE_KEY ?? join(homedir(), 'Desktop', 'firebase-key.json')
if (!existsSync(keyPath)) {
  console.error(`No service-account key at ${keyPath}. Download it from Project settings → Service accounts.`)
  process.exit(1)
}
const key = JSON.parse(readFileSync(keyPath, 'utf8')) as { project_id?: string }
if (key.project_id !== PROJECT_ID) {
  console.error(`The key belongs to project "${key.project_id}", not ${PROJECT_ID}. Nothing was written.`)
  process.exit(1)
}

const { cert, initializeApp } = await import('firebase-admin/app')
const { FieldValue, getFirestore } = await import('firebase-admin/firestore')
initializeApp({ credential: cert(keyPath), projectId: PROJECT_ID })
const db = getFirestore()
db.settings({ ignoreUndefinedProperties: true })

const existing = await db.collection('villages').limit(1).get()
if (!existing.empty && !force) {
  console.error('Firestore already has villages. Run with --force to replace the seed documents.')
  process.exit(1)
}

type Op = { path: string; data: Record<string, unknown> }
const ops: Op[] = []
for (const [id, d] of governorateDocs) ops.push({ path: `governorates/${id}`, data: d })
for (const [id, d] of productDocs) ops.push({ path: `agriculturalProducts/${id}`, data: d })
const auditOf = (target: string, entityType: string, entityLabel: string) => ({
  userId: 'import',
  userName: 'Seed import',
  action: 'create',
  entityType,
  entityLabel,
  target,
  at: importedAt,
  createdAt: FieldValue.serverTimestamp(),
  details: 'Imported from data/qaryati_seed.mysql.sql',
  ip: '—',
})
const reviewOf = (target: string, villageId: string, kind: string, summary: { ar: string; en: string }) => ({
  target,
  villageId,
  kind,
  submittedBy: 'import',
  submittedByName: 'Seed import',
  submittedAt: importedAt,
  status: 'pending',
  summary,
  changes: [],
  history: [{ at: importedAt, by: 'import', action: 'submitted', note: SEED_NOTE }],
  payload: null,
})
for (const [id, d] of sourceDocs) {
  const target = `sources/${id}`
  ops.push({ path: target, data: d })
  ops.push({ path: `auditLogs/import-sources-${id}`, data: auditOf(target, 'source', d.title as string) })
  ops.push({ path: `submissions/seed-sources-${id}`, data: reviewOf(target, (d.villageIds as string[])[0] ?? '', 'source', { en: `Source: ${d.title}`, ar: `مصدر: ${d.title}` }) })
}
for (const [id, d] of villageDocs) {
  const name = d.name as { ar: string; en: string }
  const target = `villages/${id}`
  ops.push({ path: target, data: d })
  ops.push({ path: `auditLogs/import-villages-${id}`, data: auditOf(target, 'village', name.en) })
  ops.push({ path: `submissions/seed-villages-${id}`, data: reviewOf(target, id, 'new-village', { en: `Village profile: ${name.en}`, ar: `ملف القرية: ${name.ar}` }) })
}

for (let i = 0; i < ops.length; i += 400) {
  const batch = db.batch()
  for (const op of ops.slice(i, i + 400)) batch.set(db.doc(op.path), op.data)
  await batch.commit()
}
console.log(`Wrote ${ops.length} documents to ${PROJECT_ID}.`)

// Read back what is stored, so the table compares the database itself with the dump.
const read = async (c: string): Promise<Docs> => new Map((await db.collection(c).get()).docs.map((d) => [d.id, d.data()]))
printTable(newCounts(await read('villages'), await read('sources'), await read('governorates'), await read('agriculturalProducts')), 'Counts: MySQL dump vs Firestore (read back)')
